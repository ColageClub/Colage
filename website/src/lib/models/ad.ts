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

export async function getAd(id: string): Promise<Ad | null> {
  const result = await docClient.send(new GetCommand({
    TableName: Tables.ADS,
    Key: { id },
  }));
  return (result.Item as Ad) || null;
}

export async function getAdsByBusiness(businessId: string): Promise<Ad[]> {
  const result = await docClient.send(new QueryCommand({
    TableName: Tables.ADS,
    IndexName: "businessId-index",
    KeyConditionExpression: "businessId = :bid",
    ExpressionAttributeValues: { ":bid": businessId },
  }));
  return (result.Items as Ad[]) || [];
}

export async function getAdsBySchoolAndStatus(school: string, status: string): Promise<Ad[]> {
  const result = await docClient.send(new QueryCommand({
    TableName: Tables.ADS,
    IndexName: "school-status-index",
    KeyConditionExpression: "school = :school AND #status = :status",
    ExpressionAttributeNames: { "#status": "status" },
    ExpressionAttributeValues: { ":school": school, ":status": status },
  }));
  return (result.Items as Ad[]) || [];
}

export async function createAd(ad: Ad): Promise<Ad> {
  await docClient.send(new PutCommand({
    TableName: Tables.ADS,
    Item: ad,
  }));
  return ad;
}

export async function updateAd(id: string, updates: Partial<Ad>): Promise<Ad | null> {
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
}

export async function deleteAd(id: string): Promise<void> {
  await docClient.send(new DeleteCommand({
    TableName: Tables.ADS,
    Key: { id },
  }));
}

// Available schools — fetched from universities table
export async function getSchools(): Promise<{ domain: string; name: string; students: number; city: string }[]> {
  try {
    const { getAllUniversities } = await import("./university");
    const { getUserCountBySchool } = await import("./user");
    const universities = await getAllUniversities();
    const schools = await Promise.all(
      universities.map(async (u) => ({
        domain: u.domain,
        name: u.name,
        students: await getUserCountBySchool(u.domain),
        city: [u.city, u.state].filter(Boolean).join(", "),
      }))
    );
    return schools;
  } catch (err) {
    console.warn("[Ad] Failed to fetch schools from DB, returning empty list:", err);
    return [];
  }
}
