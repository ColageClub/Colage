import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getBusiness } from "@/lib/models/business";

// GET /api/billing/balance — get current prepaid balance
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await getBusiness(session.businessId);
  return NextResponse.json({ balance: business?.balance || 0 });
}
