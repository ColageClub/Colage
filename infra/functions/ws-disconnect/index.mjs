import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.CONNECTIONS_TABLE || 'colage-connections-dev';
const LOCATIONS_TABLE = process.env.LOCATIONS_TABLE;

export const handler = async (event) => {
  const connectionId = event.requestContext.connectionId;

  try {
    // Look up connection to get userId + universityDomain before deleting
    let userId, universityDomain;
    try {
      const conn = await ddb.send(new GetCommand({
        TableName: TABLE,
        Key: { connectionId },
      }));
      userId = conn.Item?.userId;
      universityDomain = conn.Item?.universityDomain;
    } catch (_) {
      // Non-fatal — still delete the connection
    }

    // Delete connection record
    await ddb.send(new DeleteCommand({
      TableName: TABLE,
      Key: { connectionId },
    }));

    // Delete location record so user disappears from map immediately
    if (userId && universityDomain && LOCATIONS_TABLE) {
      try {
        await ddb.send(new DeleteCommand({
          TableName: LOCATIONS_TABLE,
          Key: { universityDomain, userId },
        }));
      } catch (_) {
        // Non-fatal — TTL will clean it up eventually
      }
    }

    return { statusCode: 200, body: 'Disconnected' };
  } catch (err) {
    console.error('ws-disconnect error:', err);
    return { statusCode: 200, body: 'Disconnected' }; // Always return 200
  }
};
