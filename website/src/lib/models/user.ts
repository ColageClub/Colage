import { GetCommand, PutCommand, UpdateCommand, ScanCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, Tables } from "../db";

export interface User {
  userId: string;
  email: string;
  name: string;
  universityDomain: string;
  major?: string;
  bio?: string;
  photoUrl?: string;
  socials?: Record<string, string>;
  status: "active" | "suspended" | "banned";
  createdAt: string;
  lastActive?: string;
}

// In-memory fallback
const memoryStore = new Map<string, User>();
let useMemory = false;

async function tryDynamo<T>(dynamoFn: () => Promise<T>, memoryFn: () => T): Promise<T> {
  if (useMemory) return memoryFn();
  try {
    return await dynamoFn();
  } catch (err: unknown) {
    const error = err as { name?: string };
    if (error.name === "ResourceNotFoundException" || error.name === "UnrecognizedClientException" || error.name === "CredentialsProviderError") {
      console.warn("[User] DynamoDB unavailable, falling back to in-memory store");
      useMemory = true;
      return memoryFn();
    }
    throw err;
  }
}

export async function getUser(userId: string): Promise<User | null> {
  return tryDynamo(
    async () => {
      const result = await docClient.send(new GetCommand({
        TableName: Tables.USERS,
        Key: { userId },
      }));
      return (result.Item as User) || null;
    },
    () => memoryStore.get(userId) || null,
  );
}

export async function getUsersBySchool(universityDomain: string): Promise<User[]> {
  return tryDynamo(
    async () => {
      const result = await docClient.send(new QueryCommand({
        TableName: Tables.USERS,
        IndexName: "by-university",
        KeyConditionExpression: "universityDomain = :domain",
        ExpressionAttributeValues: { ":domain": universityDomain },
      }));
      return (result.Items as User[]) || [];
    },
    () => [...memoryStore.values()].filter(u => u.universityDomain === universityDomain),
  );
}

export async function getUserCountBySchool(universityDomain: string): Promise<number> {
  return tryDynamo(
    async () => {
      const result = await docClient.send(new QueryCommand({
        TableName: Tables.USERS,
        IndexName: "by-university",
        KeyConditionExpression: "universityDomain = :domain",
        ExpressionAttributeValues: { ":domain": universityDomain },
        Select: "COUNT",
      }));
      return result.Count || 0;
    },
    () => [...memoryStore.values()].filter(u => u.universityDomain === universityDomain).length,
  );
}

export async function scanUsers(options?: {
  limit?: number;
  lastKey?: Record<string, unknown>;
  school?: string;
  search?: string;
}): Promise<{ users: User[]; lastKey?: Record<string, unknown> }> {
  return tryDynamo(
    async () => {
      if (options?.school) {
        const result = await docClient.send(new QueryCommand({
          TableName: Tables.USERS,
          IndexName: "by-university",
          KeyConditionExpression: "universityDomain = :domain",
          ExpressionAttributeValues: { ":domain": options.school },
          Limit: options?.limit || 50,
          ...(options?.lastKey && { ExclusiveStartKey: options.lastKey }),
        }));
        let users = (result.Items as User[]) || [];
        if (options?.search) {
          const q = options.search.toLowerCase();
          users = users.filter(u =>
            u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
          );
        }
        return { users, lastKey: result.LastEvaluatedKey };
      }

      const result = await docClient.send(new ScanCommand({
        TableName: Tables.USERS,
        Limit: options?.limit || 50,
        ...(options?.lastKey && { ExclusiveStartKey: options.lastKey }),
      }));
      let users = (result.Items as User[]) || [];
      if (options?.search) {
        const q = options.search.toLowerCase();
        users = users.filter(u =>
          u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
        );
      }
      return { users, lastKey: result.LastEvaluatedKey };
    },
    () => {
      let users = [...memoryStore.values()];
      if (options?.school) users = users.filter(u => u.universityDomain === options.school);
      if (options?.search) {
        const q = options.search.toLowerCase();
        users = users.filter(u =>
          u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
        );
      }
      return { users: users.slice(0, options?.limit || 50) };
    },
  );
}

export async function getTotalUserCount(): Promise<number> {
  return tryDynamo(
    async () => {
      const result = await docClient.send(new ScanCommand({
        TableName: Tables.USERS,
        Select: "COUNT",
      }));
      return result.Count || 0;
    },
    () => memoryStore.size,
  );
}

export async function updateUserStatus(userId: string, status: "active" | "suspended" | "banned"): Promise<User | null> {
  return tryDynamo(
    async () => {
      const result = await docClient.send(new UpdateCommand({
        TableName: Tables.USERS,
        Key: { userId },
        UpdateExpression: "SET #status = :status",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":status": status },
        ReturnValues: "ALL_NEW",
      }));
      return (result.Attributes as User) || null;
    },
    () => {
      const user = memoryStore.get(userId);
      if (!user) return null;
      user.status = status;
      memoryStore.set(userId, user);
      return user;
    },
  );
}

export async function deleteUser(userId: string): Promise<void> {
  return tryDynamo(
    async () => {
      await docClient.send(new DeleteCommand({
        TableName: Tables.USERS,
        Key: { userId },
      }));
    },
    () => { memoryStore.delete(userId); },
  );
}
