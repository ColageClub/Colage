import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const USERS_TABLE = process.env.USERS_TABLE;

export const handler = async (event) => {
  try {
    const email = event.queryStringParameters?.email;
    if (!email) return response(400, { error: 'email query param required' });

    // Scan for user by email (GSI would be better but this works for now)
    const result = await ddb.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email.toLowerCase() },
    }));

    if (!result.Items || result.Items.length === 0) {
      return response(404, { error: 'User not found' });
    }

    const { email: _, ...publicProfile } = result.Items[0];
    return response(200, { profile: publicProfile });
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
