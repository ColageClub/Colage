import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { response, parseBody, sanitize } from './shared/validate.mjs';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const USERS_TABLE = process.env.USERS_TABLE;

const ALLOWED_FIELDS = new Set(['displayName', 'bio', 'major', 'socialLinks', 'profilePhotoURL', 'isVisible', 'serverType']);

const VALID_PLATFORMS = new Set([
  'instagram', 'twitter', 'snapchat', 'tiktok', 'linkedin',
  'spotify', 'venmo', 'cashapp', 'discord', 'youtube',
  'github', 'facebook', 'pinterest', 'threads', 'bereal',
]);

function validateFields(body) {
  for (const key of Object.keys(body)) {
    if (!ALLOWED_FIELDS.has(key)) continue;

    const val = body[key];

    switch (key) {
      case 'displayName':
        if (typeof val !== 'string') return 'displayName must be a string';
        if (val.trim().length < 1 || val.trim().length > 100) return 'displayName must be 1-100 characters';
        break;
      case 'bio':
        if (val !== null && typeof val !== 'string') return 'bio must be a string or null';
        if (typeof val === 'string' && val.length > 500) return 'bio must be max 500 characters';
        break;
      case 'major':
        if (val !== null && typeof val !== 'string') return 'major must be a string or null';
        if (typeof val === 'string' && val.length > 100) return 'major must be max 100 characters';
        break;
      case 'profilePhotoURL':
        if (typeof val !== 'string') return 'profilePhotoURL must be a string';
        if (!val.startsWith('https://')) return 'profilePhotoURL must start with https://';
        if (val.length > 500) return 'profilePhotoURL must be max 500 characters';
        break;
      case 'isVisible':
        if (typeof val !== 'boolean') return 'isVisible must be a boolean';
        break;
      case 'serverType':
        if (typeof val !== 'string') return 'serverType must be a string';
        if (val.length > 50) return 'serverType must be max 50 characters';
        break;
      case 'socialLinks':
        if (!Array.isArray(val)) return 'socialLinks must be an array';
        if (val.length > 10) return 'socialLinks must have max 10 items';
        for (let i = 0; i < val.length; i++) {
          const link = val[i];
          if (!link || typeof link !== 'object') return `socialLinks[${i}] must be an object`;
          if (!VALID_PLATFORMS.has(link.platform)) return `socialLinks[${i}].platform is invalid`;
          if (typeof link.handle !== 'string') return `socialLinks[${i}].handle must be a string`;
          if (link.handle.length > 100) return `socialLinks[${i}].handle must be max 100 characters`;
        }
        break;
    }
  }
  return null;
}

function sanitizeFields(body) {
  const sanitized = {};
  for (const key of Object.keys(body)) {
    if (!ALLOWED_FIELDS.has(key)) continue;
    const val = body[key];
    switch (key) {
      case 'displayName':
        sanitized[key] = sanitize(val, 100);
        break;
      case 'bio':
        sanitized[key] = val === null ? null : sanitize(val, 500);
        break;
      case 'major':
        sanitized[key] = val === null ? null : sanitize(val, 100);
        break;
      case 'profilePhotoURL':
        sanitized[key] = val;
        break;
      case 'isVisible':
        sanitized[key] = val;
        break;
      case 'serverType':
        sanitized[key] = sanitize(val, 50);
        break;
      case 'socialLinks':
        sanitized[key] = val.slice(0, 10).map(l => ({
          platform: l.platform,
          handle: sanitize(l.handle, 100),
        }));
        break;
    }
  }
  return sanitized;
}

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

    const body = parseBody(event);
    if (!body) return response(400, { error: 'Request body is required' });

    // Validate all fields
    const validationError = validateFields(body);
    if (validationError) return response(400, { error: validationError });

    // Sanitize and strip disallowed fields
    const clean = sanitizeFields(body);

    const now = new Date().toISOString();
    let updateExpression = 'SET updatedAt = :now';
    const expressionValues = { ':now': now };
    const expressionNames = {};

    for (const [field, value] of Object.entries(clean)) {
      updateExpression += `, #${field} = :${field}`;
      expressionNames[`#${field}`] = field;
      expressionValues[`:${field}`] = value;
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
