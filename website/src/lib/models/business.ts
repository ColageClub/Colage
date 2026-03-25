import { GetCommand, PutCommand, UpdateCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, Tables } from "../db";

export interface Business {
  id: string;
  email: string;
  name: string;
  address: string;
  category: string;
  logoUrl: string | null;
  stripeCustomerId: string | null;
  balance: number; // prepaid balance in dollars, cached from Stripe
  createdAt: string;
}

// In-memory fallback for local dev when DynamoDB is unavailable
const memoryStore = new Map<string, Business>();
let useMemory = false;

// Seed demo data
const demoBusiness: Business = {
  id: "demo-biz-1",
  email: "owner@bluebrew.com",
  name: "Blue Brew Coffee",
  address: "123 S State St, Ann Arbor, MI",
  category: "Food & Drink",
  logoUrl: null,
  stripeCustomerId: null,
  balance: 50,
  createdAt: new Date().toISOString(),
};
memoryStore.set(demoBusiness.id, demoBusiness);

async function tryDynamo<T>(dynamoFn: () => Promise<T>, memoryFn: () => T): Promise<T> {
  if (useMemory) return memoryFn();
  try {
    return await dynamoFn();
  } catch (err: unknown) {
    const error = err as { name?: string };
    if (error.name === "ResourceNotFoundException" || error.name === "UnrecognizedClientException" || error.name === "CredentialsProviderError") {
      console.warn("[Business] DynamoDB unavailable, falling back to in-memory store");
      useMemory = true;
      return memoryFn();
    }
    throw err;
  }
}

export async function getBusiness(id: string): Promise<Business | null> {
  return tryDynamo(
    async () => {
      const result = await docClient.send(new GetCommand({
        TableName: Tables.BUSINESSES,
        Key: { id },
      }));
      return (result.Item as Business) || null;
    },
    () => memoryStore.get(id) || null,
  );
}

export async function getBusinessByEmail(email: string): Promise<Business | null> {
  return tryDynamo(
    async () => {
      const result = await docClient.send(new QueryCommand({
        TableName: Tables.BUSINESSES,
        IndexName: "email-index",
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: { ":email": email },
        Limit: 1,
      }));
      return (result.Items?.[0] as Business) || null;
    },
    () => [...memoryStore.values()].find(b => b.email === email) || null,
  );
}

export async function createBusiness(biz: Business): Promise<Business> {
  return tryDynamo(
    async () => {
      await docClient.send(new PutCommand({
        TableName: Tables.BUSINESSES,
        Item: biz,
      }));
      return biz;
    },
    () => { memoryStore.set(biz.id, biz); return biz; },
  );
}

export async function updateBusiness(id: string, updates: Partial<Business>): Promise<Business | null> {
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

      if (expressions.length === 0) return getBusiness(id);

      const result = await docClient.send(new UpdateCommand({
        TableName: Tables.BUSINESSES,
        Key: { id },
        UpdateExpression: `SET ${expressions.join(", ")}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: "ALL_NEW",
      }));
      return (result.Attributes as Business) || null;
    },
    () => {
      const biz = memoryStore.get(id);
      if (!biz) return null;
      const updated = { ...biz, ...updates };
      memoryStore.set(id, updated);
      return updated;
    },
  );
}
