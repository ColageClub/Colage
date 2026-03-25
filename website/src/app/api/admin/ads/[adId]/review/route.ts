import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { updateAd } from "@/lib/models/ad";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ adId: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { adId } = await params;
    const body = await request.json();
    const { decision, reason } = body;

    if (!["approve", "reject"].includes(decision)) {
      return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
    }

    const status = decision === "approve" ? "active" : "rejected";
    const updates: Record<string, unknown> = { status };
    if (reason) updates.rejectionReason = reason;

    const ad = await updateAd(adId, updates);
    if (!ad) {
      return NextResponse.json({ error: "Ad not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, ad });
  } catch {
    return NextResponse.json({ error: "Failed to review ad" }, { status: 500 });
  }
}
