import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { isValidCoordinate } from './shared/validate.mjs';
import { encode as geohashEncode } from './shared/geohash.mjs';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE || 'colage-connections-dev';
const LOCATIONS_TABLE = process.env.LOCATIONS_TABLE;

export const handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const { domainName, stage } = event.requestContext;
  const apigw = new ApiGatewayManagementApiClient({
    endpoint: `https://${domainName}/${stage}`,
  });

  try {
    let body;
    try {
      body = JSON.parse(event.body);
    } catch {
      return { statusCode: 400, body: 'Invalid JSON' };
    }

    const { data } = body;

    if (!data?.userId || typeof data.userId !== 'string' || data.userId.length > 128) {
      return { statusCode: 400, body: 'Invalid userId' };
    }
    if (!isValidCoordinate(data.latitude, data.longitude)) {
      return { statusCode: 400, body: 'Invalid coordinates' };
    }

    // Validate floor range (-2 to 200)
    const floor = Number.isInteger(data.floor) ? Math.max(-2, Math.min(data.floor, 200)) : 1;
    const altitude = typeof data.altitude === 'number' ? data.altitude : 0;

    // Get connection info
    const conn = await ddb.send(new GetCommand({
      TableName: CONNECTIONS_TABLE,
      Key: { connectionId },
    }));

    const domain = conn.Item?.universityDomain || 'unknown';

    // Compute geohash for spatial indexing (precision 7 = ~150m cells)
    const latitude = parseFloat(data.latitude);
    const longitude = parseFloat(data.longitude);
    const geohash = geohashEncode(latitude, longitude, 7);

    // Store location with 5-min TTL
    await ddb.send(new PutCommand({
      TableName: LOCATIONS_TABLE,
      Item: {
        universityDomain: domain,
        userId: data.userId,
        latitude,
        longitude,
        altitude,
        floor,
        geohash,
        timestamp: new Date().toISOString(),
        ttl: Math.floor(Date.now() / 1000) + 300,
      },
    }));

    // Broadcast to peers in same university
    const peers = await ddb.send(new QueryCommand({
      TableName: CONNECTIONS_TABLE,
      IndexName: 'by-university',
      KeyConditionExpression: 'universityDomain = :domain',
      ExpressionAttributeValues: { ':domain': domain },
    }));

    const message = JSON.stringify({
      action: 'location.update',
      data: {
        userId: data.userId,
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        altitude,
        floor,
        timestamp: new Date().toISOString(),
      },
    });

    // Send to all peers except sender (cap at 500 to prevent runaway)
    const peerList = (peers.Items || [])
      .filter(p => p.connectionId !== connectionId)
      .slice(0, 500);

    const sends = peerList.map(async (peer) => {
      try {
        await apigw.send(new PostToConnectionCommand({
          ConnectionId: peer.connectionId,
          Data: message,
        }));
      } catch (e) {
        if (e.statusCode === 410) {
          await ddb.send(new DeleteCommand({
            TableName: CONNECTIONS_TABLE,
            Key: { connectionId: peer.connectionId },
          }));
        }
      }
    });

    await Promise.all(sends);

    return { statusCode: 200, body: 'OK' };
  } catch (err) {
    console.error('ws-location-update error:', err);
    return { statusCode: 500, body: 'Failed' };
  }
};
