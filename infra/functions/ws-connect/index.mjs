import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.CONNECTIONS_TABLE || 'colage-connections-dev';

export const handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const domain = event.queryStringParameters?.domain || 'unknown';
  const userId = event.queryStringParameters?.userId || 'anonymous';

  try {
    await ddb.send(new PutCommand({
      TableName: TABLE,
      Item: {
        connectionId,
        universityDomain: domain,
        userId,
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
