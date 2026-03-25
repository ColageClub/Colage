import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getBusiness, updateBusiness } from "@/lib/models/business";
import Stripe from "stripe";

// Disable body parsing — we need the raw body for signature verification
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // Read raw body for signature verification
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const businessId = session.metadata?.businessId;
    const creditAmount = parseFloat(session.metadata?.creditAmount || "0");

    if (businessId && creditAmount > 0) {
      const business = await getBusiness(businessId);
      if (business) {
        const newBalance = (business.balance || 0) + creditAmount;
        await updateBusiness(businessId, { balance: newBalance });
        console.log(`[Webhook] Credited $${creditAmount} to business ${businessId}. New balance: $${newBalance}`);
      }
    }
  }

  return NextResponse.json({ received: true });
}
