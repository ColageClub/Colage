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
    // Get last 30 days of spend data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoff = thirtyDaysAgo.toISOString().split("T")[0];

    const result = await docClient.send(new ScanCommand({
      TableName: Tables.DAILY_SPEND,
      FilterExpression: "#date >= :cutoff",
      ExpressionAttributeNames: { "#date": "date" },
      ExpressionAttributeValues: { ":cutoff": cutoff },
    }));

    const items = result.Items || [];

    // Group by date
    const byDate = new Map<string, { revenue: number; impressions: number }>();
    for (const item of items) {
      const date = item.date as string;
      const existing = byDate.get(date) || { revenue: 0, impressions: 0 };
      existing.revenue += Number(item.spend) || 0;
      existing.impressions += Number(item.impressionCount) || 0;
      byDate.set(date, existing);
    }

    const daily = [...byDate.entries()]
      .map(([date, data]) => ({
        date,
        revenue: Math.round(data.revenue * 100) / 100,
        impressions: data.impressions,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const total = daily.reduce((sum, d) => sum + d.revenue, 0);

    return NextResponse.json({
      daily,
      total: Math.round(total * 100) / 100,
    });
  } catch {
    return NextResponse.json({ daily: [], total: 0 });
  }
}
