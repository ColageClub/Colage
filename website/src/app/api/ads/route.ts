import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import * as AdModel from "@/lib/models/ad";
import { getSpendForAds } from "@/lib/models/daily-spend";

// GET /api/ads — list ads for current business + today's spend
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ads = await AdModel.getAdsByBusiness(session.businessId);
  const schools = AdModel.getSchools();

  // Get today's spend for each ad
  const adIds = ads.map(a => a.id);
  const spendMap = await getSpendForAds(adIds);
  const adsWithSpend = ads.map(ad => ({
    ...ad,
    todaySpend: spendMap.get(ad.id)?.spend || 0,
    todayImpressions: spendMap.get(ad.id)?.impressionCount || 0,
  }));

  return NextResponse.json({ ads: adsWithSpend, schools });
}

// POST /api/ads — create a new ad
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { school, businessName, bio, deal, emoji, address, dailyBudget } = body;

  if (!school || !businessName || !deal || !dailyBudget) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Geocode business address to lat/lng via Mapbox
  let lat = 0;
  let lng = 0;

  if (address) {
    const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;
    if (mapboxToken) {
      try {
        const encoded = encodeURIComponent(address);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const geoRes = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${mapboxToken}&limit=1`,
          { signal: controller.signal }
        );
        clearTimeout(timeout);
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData.features && geoData.features.length > 0) {
            const [lngResult, latResult] = geoData.features[0].center;
            lat = latResult;
            lng = lngResult;
          }
        }
      } catch (err) {
        console.warn("[Ads] Geocoding failed, using 0,0:", err);
      }
    } else {
      console.warn("[Ads] MAPBOX_ACCESS_TOKEN not set, skipping geocoding");
    }
  }

  const ad = await AdModel.createAd({
    id: `ad-${Date.now()}`,
    businessId: session.businessId,
    school,
    emoji: emoji || "🏪",
    businessName,
    bio: bio || "",
    deal,
    address: address || "",
    lat,
    lng,
    dailyBudget: Math.max(1, Math.min(100, dailyBudget)),
    status: "active",
    impressions: 0,
    taps: 0,
    totalSpend: 0,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ ad }, { status: 201 });
}

// PUT /api/ads — update an ad
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: "Ad ID required" }, { status: 400 });

  const ad = await AdModel.getAd(id);
  if (!ad || ad.businessId !== session.businessId) {
    return NextResponse.json({ error: "Ad not found" }, { status: 404 });
  }

  // Only allow updating certain fields
  const allowed: Partial<AdModel.Ad> = {};
  if (updates.bio !== undefined) allowed.bio = updates.bio;
  if (updates.deal !== undefined) allowed.deal = updates.deal;
  if (updates.dailyBudget !== undefined) allowed.dailyBudget = Math.max(1, Math.min(100, updates.dailyBudget));
  if (updates.status !== undefined) allowed.status = updates.status;
  if (updates.school !== undefined) allowed.school = updates.school;
  if (updates.businessName !== undefined) allowed.businessName = updates.businessName;
  if (updates.emoji !== undefined) allowed.emoji = updates.emoji;
  if (updates.address !== undefined) allowed.address = updates.address;

  const updated = await AdModel.updateAd(id, allowed);
  return NextResponse.json({ ad: updated });
}

// DELETE /api/ads — delete an ad
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Ad ID required" }, { status: 400 });

  const ad = await AdModel.getAd(id);
  if (!ad || ad.businessId !== session.businessId) {
    return NextResponse.json({ error: "Ad not found" }, { status: 404 });
  }

  await AdModel.deleteAd(id);
  return NextResponse.json({ success: true });
}
