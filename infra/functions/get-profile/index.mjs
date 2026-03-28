import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { response } from './shared/validate.mjs';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const USERS_TABLE = process.env.USERS_TABLE;

export const handler = async (event) => {
  try {
    const userId = event.pathParameters?.userId;
    if (!userId) return response(400, { error: 'userId required' });

    const result = await ddb.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { userId },
    }));

    if (!result.Item) {
      return response(404, { error: 'User not found' });
    }

    // Strip sensitive fields
    const { email, ...publicProfile } = result.Item;

    return response(200, { profile: publicProfile });
  } catch (err) {
    console.error('get-profile error:', err);
    return response(500, { error: 'Failed to get profile' });
  }
};
