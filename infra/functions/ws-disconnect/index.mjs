import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.CONNECTIONS_TABLE || 'colage-connections-dev';

export const handler = async (event) => {
  const connectionId = event.requestContext.connectionId;

  try {
    await ddb.send(new DeleteCommand({
      TableName: TABLE,
      Key: { connectionId },
    }));

    return { statusCode: 200, body: 'Disconnected' };
  } catch (err) {
    console.error('ws-disconnect error:', err);
    return { statusCode: 200, body: 'Disconnected' }; // Always return 200
  }
};
