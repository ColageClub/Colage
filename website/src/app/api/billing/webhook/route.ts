import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, Tables } from "@/lib/db";

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
      const sessionId = session.id;
      try {
        const result = await docClient.send(new UpdateCommand({
          TableName: Tables.BUSINESSES,
          Key: { id: businessId },
          UpdateExpression: "ADD balance :amount, processedWebhooks :sidSet",
          ConditionExpression: "attribute_not_exists(processedWebhooks) OR NOT contains(processedWebhooks, :sid)",
          ExpressionAttributeValues: {
            ":amount": creditAmount,
            ":sidSet": new Set([sessionId]),
            ":sid": sessionId,
          },
          ReturnValues: "ALL_NEW",
        }));
        const newBalance = (result.Attributes as { balance?: number })?.balance ?? 0;
        console.log(`[Webhook] Credited $${creditAmount} to business ${businessId}. New balance: $${newBalance}`);
      } catch (err: unknown) {
        const error = err as { name?: string };
        if (error.name === "ConditionalCheckFailedException") {
          console.log(`[Webhook] Session ${sessionId} already processed for business ${businessId}, skipping`);
        } else {
          throw err;
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
