import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const USERS_TABLE = process.env.USERS_TABLE;
const UNIVERSITIES_TABLE = process.env.UNIVERSITIES_TABLE;

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { email, displayName, bio, major, socialLinks, universityDomain } = body;

    if (!email || !displayName || !universityDomain) {
      return response(400, { error: 'email, displayName, and universityDomain required' });
    }

    const userId = randomUUID();
    const now = new Date().toISOString();

    const profile = {
      userId,
      email: email.toLowerCase(),
      universityDomain,
      displayName,
      bio: bio || null,
      major: major || null,
      profilePhotoURL: null,
      socialLinks: socialLinks || [],
      isVisible: true,
      createdAt: now,
      updatedAt: now,
    };

    // Save user profile
    await ddb.send(new PutCommand({
      TableName: USERS_TABLE,
      Item: profile,
      ConditionExpression: 'attribute_not_exists(userId)',
    }));

    // Auto-create or increment university
    try {
      const uni = await ddb.send(new GetCommand({
        TableName: UNIVERSITIES_TABLE,
        Key: { domain: universityDomain },
      }));

      if (uni.Item) {
        // Increment member count
        await ddb.send(new UpdateCommand({
          TableName: UNIVERSITIES_TABLE,
          Key: { domain: universityDomain },
          UpdateExpression: 'SET memberCount = memberCount + :one',
          ExpressionAttributeValues: { ':one': 1 },
        }));
      } else {
        // Auto-create university
        const uniName = universityDomain
          .replace('.edu', '')
          .split('.')
          .pop()
          .replace(/^\w/, c => c.toUpperCase());

        await ddb.send(new PutCommand({
          TableName: UNIVERSITIES_TABLE,
          Item: {
            domain: universityDomain,
            name: `${uniName} University`,
            memberCount: 1,
            brandingThemes: [{
              id: 'default',
              name: 'Classic',
              primaryColor: '#6C5CE7',
              accentColor: '#00CEC9',
              textColor: '#FFFFFF',
              backgroundAsset: null,
            }],
            createdAt: now,
          },
        }));
      }
    } catch (e) {
      console.warn('University upsert warning:', e.message);
    }

    return response(201, { profile });
  } catch (err) {
    console.error('create-profile error:', err);
    return response(500, { error: 'Failed to create profile' });
  }
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}
