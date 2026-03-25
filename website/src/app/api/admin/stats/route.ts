import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getTotalUserCount } from "@/lib/models/user";
import { getTotalUniversityCount } from "@/lib/models/university";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, Tables } from "@/lib/db";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const [totalUsers, totalSchools] = await Promise.all([
      getTotalUserCount(),
      getTotalUniversityCount(),
    ]);

    // Active ads count
    let activeAds = 0;
    try {
      const adsResult = await docClient.send(new ScanCommand({
        TableName: Tables.ADS,
        FilterExpression: "#status = :active",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":active": "active" },
        Select: "COUNT",
      }));
      activeAds = adsResult.Count || 0;
    } catch { /* graceful fallback */ }

    // Total revenue from daily spend
    let totalRevenue = 0;
    try {
      const spendResult = await docClient.send(new ScanCommand({
        TableName: Tables.DAILY_SPEND,
      }));
      totalRevenue = (spendResult.Items || []).reduce(
        (sum, item) => sum + (Number(item.spend) || 0), 0
      );
    } catch { /* graceful fallback */ }

    return NextResponse.json({
      totalUsers,
      totalSchools,
      activeAds,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
    });
  } catch {
    return NextResponse.json({
      totalUsers: 0,
      totalSchools: 0,
      activeAds: 0,
      totalRevenue: 0,
    });
  }
}
