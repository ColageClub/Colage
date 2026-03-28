import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { CognitoIdentityProviderClient, AdminDeleteUserCommand } from '@aws-sdk/client-cognito-identity-provider';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const cognito = new CognitoIdentityProviderClient({});
const USERS_TABLE = process.env.USERS_TABLE;
const LOCATIONS_TABLE = process.env.LOCATIONS_TABLE;
const USER_POOL_ID = process.env.USER_POOL_ID;

export const handler = async (event) => {
  try {
    const userId = event.pathParameters?.userId;
    if (!userId) return response(400, { error: 'userId required' });

    // Get user to find their email (needed for Cognito deletion)
    const userResult = await ddb.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { userId },
    }));

    if (!userResult.Item) {
      return response(404, { error: 'User not found' });
    }

    const email = userResult.Item.email;
    const universityDomain = userResult.Item.universityDomain;

    // 1. Delete from users table
    await ddb.send(new DeleteCommand({
      TableName: USERS_TABLE,
      Key: { userId },
    }));

    // 2. Delete from locations table
    if (universityDomain) {
      try {
        await ddb.send(new DeleteCommand({
          TableName: LOCATIONS_TABLE,
          Key: { universityDomain, userId },
        }));
      } catch (err) {
        console.warn('Failed to delete location (may not exist):', err.message);
      }
    }

    // 3. Delete from Cognito
    if (email && USER_POOL_ID) {
      try {
        await cognito.send(new AdminDeleteUserCommand({
          UserPoolId: USER_POOL_ID,
          Username: email,
        }));
      } catch (err) {
        console.warn('Failed to delete Cognito user (may not exist):', err.message);
      }
    }

    return response(200, { message: 'Account deleted' });
  } catch (err) {
    console.error('delete-profile error:', err);
    return response(500, { error: 'Failed to delete account' });
  }
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}
