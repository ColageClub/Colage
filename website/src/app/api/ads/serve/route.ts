import { NextRequest, NextResponse } from "next/server";
import { getAdsBySchoolAndStatus, updateAd } from "@/lib/models/ad";
import { checkFrequencyCap, recordImpression } from "@/lib/models/impression";
import { getDailySpend, incrementDailySpend } from "@/lib/models/daily-spend";

// GET /api/ads/serve?school=umich.edu&student_id=xxx — serve a weighted ad to students
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const school = searchParams.get("school");
  const studentId = searchParams.get("student_id") || "anonymous";

  if (!school) {
    return NextResponse.json({ error: "school parameter required" }, { status: 400 });
  }

  const activeAds = await getAdsBySchoolAndStatus(school, "active");
  if (activeAds.length === 0) {
    return NextResponse.json({ ad: null });
  }

  // Filter by remaining daily budget and frequency caps
  const eligibleAds: Array<{ ad: typeof activeAds[0]; remainingBudget: number }> = [];

  for (const ad of activeAds) {
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

  // Track impression
  await recordImpression(ad.id, studentId);
  await incrementDailySpend(ad.id);
  await updateAd(ad.id, { impressions: ad.impressions + 1 });

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
    const { getAd, updateAd } = await import("@/lib/models/ad");
    const ad = await getAd(adId);
    if (ad) {
      await updateAd(adId, { taps: ad.taps + 1 });
    }
  }

  if (action === "impression" && studentId) {
    await recordImpression(adId, studentId);
    await incrementDailySpend(adId);
  }

  return NextResponse.json({ success: true });
}
