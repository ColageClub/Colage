import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';
import { response, isValidCoordinate, sanitize, rateLimit, getClientIP } from './shared/validate.mjs';
import { encode as geohashEncode, neighbors, precisionForRadius } from './shared/geohash.mjs';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const LOCATIONS_TABLE = process.env.LOCATIONS_TABLE;
const USERS_TABLE = process.env.USERS_TABLE;

export const handler = async (event) => {
  try {
    // Rate limit: 30 requests per minute per IP (map refreshes)
    const ip = getClientIP(event);
    const rl = await rateLimit(`get-nearby:${ip}`, 30, 60);
    if (!rl.allowed) {
      return response(429, { error: 'Too many requests' });
    }

    const params = event.queryStringParameters || {};
    const domain = sanitize(params.domain, 100);

    if (!domain || !domain.endsWith('.edu')) {
      return response(400, { error: 'Valid .edu domain required' });
    }

    const lat = params.lat ? parseFloat(params.lat) : null;
    const lng = params.lng ? parseFloat(params.lng) : null;
    const maxDistance = params.maxDistance ? parseFloat(params.maxDistance) : 5000;

    // Validate coordinates if provided
    if (lat !== null && lng !== null && !isValidCoordinate(lat, lng)) {
      return response(400, { error: 'Invalid coordinates' });
    }

    // Cap max distance to 10,000 feet (~2 miles) — no stalking across town
    const cappedMaxDist = Math.min(Math.max(maxDistance, 0), 10000);

    let locationItems;

    if (lat !== null && lng !== null) {
      // ── Geohash spatial query ──────────────────────────
      // Pick precision based on search radius, then query the center cell + 8 neighbors
      const precision = precisionForRadius(cappedMaxDist);
      const centerHash = geohashEncode(lat, lng, precision);
      const cells = neighbors(centerHash);

      // Query each geohash cell in parallel using the GSI
      const cellQueries = cells.map(cell =>
        ddb.send(new QueryCommand({
          TableName: LOCATIONS_TABLE,
          IndexName: 'geohash-index',
          KeyConditionExpression: 'universityDomain = :domain AND begins_with(geohash, :prefix)',
          ExpressionAttributeValues: {
            ':domain': domain,
            ':prefix': cell,
          },
        }))
      );

      const results = await Promise.all(cellQueries);
      // Deduplicate by userId (a student might appear in overlapping queries)
      const seen = new Set();
      locationItems = [];
      for (const result of results) {
        for (const item of result.Items || []) {
          if (!seen.has(item.userId)) {
            seen.add(item.userId);
            locationItems.push(item);
          }
        }
      }
    } else {
      // ── Fallback: no coordinates provided, query all at university ──
      const result = await ddb.send(new QueryCommand({
        TableName: LOCATIONS_TABLE,
        KeyConditionExpression: 'universityDomain = :domain',
        ExpressionAttributeValues: { ':domain': domain },
      }));
      locationItems = result.Items || [];
    }

    if (!locationItems.length) {
      return response(200, { students: [] });
    }

    // Batch get profiles (max 100 at a time)
    const userIds = [...new Set(locationItems.map(l => l.userId))];
    const profiles = {};

    for (let i = 0; i < userIds.length; i += 100) {
      const batch = userIds.slice(i, i + 100);
      const result = await ddb.send(new BatchGetCommand({
        RequestItems: {
          [USERS_TABLE]: {
            Keys: batch.map(id => ({ userId: id })),
            ProjectionExpression: 'userId, displayName, profilePhotoURL, bio, major, socialLinks, isVisible',
          },
        },
      }));
      for (const item of result.Responses?.[USERS_TABLE] || []) {
        if (item.isVisible !== false) {
          profiles[item.userId] = item;
        }
      }
    }

    // Combine location + profile, calculate exact distance, filter
    const students = locationItems
      .filter(loc => profiles[loc.userId])
      .map(loc => {
        const dist = lat !== null && lng !== null
          ? haversineDistance(lat, lng, loc.latitude, loc.longitude)
          : 0;
        return {
          profile: profiles[loc.userId],
          location: {
            latitude: loc.latitude,
            longitude: loc.longitude,
            altitude: loc.altitude || 0,
            floor: loc.floor || 1,
            timestamp: loc.timestamp,
          },
          distance: Math.round(dist),
        };
      })
      .filter(s => s.distance <= cappedMaxDist)
      .sort((a, b) => a.distance - b.distance);

    return response(200, { students });
  } catch (err) {
    console.error('get-nearby error:', err);
    return response(500, { error: 'Failed to get nearby students' });
  }
};

// Haversine distance in feet
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 20902231; // Earth radius in feet
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
