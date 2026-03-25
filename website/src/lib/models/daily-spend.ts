import { GetCommand, UpdateCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, Tables } from "../db";

export interface DailySpend {
  ad_id: string;
  date: string; // YYYY-MM-DD
  spend: number;
  impressionCount: number;
}

// In-memory fallback
const memoryStore = new Map<string, DailySpend>();
let useMemory = false;

async function tryDynamo<T>(dynamoFn: () => Promise<T>, memoryFn: () => T): Promise<T> {
  if (useMemory) return memoryFn();
  try {
    return await dynamoFn();
  } catch (err: unknown) {
    const error = err as { name?: string };
    if (error.name === "ResourceNotFoundException" || error.name === "UnrecognizedClientException" || error.name === "CredentialsProviderError") {
      console.warn("[DailySpend] DynamoDB unavailable, falling back to in-memory store");
      useMemory = true;
      return memoryFn();
    }
    throw err;
  }
}

function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

export async function getDailySpend(adId: string, date?: string): Promise<DailySpend | null> {
  const d = date || todayString();
  return tryDynamo(
    async () => {
      const result = await docClient.send(new GetCommand({
        TableName: Tables.DAILY_SPEND,
        Key: { ad_id: adId, date: d },
      }));
      return (result.Item as DailySpend) || null;
    },
    () => memoryStore.get(`${adId}#${d}`) || null,
  );
}

export async function incrementDailySpend(adId: string, costPerImpression: number = 0): Promise<DailySpend> {
  const d = todayString();

  return tryDynamo(
    async () => {
      const result = await docClient.send(new UpdateCommand({
        TableName: Tables.DAILY_SPEND,
        Key: { ad_id: adId, date: d },
        UpdateExpression: "SET spend = if_not_exists(spend, :zero) + :cost, impressionCount = if_not_exists(impressionCount, :zero) + :one",
        ExpressionAttributeValues: {
          ":cost": costPerImpression,
          ":zero": 0,
          ":one": 1,
        },
        ReturnValues: "ALL_NEW",
      }));
      return result.Attributes as DailySpend;
    },
    () => {
      const key = `${adId}#${d}`;
      const existing = memoryStore.get(key) || { ad_id: adId, date: d, spend: 0, impressionCount: 0 };
      existing.spend += costPerImpression;
      existing.impressionCount += 1;
      memoryStore.set(key, existing);
      return existing;
    },
  );
}

export async function getSpendForAds(adIds: string[], date?: string): Promise<Map<string, DailySpend>> {
  const d = date || todayString();
  const result = new Map<string, DailySpend>();

  // Batch get for each ad
  for (const adId of adIds) {
    const spend = await getDailySpend(adId, d);
    if (spend) result.set(adId, spend);
  }

  return result;
}
