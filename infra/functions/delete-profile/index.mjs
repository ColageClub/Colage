import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { CognitoIdentityProviderClient, AdminDeleteUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { response } from './shared/validate.mjs';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const cognito = new CognitoIdentityProviderClient({});
const s3 = new S3Client({});
const USERS_TABLE = process.env.USERS_TABLE;
const LOCATIONS_TABLE = process.env.LOCATIONS_TABLE;
const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE;
const UNIVERSITIES_TABLE = process.env.UNIVERSITIES_TABLE;
const PHOTOS_BUCKET = process.env.PROFILE_PHOTOS_BUCKET;
const USER_POOL_ID = process.env.USER_POOL_ID;

export const handler = async (event) => {
  try {
    const userId = event.pathParameters?.userId;
    if (!userId) return response(400, { error: 'userId required' });

    // Verify caller owns this profile via JWT email → by-email GSI
    const callerEmail = event.requestContext?.authorizer?.jwt?.claims?.email;
    if (!callerEmail) return response(401, { error: 'Unauthorized' });

    const lookup = await ddb.send(new QueryCommand({
      TableName: USERS_TABLE,
      IndexName: 'by-email',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': callerEmail },
    }));

    if (!lookup.Items?.length || lookup.Items[0].userId !== userId) {
      return response(403, { error: 'Forbidden' });
    }

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

    // 4. Delete connections for this user
    try {
      if (universityDomain && CONNECTIONS_TABLE) {
        const conns = await ddb.send(new QueryCommand({
          TableName: CONNECTIONS_TABLE,
          IndexName: 'by-university',
          KeyConditionExpression: 'universityDomain = :ud',
          FilterExpression: 'userId = :uid',
          ExpressionAttributeValues: { ':ud': universityDomain, ':uid': userId },
        }));
        if (conns.Items?.length) {
          await Promise.all(conns.Items.map(item =>
            ddb.send(new DeleteCommand({
              TableName: CONNECTIONS_TABLE,
              Key: { connectionId: item.connectionId },
            }))
          ));
        }
      }
    } catch (err) {
      console.warn('Failed to delete connections:', err.message);
    }

    // 5. Decrement university memberCount
    try {
      if (universityDomain && UNIVERSITIES_TABLE) {
        await ddb.send(new UpdateCommand({
          TableName: UNIVERSITIES_TABLE,
          Key: { domain: universityDomain },
          UpdateExpression: 'SET memberCount = memberCount - :one',
          ConditionExpression: 'memberCount > :zero',
          ExpressionAttributeValues: { ':one': 1, ':zero': 0 },
        }));
      }
    } catch (err) {
      console.warn('Failed to decrement university memberCount:', err.message);
    }

    // 6. Delete S3 photos
    try {
      if (PHOTOS_BUCKET) {
        const listed = await s3.send(new ListObjectsV2Command({
          Bucket: PHOTOS_BUCKET,
          Prefix: `photos/${userId}/`,
        }));
        if (listed.Contents?.length) {
          await s3.send(new DeleteObjectsCommand({
            Bucket: PHOTOS_BUCKET,
            Delete: {
              Objects: listed.Contents.map(obj => ({ Key: obj.Key })),
            },
          }));
        }
      }
    } catch (err) {
      console.warn('Failed to delete S3 photos:', err.message);
    }

    return response(200, { message: 'Account deleted' });
  } catch (err) {
    console.error('delete-profile error:', err);
    return response(500, { error: 'Failed to delete account' });
  }
};
