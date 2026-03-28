// DynamoDB DocumentClient — configured for us-east-2
// Falls back to in-memory store if DynamoDB connection fails (local dev)

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: "us-east-2",
  // Uses default credential chain: env vars → shared credentials → IAM role
  // For local dev: AWS_PROFILE=colage or explicit credentials
});

export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

// Table names
const stage = process.env.STAGE || "dev";

export const Tables = {
  BUSINESSES: `colage-businesses-${stage}`,
  ADS: `colage-ads-${stage}`,
  IMPRESSIONS: `colage-impressions-${stage}`,
  DAILY_SPEND: `colage-daily-spend-${stage}`,
  USERS: `colage-users-${stage}`,
  UNIVERSITIES: `colage-universities-${stage}`,
  LOCATIONS: `colage-locations-${stage}`,
  CONNECTIONS: `colage-connections-${stage}`,
} as const;

/*
Table Schemas (already deployed in AWS account 788365607175, us-east-2):

colage-businesses-dev
  PK: id (string)
  GSI: email-index — PK: email (string)
  Attributes: id, email, name, address, category, logoUrl, stripeCustomerId, balance, createdAt

colage-ads-dev
  PK: id (string)
  GSI: businessId-index — PK: businessId (string)
  GSI: school-status-index — PK: school (string), SK: status (string)
  Attributes: id, businessId, school, emoji, businessName, bio, deal, address, lat, lng,
              dailyBudget, status, impressions, taps, totalSpend, createdAt

colage-impressions-dev
  PK: ad_id#student_id (string)
  SK: timestamp (number)
  TTL: ttl (30 days)
  Attributes: adId, studentId, timestamp, ttl

colage-daily-spend-dev
  PK: ad_id (string)
  SK: date (string, YYYY-MM-DD)
  Attributes: adId, date, spend, impressionCount
*/
