import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.CONNECTIONS_TABLE || 'colage-connections-dev';
const USERS_TABLE = process.env.USERS_TABLE;

export const handler = async (event) => {
  const connectionId = event.requestContext.connectionId;

  try {
    // Require JWT token as query param (WebSocket $connect can't use Authorization header)
    const token = event.queryStringParameters?.token;
    if (!token) {
      return { statusCode: 401, body: 'Token required' };
    }

    // Decode JWT payload (base64 middle segment) to extract email
    let claims;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Invalid JWT format');
      const payload = Buffer.from(parts[1], 'base64url').toString('utf8');
      claims = JSON.parse(payload);
    } catch {
      return { statusCode: 401, body: 'Invalid token' };
    }

    const email = claims.email;
    if (!email) {
      return { statusCode: 401, body: 'Invalid token: no email claim' };
    }

    // Look up verified userId and universityDomain from by-email GSI
    const lookup = await ddb.send(new QueryCommand({
      TableName: USERS_TABLE,
      IndexName: 'by-email',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email.toLowerCase() },
    }));

    if (!lookup.Items?.length) {
      return { statusCode: 401, body: 'User not found' };
    }

    const user = lookup.Items[0];

    // Store verified userId and universityDomain (not self-reported)
    await ddb.send(new PutCommand({
      TableName: TABLE,
      Item: {
        connectionId,
        universityDomain: user.universityDomain || 'unknown',
        userId: user.userId,
        connectedAt: new Date().toISOString(),
        ttl: Math.floor(Date.now() / 1000) + 86400, // 24h TTL
      },
    }));

    return { statusCode: 200, body: 'Connected' };
  } catch (err) {
    console.error('ws-connect error:', err);
    return { statusCode: 500, body: 'Connect failed' };
  }
};
