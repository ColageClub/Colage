import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';
import { response, isValidCoordinate, sanitize, rateLimit, getClientIP } from './shared/validate.mjs';
import { encode as geohashEncode, decode as geohashDecode, neighbors } from './shared/geohash.mjs';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const LOCATIONS_TABLE = process.env.LOCATIONS_TABLE;
const USERS_TABLE = process.env.USERS_TABLE;

export const handler = async (event) => {
  try {
    // Rate limit: 60 requests per minute per IP (map panning + auto-refresh)
    const ip = getClientIP(event);
    const rl = await rateLimit(`viewport:${ip}`, 60, 60);
    if (!rl.allowed) {
      return response(429, { error: 'Too many requests' });
    }

    const params = event.queryStringParameters || {};
    const domain = sanitize(params.domain, 100);

    if (!domain || !domain.endsWith('.edu')) {
      return response(400, { error: 'Valid .edu domain required' });
    }

    const swLat = parseFloat(params.swLat);
    const swLng = parseFloat(params.swLng);
    const neLat = parseFloat(params.neLat);
    const neLng = parseFloat(params.neLng);
    const myLat = params.myLat ? parseFloat(params.myLat) : null;
    const myLng = params.myLng ? parseFloat(params.myLng) : null;
    const floor = params.floor ? parseInt(params.floor, 10) : null;
    const limit = Math.min(Math.max(parseInt(params.limit, 10) || 100, 1), 200);

    // Validate viewport bounds
    if (!isValidCoordinate(swLat, swLng) || !isValidCoordinate(neLat, neLng)) {
      return response(400, { error: 'Valid viewport bounds required (swLat, swLng, neLat, neLng)' });
    }

    // Get requesting user's ID from JWT to exclude self
    let requestingUserId = null;
    try {
      const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
      const token = authHeader.replace('Bearer ', '');
      if (token) {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
          if (payload.email) {
            const lookup = await ddb.send(new QueryCommand({
              TableName: USERS_TABLE,
              IndexName: 'by-email',
              KeyConditionExpression: 'email = :email',
              ExpressionAttributeValues: { ':email': payload.email.toLowerCase() },
              ProjectionExpression: 'userId',
            }));
            if (lookup.Items?.length) {
              requestingUserId = lookup.Items[0].userId;
            }
          }
        }
      }
    } catch (_) {
      // Non-fatal — proceed without exclusion
    }

    // Compute geohash cells that cover the viewport
    const cells = viewportGeohashCells(swLat, swLng, neLat, neLng);

    // Query each geohash cell in parallel
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

    // Deduplicate and filter to viewport bounds
    const seen = new Set();
    let locationItems = [];
    for (const result of results) {
      for (const item of result.Items || []) {
        if (seen.has(item.userId)) continue;
        seen.add(item.userId);

        // Filter: must be within viewport bounds
        if (item.latitude < swLat || item.latitude > neLat) continue;
        if (item.longitude < swLng || item.longitude > neLng) continue;

        // Filter by floor if specified
        if (floor !== null && (item.floor || 1) !== floor) continue;

        // Exclude requesting user
        if (item.userId === requestingUserId) continue;

        locationItems.push(item);
      }
    }

    const totalInViewport = locationItems.length;

    // Calculate distance from requester if position provided
    if (myLat !== null && myLng !== null && isValidCoordinate(myLat, myLng)) {
      locationItems = locationItems.map(item => ({
        ...item,
        _distance: haversineDistance(myLat, myLng, item.latitude, item.longitude),
      }));
      locationItems.sort((a, b) => a._distance - b._distance);
    }

    // Truncate to limit
    const truncated = locationItems.length > limit;
    const limitedItems = locationItems.slice(0, limit);

    if (!limitedItems.length) {
      return response(200, { students: [], totalInViewport, truncated: false });
    }

    // Batch get profiles
    const userIds = [...new Set(limitedItems.map(l => l.userId))];
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

    // Build response
    const students = limitedItems
      .filter(loc => profiles[loc.userId])
      .map(loc => ({
        userId: loc.userId,
        latitude: loc.latitude,
        longitude: loc.longitude,
        floor: loc.floor || 1,
        distance: Math.round(loc._distance || 0),
        lastSeen: loc.timestamp || new Date().toISOString(),
        displayName: profiles[loc.userId].displayName || 'Student',
        profilePhotoURL: profiles[loc.userId].profilePhotoURL || null,
        major: profiles[loc.userId].major || null,
        bio: profiles[loc.userId].bio || null,
      }));

    return response(200, { students, totalInViewport, truncated });
  } catch (err) {
    console.error('get-nearby-viewport error:', err);
    return response(500, { error: 'Failed to get viewport students' });
  }
};

/**
 * Compute geohash cells that cover a viewport bounding box.
 * Uses precision 6 (~1.2km cells) for viewport queries — good balance of coverage vs query count.
 * Returns unique geohash prefixes to query.
 */
function viewportGeohashCells(swLat, swLng, neLat, neLng) {
  const precision = 6; // ~1.2km cells — good for campus-scale viewports

  // Sample points across the viewport to find all covering cells
  const cells = new Set();

  // Get cell size at this precision for stepping
  const sampleHash = geohashEncode(swLat, swLng, precision);
  const sampleBox = geohashDecode(sampleHash);
  const latStep = (sampleBox.latMax - sampleBox.latMin) * 0.9; // Slightly less than cell size to avoid gaps
  const lngStep = (sampleBox.lngMax - sampleBox.lngMin) * 0.9;

  // Walk across the viewport in steps, collecting all unique cells
  for (let lat = swLat; lat <= neLat + latStep; lat += latStep) {
    for (let lng = swLng; lng <= neLng + lngStep; lng += lngStep) {
      const clampedLat = Math.min(Math.max(lat, -90), 90);
      const clampedLng = Math.min(Math.max(lng, -180), 180);
      cells.add(geohashEncode(clampedLat, clampedLng, precision));
    }
  }

  // Cap at 50 cells to prevent abuse (zoomed-out queries)
  const cellArray = [...cells];
  if (cellArray.length > 50) {
    return cellArray.slice(0, 50);
  }
  return cellArray;
}

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
