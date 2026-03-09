import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getSession } from "@/lib/auth";

// GET /api/ads — list ads for current business
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ads = store.getAdsByBusiness(session.businessId);
  const schools = store.getSchools();

  return NextResponse.json({ ads, schools });
}

// POST /api/ads — create a new ad
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { schools, businessName, bio, deal, logoUrl, dailyBudget } = body;

  if (!schools?.length || !businessName || !deal || !dailyBudget) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const ad = store.createAd({
    id: `ad-${Date.now()}`,
    businessId: session.businessId,
    schools,
    businessName,
    bio: bio || "",
    deal,
    logoUrl: logoUrl || null,
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

  const ad = store.getAd(id);
  if (!ad || ad.businessId !== session.businessId) {
    return NextResponse.json({ error: "Ad not found" }, { status: 404 });
  }

  // Only allow updating certain fields
  const allowed: Partial<typeof ad> = {};
  if (updates.bio !== undefined) allowed.bio = updates.bio;
  if (updates.deal !== undefined) allowed.deal = updates.deal;
  if (updates.dailyBudget !== undefined) allowed.dailyBudget = Math.max(1, Math.min(100, updates.dailyBudget));
  if (updates.status !== undefined) allowed.status = updates.status;
  if (updates.schools !== undefined) allowed.schools = updates.schools;
  if (updates.businessName !== undefined) allowed.businessName = updates.businessName;

  const updated = store.updateAd(id, allowed);
  return NextResponse.json({ ad: updated });
}

// DELETE /api/ads — delete an ad
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Ad ID required" }, { status: 400 });

  const ad = store.getAd(id);
  if (!ad || ad.businessId !== session.businessId) {
    return NextResponse.json({ error: "Ad not found" }, { status: 404 });
  }

  store.deleteAd(id);
  return NextResponse.json({ success: true });
}
