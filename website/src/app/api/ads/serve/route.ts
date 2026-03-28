export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAdsBySchoolAndStatus, getAdsByBusiness, updateAd } from "@/lib/models/ad";
import { checkFrequencyCap, recordImpression } from "@/lib/models/impression";
import { getDailySpend, incrementDailySpend } from "@/lib/models/daily-spend";
import { getBusiness } from "@/lib/models/business";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, Tables } from "@/lib/db";

// Rate limiting: max 60 requests per minute per student_id
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 60;

function checkRateLimit(studentId: string): boolean {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (entry.resetAt <= now) rateLimitMap.delete(key);
  }
  const entry = rateLimitMap.get(studentId);
  if (!entry || entry.resetAt <= now) {
    rateLimitMap.set(studentId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

// CPM pricing tiers based on advertiser demand per school
// More advertisers = higher CPM (supply/demand)
function getCPM(activeAdCount: number): number {
  if (activeAdCount <= 10) return 2;
  if (activeAdCount <= 30) return 3;
  if (activeAdCount <= 60) return 4;
  if (activeAdCount <= 100) return 5;
  return 6;
}

// GET /api/ads/serve?school=umich.edu&student_id=xxx — serve a weighted ad to students
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const school = searchParams.get("school");
  const studentId = searchParams.get("student_id");

  if (!school) {
    return NextResponse.json({ error: "school parameter required" }, { status: 400 });
  }

  if (!studentId || studentId === "anonymous" || studentId.length > 128) {
    return NextResponse.json({ error: "student_id parameter required" }, { status: 400 });
  }

  if (!checkRateLimit(studentId)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const activeAds = await getAdsBySchoolAndStatus(school, "active");
  if (activeAds.length === 0) {
    return NextResponse.json({ ad: null });
  }

  // Calculate cost per impression based on demand at this school
  const cpm = getCPM(activeAds.length);
  const costPerImpression = cpm / 1000;

  // Build a cache of business balances to filter out zero-balance businesses
  const balanceCache = new Map<string, number>();
  for (const ad of activeAds) {
    if (!balanceCache.has(ad.businessId)) {
      const biz = await getBusiness(ad.businessId);
      balanceCache.set(ad.businessId, biz?.balance ?? 0);
    }
  }

  // Filter by remaining daily budget, business balance, and frequency caps
  const eligibleAds: Array<{ ad: typeof activeAds[0]; remainingBudget: number }> = [];

  for (const ad of activeAds) {
    // Check business has funds
    const balance = balanceCache.get(ad.businessId) ?? 0;
    if (balance <= 0) continue;

    // Check daily budget
    const todaySpend = await getDailySpend(ad.id);
    const spent = todaySpend?.spend || 0;
    const remaining = ad.dailyBudget - spent;

    if (remaining <= 0) continue;

    // Check frequency cap for this student
    const withinCap = await checkFrequencyCap(ad.id, studentId);
    if (!withinCap) continue;

    eligibleAds.push({ ad, remainingBudget: remaining });
  }

  if (eligibleAds.length === 0) {
    return NextResponse.json({ ad: null });
  }

  // Weighted random selection by remaining daily budget
  const totalBudget = eligibleAds.reduce((sum, e) => sum + e.remainingBudget, 0);
  let random = Math.random() * totalBudget;

  let selected = eligibleAds[0];
  for (const entry of eligibleAds) {
    random -= entry.remainingBudget;
    if (random <= 0) {
      selected = entry;
      break;
    }
  }

  const ad = selected.ad;

  // Track impression and charge — use atomic ADD for counters
  await recordImpression(ad.id, studentId);
  await incrementDailySpend(ad.id, costPerImpression);
  await docClient.send(new UpdateCommand({
    TableName: Tables.ADS,
    Key: { id: ad.id },
    UpdateExpression: "ADD impressions :one, totalSpend :cost",
    ExpressionAttributeValues: { ":one": 1, ":cost": costPerImpression },
  }));

  // Atomically deduct impression cost from business balance
  try {
    const result = await docClient.send(new UpdateCommand({
      TableName: Tables.BUSINESSES,
      Key: { id: ad.businessId },
      UpdateExpression: "ADD balance :cost",
      ExpressionAttributeValues: { ":cost": -costPerImpression },
      ReturnValues: "ALL_NEW",
    }));

    // If balance hit zero or below, pause all active ads for this business
    const newBalance = (result.Attributes as { balance?: number })?.balance ?? 0;
    if (newBalance <= 0) {
      const bizAds = await getAdsByBusiness(ad.businessId);
      const pausePromises = bizAds
        .filter(a => a.status === "active" && a.id !== ad.id)
        .map(a => updateAd(a.id, { status: "paused" }));
      // Also pause the current ad
      pausePromises.push(updateAd(ad.id, { status: "paused" }));
      await Promise.all(pausePromises);
    }
  } catch (err) {
    console.error("[AdServe] Failed to deduct balance:", err);
  }

  // Return only what the client needs
  return NextResponse.json({
    ad: {
      id: ad.id,
      emoji: ad.emoji,
      businessName: ad.businessName,
      bio: ad.bio,
      deal: ad.deal,
      lat: ad.lat,
      lng: ad.lng,
    },
  });
}

// POST /api/ads/serve — track a tap
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { adId, action, studentId } = body;

  if (!adId) {
    return NextResponse.json({ error: "adId required" }, { status: 400 });
  }

  if (action === "tap") {
    await docClient.send(new UpdateCommand({
      TableName: Tables.ADS,
      Key: { id: adId },
      UpdateExpression: "ADD taps :one",
      ExpressionAttributeValues: { ":one": 1 },
    }));
  }

  if (action === "impression" && studentId) {
    // Look up school demand to calculate CPM for this impression
    const { getAd } = await import("@/lib/models/ad");
    const adRecord = await getAd(adId);
    if (adRecord) {
      const schoolAds = await getAdsBySchoolAndStatus(adRecord.school, "active");
      const cpi = getCPM(schoolAds.length) / 1000;
      await recordImpression(adId, studentId);
      await incrementDailySpend(adId, cpi);
    }
  }

  return NextResponse.json({ success: true });
}
