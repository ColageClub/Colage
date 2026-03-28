import { NextResponse } from "next/server";
import { docClient, Tables } from "@/lib/db";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, unknown> = {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? "set (" + process.env.STRIPE_SECRET_KEY.slice(0, 10) + "...)" : "MISSING",
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? "set" : "MISSING",
    AWS_REGION: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "not set",
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? "set" : "not set",
    AWS_EXECUTION_ENV: process.env.AWS_EXECUTION_ENV || "not set",
    NODE_ENV: process.env.NODE_ENV,
  };

  // Test DynamoDB
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: Tables.BUSINESSES,
      Limit: 1,
    }));
    checks.dynamodb = { status: "OK", count: result.Count, firstItem: result.Items?.[0]?.id || "none" };
  } catch (err: unknown) {
    const e = err as Error;
    checks.dynamodb = { status: "FAILED", error: e.message, name: (e as { name?: string }).name };
  }

  return NextResponse.json(checks);
}
