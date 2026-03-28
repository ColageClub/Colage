import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import { response, parseBody, validate, sanitize, isValidEduEmail, rateLimit, getClientIP } from './shared/validate.mjs';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const USERS_TABLE = process.env.USERS_TABLE;
const UNIVERSITIES_TABLE = process.env.UNIVERSITIES_TABLE;

// Allowed social platforms (reject garbage)
const VALID_PLATFORMS = new Set([
  'instagram', 'tiktok', 'x', 'snapchat', 'facebook',
  'bereal', 'linkedin', 'custom1', 'custom2', 'custom3',
]);

export const handler = async (event) => {
  try {
    // Rate limit: 3 profile creations per hour per IP
    const ip = getClientIP(event);
    const rl = await rateLimit(`create-profile:${ip}`, 3, 3600);
    if (!rl.allowed) {
      return response(429, { error: 'Too many accounts created. Try again later.' });
    }

    // Verify JWT email matches request body email
    const jwtEmail = event.requestContext?.authorizer?.jwt?.claims?.email;
    if (!jwtEmail) return response(401, { error: 'Unauthorized' });

    const body = parseBody(event);
    const err = validate(body, ['email', 'displayName', 'universityDomain']);
    if (err) return response(400, { error: err });

    const email = sanitize(body.email, 254).toLowerCase();

    if (email !== jwtEmail.toLowerCase()) {
      return response(403, { error: 'Email does not match authenticated user' });
    }
    const displayName = sanitize(body.displayName, 100);
    const bio = body.bio ? sanitize(body.bio, 500) : null;
    const major = body.major ? sanitize(body.major, 100) : null;
    const universityDomain = sanitize(body.universityDomain, 100).toLowerCase();

    if (!isValidEduEmail(email)) {
      return response(400, { error: 'Valid .edu email required' });
    }

    // Check for duplicate email
    const existing = await ddb.send(new QueryCommand({
      TableName: USERS_TABLE,
      IndexName: 'by-email',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email },
    }));
    if (existing.Items?.length) {
      return response(409, { error: 'A profile already exists for this email' });
    }
    if (!universityDomain.endsWith('.edu')) {
      return response(400, { error: 'Valid .edu domain required' });
    }
    if (displayName.length < 1 || displayName.length > 100) {
      return response(400, { error: 'Display name must be 1-100 characters' });
    }

    // Sanitize social links
    const rawLinks = Array.isArray(body.socialLinks) ? body.socialLinks : [];
    const socialLinks = rawLinks
      .filter(l => l && VALID_PLATFORMS.has(l.platform) && typeof l.handle === 'string')
      .slice(0, 10) // Max 10 links
      .map(l => ({
        platform: l.platform,
        handle: sanitize(l.handle, 200),
      }));

    const userId = randomUUID();
    const now = new Date().toISOString();

    const profile = {
      userId,
      email,
      universityDomain,
      displayName,
      bio,
      major,
      profilePhotoURL: null,
      socialLinks,
      isVisible: true,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

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
        await ddb.send(new UpdateCommand({
          TableName: UNIVERSITIES_TABLE,
          Key: { domain: universityDomain },
          UpdateExpression: 'SET memberCount = memberCount + :one',
          ExpressionAttributeValues: { ':one': 1 },
        }));
      } else {
        const uniName = universityDomain.replace('.edu', '').toUpperCase();
        await ddb.send(new PutCommand({
          TableName: UNIVERSITIES_TABLE,
          Item: {
            domain: universityDomain,
            name: `${uniName} University`,
            memberCount: 1,
            brandingThemes: [{
              id: 'default',
              name: 'Classic',
              primaryColor: '#A51C30',
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
