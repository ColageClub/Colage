import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';

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
    const body = JSON.parse(event.body);
    const { data } = body;

    if (!data?.userId || !data?.latitude || !data?.longitude) {
      return { statusCode: 400, body: 'Invalid location data' };
    }

    // Get connection info to find university domain
    const conn = await ddb.send(new GetCommand({
      TableName: CONNECTIONS_TABLE,
      Key: { connectionId },
    }));

    const domain = conn.Item?.universityDomain || 'unknown';

    // Store location (with 5-min TTL so stale locations auto-expire)
    await ddb.send(new PutCommand({
      TableName: LOCATIONS_TABLE,
      Item: {
        universityDomain: domain,
        userId: data.userId,
        latitude: data.latitude,
        longitude: data.longitude,
        altitude: data.altitude || 0,
        floor: data.floor || 1,
        timestamp: new Date().toISOString(),
        ttl: Math.floor(Date.now() / 1000) + 300, // 5 min TTL
      },
    }));

    // Broadcast to all connections in the same university
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
        latitude: data.latitude,
        longitude: data.longitude,
        altitude: data.altitude || 0,
        floor: data.floor || 1,
        timestamp: new Date().toISOString(),
      },
    });

    // Send to all peers (except sender)
    const sends = (peers.Items || [])
      .filter(p => p.connectionId !== connectionId)
      .map(async (peer) => {
        try {
          await apigw.send(new PostToConnectionCommand({
            ConnectionId: peer.connectionId,
            Data: message,
          }));
        } catch (e) {
          if (e.statusCode === 410) {
            // Stale connection — clean up
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
