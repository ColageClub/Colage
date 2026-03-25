import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, Tables } from "@/lib/db";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await docClient.send(new ScanCommand({
      TableName: Tables.ADS,
    }));
    return NextResponse.json({ ads: result.Items || [] });
  } catch {
    return NextResponse.json({ ads: [] });
  }
}
