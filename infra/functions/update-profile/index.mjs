import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const USERS_TABLE = process.env.USERS_TABLE;

export const handler = async (event) => {
  try {
    const userId = event.pathParameters?.userId;
    if (!userId) return response(400, { error: 'userId required' });

    // Verify caller owns this profile (from JWT)
    const callerSub = event.requestContext?.authorizer?.jwt?.claims?.sub;
    // TODO: map Cognito sub → userId for proper auth check

    const body = JSON.parse(event.body);
    const allowedFields = ['displayName', 'bio', 'major', 'socialLinks', 'profilePhotoURL', 'isVisible', 'serverType'];
    const now = new Date().toISOString();

    let updateExpression = 'SET updatedAt = :now';
    const expressionValues = { ':now': now };
    const expressionNames = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateExpression += `, #${field} = :${field}`;
        expressionNames[`#${field}`] = field;
        expressionValues[`:${field}`] = body[field];
      }
    }

    const result = await ddb.send(new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { userId },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: Object.keys(expressionNames).length ? expressionNames : undefined,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: 'ALL_NEW',
    }));

    const { email, ...publicProfile } = result.Attributes;
    return response(200, { profile: publicProfile });
  } catch (err) {
    console.error('update-profile error:', err);
    return response(500, { error: 'Failed to update profile' });
  }
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}
