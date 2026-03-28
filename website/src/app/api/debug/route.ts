import { NextResponse } from "next/server";
import { docClient, Tables } from "@/lib/db";
import { ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, unknown> = {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? "set (" + process.env.STRIPE_SECRET_KEY.slice(0, 10) + "...)" : "MISSING",
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? "set" : "MISSING",
    MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN ? "set (" + process.env.MAPBOX_ACCESS_TOKEN.slice(0, 10) + "...)" : "MISSING",
    AWS_REGION: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "not set",
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? "set" : "not set",
    AWS_EXECUTION_ENV: process.env.AWS_EXECUTION_ENV || "not set",
    NODE_ENV: process.env.NODE_ENV,
  };

  // Test DynamoDB read
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: Tables.BUSINESSES,
      Limit: 1,
    }));
    checks.dynamodb_read = { status: "OK", count: result.Count, firstItem: result.Items?.[0]?.id || "none" };
  } catch (err: unknown) {
    const e = err as Error;
    checks.dynamodb_read = { status: "FAILED", error: e.message, name: (e as { name?: string }).name };
  }

  // Test DynamoDB write to ads table
  try {
    const testId = `test-${Date.now()}`;
    await docClient.send(new PutCommand({
      TableName: Tables.ADS,
      Item: { id: testId, businessId: "debug-test", school: "test", emoji: "🧪", businessName: "Debug", bio: "", deal: "test", address: "", lat: 0, lng: 0, dailyBudget: 1, status: "draft", impressions: 0, taps: 0, totalSpend: 0, createdAt: new Date().toISOString() },
    }));
    checks.dynamodb_write_ads = { status: "OK", testId };
    // Clean up
    const { DeleteCommand } = await import("@aws-sdk/lib-dynamodb");
    await docClient.send(new DeleteCommand({ TableName: Tables.ADS, Key: { id: testId } }));
  } catch (err: unknown) {
    const e = err as Error;
    checks.dynamodb_write_ads = { status: "FAILED", error: e.message, name: (e as { name?: string }).name };
  }

  // Test geocoding
  try {
    const token = process.env.MAPBOX_ACCESS_TOKEN;
    if (token) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const r = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/Ann%20Arbor.json?access_token=${token}&limit=1`, { signal: controller.signal });
      clearTimeout(timeout);
      const d = await r.json();
      checks.geocoding = { status: "OK", features: d.features?.length || 0 };
    } else {
      checks.geocoding = { status: "SKIPPED", reason: "no token" };
    }
  } catch (err: unknown) {
    const e = err as Error;
    checks.geocoding = { status: "FAILED", error: e.message };
  }

  return NextResponse.json(checks);
}
