import { GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, Tables } from "../db";

export interface Location {
  universityDomain: string;
  userId: string;
  lat: number;
  lng: number;
  lastUpdated: string;
}

// In-memory fallback
const memoryStore = new Map<string, Location>();
let useMemory = false;

async function tryDynamo<T>(dynamoFn: () => Promise<T>, memoryFn: () => T): Promise<T> {
  if (useMemory) return memoryFn();
  try {
    return await dynamoFn();
  } catch (err: unknown) {
    const error = err as { name?: string };
    if (error.name === "ResourceNotFoundException" || error.name === "UnrecognizedClientException" || error.name === "CredentialsProviderError") {
      console.warn("[Location] DynamoDB unavailable, falling back to in-memory store");
      useMemory = true;
      return memoryFn();
    }
    throw err;
  }
}

export async function getUserLocation(universityDomain: string, userId: string): Promise<Location | null> {
  return tryDynamo(
    async () => {
      const result = await docClient.send(new GetCommand({
        TableName: Tables.LOCATIONS,
        Key: { universityDomain, userId },
      }));
      return (result.Item as Location) || null;
    },
    () => memoryStore.get(`${universityDomain}#${userId}`) || null,
  );
}

export async function getLocationsBySchool(universityDomain: string): Promise<Location[]> {
  return tryDynamo(
    async () => {
      const result = await docClient.send(new QueryCommand({
        TableName: Tables.LOCATIONS,
        KeyConditionExpression: "universityDomain = :domain",
        ExpressionAttributeValues: { ":domain": universityDomain },
      }));
      return (result.Items as Location[]) || [];
    },
    () => [...memoryStore.values()].filter(l => l.universityDomain === universityDomain),
  );
}
