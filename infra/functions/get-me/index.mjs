import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const USERS_TABLE = process.env.USERS_TABLE;

export const handler = async (event) => {
  try {
    // Extract email from JWT claims (Cognito authorizer)
    const email = event.requestContext?.authorizer?.jwt?.claims?.email;
    if (!email) return response(401, { error: 'Unauthorized' });

    // Query by-email GSI instead of scanning
    const result = await ddb.send(new QueryCommand({
      TableName: USERS_TABLE,
      IndexName: 'by-email',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email.toLowerCase() },
    }));

    if (!result.Items || result.Items.length === 0) {
      return response(404, { error: 'User not found' });
    }

    // Return full profile (including email) since this is the user's own profile
    return response(200, { profile: result.Items[0] });
  } catch (err) {
    console.error('get-me error:', err);
    return response(500, { error: 'Failed to get profile' });
  }
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}
