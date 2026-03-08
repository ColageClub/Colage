import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const LOCATIONS_TABLE = process.env.LOCATIONS_TABLE;
const USERS_TABLE = process.env.USERS_TABLE;

export const handler = async (event) => {
  try {
    const { domain, lat, lng, maxDistance } = event.queryStringParameters || {};

    if (!domain) return response(400, { error: 'domain required' });

    // Get all active locations for this university
    const locations = await ddb.send(new QueryCommand({
      TableName: LOCATIONS_TABLE,
      KeyConditionExpression: 'universityDomain = :domain',
      ExpressionAttributeValues: { ':domain': domain },
    }));

    if (!locations.Items?.length) {
      return response(200, { students: [] });
    }

    // Batch get profiles
    const userIds = locations.Items.map(l => l.userId);
    const uniqueIds = [...new Set(userIds)];

    // DynamoDB batch get (max 100 at a time)
    const batches = [];
    for (let i = 0; i < uniqueIds.length; i += 100) {
      batches.push(uniqueIds.slice(i, i + 100));
    }

    const profiles = {};
    for (const batch of batches) {
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

    // Combine location + profile, calculate distance if caller location provided
    const callerLat = lat ? parseFloat(lat) : null;
    const callerLng = lng ? parseFloat(lng) : null;
    const maxDist = maxDistance ? parseFloat(maxDistance) : 5000; // feet

    const students = locations.Items
      .filter(loc => profiles[loc.userId])
      .map(loc => {
        const dist = callerLat && callerLng
          ? haversineDistance(callerLat, callerLng, loc.latitude, loc.longitude)
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
      .filter(s => s.distance <= maxDist)
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

function response(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}
