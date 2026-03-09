import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

// GET /api/ads/serve?school=umich.edu — serve a weighted ad to students
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const school = searchParams.get("school");

  if (!school) {
    return NextResponse.json({ error: "school parameter required" }, { status: 400 });
  }

  const ad = store.serveAd(school);

  if (!ad) {
    return NextResponse.json({ ad: null });
  }

  // Return only what the client needs (no budget/spend info)
  return NextResponse.json({
    ad: {
      id: ad.id,
      businessName: ad.businessName,
      bio: ad.bio,
      deal: ad.deal,
      logoUrl: ad.logoUrl,
    },
  });
}

// POST /api/ads/serve — track a tap
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { adId, action } = body;

  if (!adId) {
    return NextResponse.json({ error: "adId required" }, { status: 400 });
  }

  if (action === "tap") {
    store.trackTap(adId);
  }

  return NextResponse.json({ success: true });
}
