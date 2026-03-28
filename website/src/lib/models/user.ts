import { GetCommand, PutCommand, UpdateCommand, ScanCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, Tables } from "../db";

export interface User {
  userId: string;
  email: string;
  name: string;
  displayName?: string;
  universityDomain: string;
  major?: string;
  bio?: string;
  photoUrl?: string;
  profilePhotoURL?: string;
  socialLinks?: Array<{ platform: string; handle: string }>;
  socials?: Record<string, string>;
  status: "active" | "suspended" | "banned";
  isVisible?: boolean;
  createdAt: string;
  updatedAt?: string;
  lastActive?: string;
}

/** Get display name — handles both 'name' and 'displayName' field conventions */
export function getUserDisplayName(user: User): string {
  return user.displayName || user.name || user.email?.split("@")[0] || "Unknown";
}

export async function getUser(userId: string): Promise<User | null> {
  const result = await docClient.send(new GetCommand({
    TableName: Tables.USERS,
    Key: { userId },
  }));
  return (result.Item as User) || null;
}

export async function getUsersBySchool(universityDomain: string): Promise<User[]> {
  const result = await docClient.send(new QueryCommand({
    TableName: Tables.USERS,
    IndexName: "by-university",
    KeyConditionExpression: "universityDomain = :domain",
    ExpressionAttributeValues: { ":domain": universityDomain },
  }));
  return (result.Items as User[]) || [];
}

export async function getUserCountBySchool(universityDomain: string): Promise<number> {
  const result = await docClient.send(new QueryCommand({
    TableName: Tables.USERS,
    IndexName: "by-university",
    KeyConditionExpression: "universityDomain = :domain",
    ExpressionAttributeValues: { ":domain": universityDomain },
    Select: "COUNT",
  }));
  return result.Count || 0;
}

export async function scanUsers(options?: {
  limit?: number;
  lastKey?: Record<string, unknown>;
  school?: string;
  search?: string;
}): Promise<{ users: User[]; lastKey?: Record<string, unknown> }> {
  const limit = options?.limit || 50;
  const search = options?.search;

  if (options?.school) {
    // Query by school GSI — search filtering must be done client-side for Query
    const result = await docClient.send(new QueryCommand({
      TableName: Tables.USERS,
      IndexName: "by-university",
      KeyConditionExpression: "universityDomain = :domain",
      ExpressionAttributeValues: { ":domain": options.school },
      // When searching, fetch more items so client-side filter has enough to work with
      Limit: search ? 500 : limit,
      ...(options?.lastKey && { ExclusiveStartKey: options.lastKey }),
    }));
    let users = (result.Items as User[]) || [];
    if (search) {
      const q = search.toLowerCase();
      users = users.filter(u =>
        u.name?.toLowerCase().includes(q) ||
        u.displayName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      );
    }
    return { users: users.slice(0, limit), lastKey: result.LastEvaluatedKey };
  }

  // Scan — use DynamoDB FilterExpression for server-side search when possible
  if (search) {
    const result = await docClient.send(new ScanCommand({
      TableName: Tables.USERS,
      // Don't limit the scan when filtering — DynamoDB applies Limit before FilterExpression
      Limit: 500,
      FilterExpression: "contains(email, :search) OR contains(#name, :search) OR contains(displayName, :search)",
      ExpressionAttributeNames: { "#name": "name" },
      ExpressionAttributeValues: { ":search": search },
      ...(options?.lastKey && { ExclusiveStartKey: options.lastKey }),
    }));
    const users = (result.Items as User[]) || [];
    return { users: users.slice(0, limit), lastKey: result.LastEvaluatedKey };
  }

  const result = await docClient.send(new ScanCommand({
    TableName: Tables.USERS,
    Limit: limit,
    ...(options?.lastKey && { ExclusiveStartKey: options.lastKey }),
  }));
  const users = (result.Items as User[]) || [];
  return { users, lastKey: result.LastEvaluatedKey };
}

export async function getTotalUserCount(): Promise<number> {
  const result = await docClient.send(new ScanCommand({
    TableName: Tables.USERS,
    Select: "COUNT",
  }));
  return result.Count || 0;
}

export async function updateUserStatus(userId: string, status: "active" | "suspended" | "banned"): Promise<User | null> {
  const result = await docClient.send(new UpdateCommand({
    TableName: Tables.USERS,
    Key: { userId },
    UpdateExpression: "SET #status = :status",
    ExpressionAttributeNames: { "#status": "status" },
    ExpressionAttributeValues: { ":status": status },
    ReturnValues: "ALL_NEW",
  }));
  return (result.Attributes as User) || null;
}

export async function deleteUser(userId: string): Promise<void> {
  await docClient.send(new DeleteCommand({
    TableName: Tables.USERS,
    Key: { userId },
  }));
}
