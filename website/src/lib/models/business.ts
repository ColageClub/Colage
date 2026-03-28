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

export async function getBusiness(id: string): Promise<Business | null> {
  const result = await docClient.send(new GetCommand({
    TableName: Tables.BUSINESSES,
    Key: { id },
  }));
  return (result.Item as Business) || null;
}

export async function getBusinessByEmail(email: string): Promise<Business | null> {
  const result = await docClient.send(new QueryCommand({
    TableName: Tables.BUSINESSES,
    IndexName: "email-index",
    KeyConditionExpression: "email = :email",
    ExpressionAttributeValues: { ":email": email },
    Limit: 1,
  }));
  return (result.Items?.[0] as Business) || null;
}

export async function createBusiness(biz: Business): Promise<Business> {
  await docClient.send(new PutCommand({
    TableName: Tables.BUSINESSES,
    Item: biz,
  }));
  return biz;
}

export async function updateBusiness(id: string, updates: Partial<Business>): Promise<Business | null> {
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
}
