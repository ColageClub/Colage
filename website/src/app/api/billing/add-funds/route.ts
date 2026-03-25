import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createCheckoutSession } from "@/lib/stripe";

// POST /api/billing/add-funds — create Stripe Checkout session
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { amount } = body;

  if (!amount || typeof amount !== "number" || amount < 5 || amount > 1000) {
    return NextResponse.json({ error: "Amount must be between $5 and $1,000" }, { status: 400 });
  }

  try {
    const url = await createCheckoutSession(session.businessId, session.email, amount);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("Failed to create checkout session:", err);
    return NextResponse.json({ error: "Failed to create payment session" }, { status: 500 });
  }
}
