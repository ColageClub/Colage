import { GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, Tables } from "../db";

export interface Ad {
  id: string;
  businessId: string;
  school: string; // single school per ad
  emoji: string;
  businessName: string;
  bio: string;
  deal: string;
  address: string;
  lat: number;
  lng: number;
  dailyBudget: number; // 1-100
  status: "draft" | "pending" | "active" | "paused" | "completed" | "rejected";
  impressions: number;
  taps: number;
  totalSpend: number;
  createdAt: string;
}

// In-memory fallback
const memoryStore = new Map<string, Ad>();
let useMemory = false;

// Seed demo data
const demoAd: Ad = {
  id: "demo-ad-1",
  businessId: "demo-biz-1",
  school: "umich.edu",
  emoji: "☕",
  businessName: "Blue Brew Coffee",
  bio: "Student-favorite coffee shop since 2019",
  deal: "15% off any drink — show this ad",
  address: "123 S State St, Ann Arbor, MI",
  lat: 42.2808,
  lng: -83.7430,
  dailyBudget: 5,
  status: "active",
  impressions: 1247,
  taps: 89,
  totalSpend: 34.5,
  createdAt: new Date().toISOString(),
};
memoryStore.set(demoAd.id, demoAd);

async function tryDynamo<T>(dynamoFn: () => Promise<T>, memoryFn: () => T): Promise<T> {
  if (useMemory) return memoryFn();
  try {
    return await dynamoFn();
  } catch (err: unknown) {
    const error = err as { name?: string };
    if (error.name === "ResourceNotFoundException" || error.name === "UnrecognizedClientException" || error.name === "CredentialsProviderError") {
      console.warn("[Ad] DynamoDB unavailable, falling back to in-memory store");
      useMemory = true;
      return memoryFn();
    }
    throw err;
  }
}

export async function getAd(id: string): Promise<Ad | null> {
  return tryDynamo(
    async () => {
      const result = await docClient.send(new GetCommand({
        TableName: Tables.ADS,
        Key: { id },
      }));
      return (result.Item as Ad) || null;
    },
    () => memoryStore.get(id) || null,
  );
}

export async function getAdsByBusiness(businessId: string): Promise<Ad[]> {
  return tryDynamo(
    async () => {
      const result = await docClient.send(new QueryCommand({
        TableName: Tables.ADS,
        IndexName: "businessId-index",
        KeyConditionExpression: "businessId = :bid",
        ExpressionAttributeValues: { ":bid": businessId },
      }));
      return (result.Items as Ad[]) || [];
    },
    () => [...memoryStore.values()].filter(a => a.businessId === businessId),
  );
}

export async function getAdsBySchoolAndStatus(school: string, status: string): Promise<Ad[]> {
  return tryDynamo(
    async () => {
      const result = await docClient.send(new QueryCommand({
        TableName: Tables.ADS,
        IndexName: "school-status-index",
        KeyConditionExpression: "school = :school AND #status = :status",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":school": school, ":status": status },
      }));
      return (result.Items as Ad[]) || [];
    },
    () => [...memoryStore.values()].filter(a => a.school === school && a.status === status),
  );
}

export async function createAd(ad: Ad): Promise<Ad> {
  return tryDynamo(
    async () => {
      await docClient.send(new PutCommand({
        TableName: Tables.ADS,
        Item: ad,
      }));
      return ad;
    },
    () => { memoryStore.set(ad.id, ad); return ad; },
  );
}

export async function updateAd(id: string, updates: Partial<Ad>): Promise<Ad | null> {
  return tryDynamo(
    async () => {
      const expressions: string[] = [];
      const names: Record<string, string> = {};
      const values: Record<string, unknown> = {};

      Object.entries(updates).forEach(([key, value]) => {
        if (key === "id") return;
        const attr = `#${key}`;
        const val = `:${key}`;
        expressions.push(`${attr} = ${val}`);
        names[attr] = key;
        values[val] = value;
      });

      if (expressions.length === 0) return getAd(id);

      const result = await docClient.send(new UpdateCommand({
        TableName: Tables.ADS,
        Key: { id },
        UpdateExpression: `SET ${expressions.join(", ")}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: "ALL_NEW",
      }));
      return (result.Attributes as Ad) || null;
    },
    () => {
      const ad = memoryStore.get(id);
      if (!ad) return null;
      const updated = { ...ad, ...updates };
      memoryStore.set(id, updated);
      return updated;
    },
  );
}

export async function deleteAd(id: string): Promise<void> {
  return tryDynamo(
    async () => {
      await docClient.send(new DeleteCommand({
        TableName: Tables.ADS,
        Key: { id },
      }));
    },
    () => { memoryStore.delete(id); },
  );
}

// Available schools
export function getSchools() {
  return [
    { domain: "umich.edu", name: "University of Michigan", students: 847, city: "Ann Arbor, MI" },
    { domain: "harvard.edu", name: "Harvard University", students: 512, city: "Cambridge, MA" },
    { domain: "stanford.edu", name: "Stanford University", students: 623, city: "Stanford, CA" },
  ];
}
