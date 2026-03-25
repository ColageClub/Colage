import { GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, Tables } from "../db";

export interface University {
  domain: string;
  name: string;
  primaryColor: string;
  accentColor: string;
  textColor?: string;
  logoUrl?: string;
  city?: string;
  state?: string;
  createdAt?: string;
}

// In-memory fallback
const memoryStore = new Map<string, University>();
let useMemory = false;

async function tryDynamo<T>(dynamoFn: () => Promise<T>, memoryFn: () => T): Promise<T> {
  if (useMemory) return memoryFn();
  try {
    return await dynamoFn();
  } catch (err: unknown) {
    const error = err as { name?: string };
    if (error.name === "ResourceNotFoundException" || error.name === "UnrecognizedClientException" || error.name === "CredentialsProviderError") {
      console.warn("[University] DynamoDB unavailable, falling back to in-memory store");
      useMemory = true;
      return memoryFn();
    }
    throw err;
  }
}

export async function getUniversity(domain: string): Promise<University | null> {
  return tryDynamo(
    async () => {
      const result = await docClient.send(new GetCommand({
        TableName: Tables.UNIVERSITIES,
        Key: { domain },
      }));
      return (result.Item as University) || null;
    },
    () => memoryStore.get(domain) || null,
  );
}

export async function getAllUniversities(): Promise<University[]> {
  return tryDynamo(
    async () => {
      const result = await docClient.send(new ScanCommand({
        TableName: Tables.UNIVERSITIES,
      }));
      return (result.Items as University[]) || [];
    },
    () => [...memoryStore.values()],
  );
}

export async function getTotalUniversityCount(): Promise<number> {
  return tryDynamo(
    async () => {
      const result = await docClient.send(new ScanCommand({
        TableName: Tables.UNIVERSITIES,
        Select: "COUNT",
      }));
      return result.Count || 0;
    },
    () => memoryStore.size,
  );
}

export async function createUniversity(uni: University): Promise<University> {
  return tryDynamo(
    async () => {
      await docClient.send(new PutCommand({
        TableName: Tables.UNIVERSITIES,
        Item: uni,
      }));
      return uni;
    },
    () => { memoryStore.set(uni.domain, uni); return uni; },
  );
}
