import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, Tables } from "../db";

export interface Impression {
  pk: string; // ad_id#student_id
  timestamp: number;
  adId: string;
  studentId: string;
  ttl: number; // Unix timestamp for TTL (30 days from creation)
}

// In-memory fallback
const memoryStore: Impression[] = [];
let useMemory = false;

async function tryDynamo<T>(dynamoFn: () => Promise<T>, memoryFn: () => T): Promise<T> {
  if (useMemory) return memoryFn();
  try {
    return await dynamoFn();
  } catch (err: unknown) {
    const error = err as { name?: string };
    if (error.name === "ResourceNotFoundException" || error.name === "UnrecognizedClientException" || error.name === "CredentialsProviderError") {
      console.warn("[Impression] DynamoDB unavailable, falling back to in-memory store");
      useMemory = true;
      return memoryFn();
    }
    throw err;
  }
}

export async function recordImpression(adId: string, studentId: string): Promise<void> {
  const now = Date.now();
  const ttl = Math.floor(now / 1000) + 30 * 24 * 60 * 60; // 30 days

  const impression: Impression = {
    pk: `${adId}#${studentId}`,
    timestamp: now,
    adId,
    studentId,
    ttl,
  };

  return tryDynamo(
    async () => {
      await docClient.send(new PutCommand({
        TableName: Tables.IMPRESSIONS,
        Item: impression,
      }));
    },
    () => { memoryStore.push(impression); },
  );
}

export async function getImpressionCount(adId: string, studentId: string, sinceMs: number): Promise<number> {
  const pk = `${adId}#${studentId}`;

  return tryDynamo(
    async () => {
      const result = await docClient.send(new QueryCommand({
        TableName: Tables.IMPRESSIONS,
        KeyConditionExpression: "pk = :pk AND #ts >= :since",
        ExpressionAttributeNames: { "#ts": "timestamp" },
        ExpressionAttributeValues: {
          ":pk": pk,
          ":since": sinceMs,
        },
        Select: "COUNT",
      }));
      return result.Count || 0;
    },
    () => memoryStore.filter(i => i.pk === pk && i.timestamp >= sinceMs).length,
  );
}

// Frequency cap checks
export async function checkFrequencyCap(adId: string, studentId: string): Promise<boolean> {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [hourly, daily] = await Promise.all([
    getImpressionCount(adId, studentId, oneHourAgo),
    getImpressionCount(adId, studentId, startOfDay.getTime()),
  ]);

  // Max 200/student/ad/hour, max 1000/student/ad/day (generous for early testing)
  return hourly < 200 && daily < 1000;
}
