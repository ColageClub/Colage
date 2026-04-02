import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { response, parseBody, isValidCoordinate, rateLimit, getClientIP } from './shared/validate.mjs';
import { encode as geohashEncode } from './shared/geohash.mjs';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const LOCATIONS_TABLE = process.env.LOCATIONS_TABLE;
const USERS_TABLE = process.env.USERS_TABLE;

export const handler = async (event) => {
  try {
    // Rate limit: 60 requests per minute per IP
    const ip = getClientIP(event);
    const rl = await rateLimit(`post-loc:${ip}`, 60, 60);
    if (!rl.allowed) {
      return response(429, { error: 'Too many requests' });
    }

    const body = parseBody(event);
    if (!body) {
      return response(400, { error: 'Request body required' });
    }

    const { latitude, longitude, altitude, floor } = body;

    if (!isValidCoordinate(latitude, longitude)) {
      return response(400, { error: 'Valid coordinates required' });
    }

    // Validate floor range (-2 to 200)
    const validFloor = Number.isInteger(floor) ? Math.max(-2, Math.min(floor, 200)) : 1;
    const validAltitude = typeof altitude === 'number' ? altitude : 0;

    // Get userId from JWT email
    const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return response(401, { error: 'Authorization required' });
    }

    let email;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Invalid JWT');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
      email = payload.email;
    } catch {
      return response(401, { error: 'Invalid token' });
    }

    if (!email) {
      return response(401, { error: 'Invalid token: no email claim' });
    }

    // Look up userId and universityDomain
    const lookup = await ddb.send(new QueryCommand({
      TableName: USERS_TABLE,
      IndexName: 'by-email',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email.toLowerCase() },
    }));

    if (!lookup.Items?.length) {
      return response(401, { error: 'User not found' });
    }

    const user = lookup.Items[0];
    const userId = user.userId;
    const domain = user.universityDomain || 'unknown';

    // Compute geohash
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const geohash = geohashEncode(lat, lng, 7);

    // Store location with 2-min TTL
    await ddb.send(new PutCommand({
      TableName: LOCATIONS_TABLE,
      Item: {
        universityDomain: domain,
        userId,
        latitude: lat,
        longitude: lng,
        altitude: validAltitude,
        floor: validFloor,
        geohash,
        status: 'active',
        timestamp: new Date().toISOString(),
        ttl: Math.floor(Date.now() / 1000) + 120,
      },
    }));

    return response(200, { success: true });
  } catch (err) {
    console.error('post-location error:', err);
    return response(500, { error: 'Failed to post location' });
  }
};
