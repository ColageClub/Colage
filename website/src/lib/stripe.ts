import Stripe from "stripe";
import { getBusiness, updateBusiness } from "./models/business";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Create or retrieve a Stripe Customer for a business
export async function createOrGetCustomer(businessId: string, email: string): Promise<string> {
  const business = await getBusiness(businessId);
  if (business?.stripeCustomerId) {
    return business.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { businessId },
  });

  await updateBusiness(businessId, { stripeCustomerId: customer.id });
  return customer.id;
}

// Create a Checkout Session for adding funds
// The amount is the desired AD CREDIT amount
// We calculate total charge to cover Stripe's 2.9% + $0.30 fee
export async function createCheckoutSession(
  businessId: string,
  email: string,
  creditAmount: number, // in dollars, e.g. 25, 50, 100
): Promise<string> {
  const customerId = await createOrGetCustomer(businessId, email);

  // Calculate fee: total = (amount + 0.30) / (1 - 0.029)
  const totalCharge = (creditAmount + 0.30) / (1 - 0.029);
  const fee = totalCharge - creditAmount;

  // Convert to cents for Stripe
  const creditCents = Math.round(creditAmount * 100);
  const feeCents = Math.round(fee * 100);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Ad Credits — $${creditAmount}`,
            description: `$${creditAmount.toFixed(2)} in Colage ad credits`,
          },
          unit_amount: creditCents,
        },
        quantity: 1,
      },
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Processing Fee",
            description: "Covers payment processing costs",
          },
          unit_amount: feeCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      businessId,
      creditAmount: creditAmount.toString(),
    },
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/ads/dashboard?funded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/ads/dashboard`,
  });

  return session.url!;
}

// Get the balance for a Stripe customer
export async function getCustomerBalance(stripeCustomerId: string): Promise<number> {
  const customer = await stripe.customers.retrieve(stripeCustomerId);
  if (customer.deleted) return 0;
  // Stripe stores balance in cents, negative = credit owed TO customer
  // We use our own balance tracking in DynamoDB instead
  return 0;
}
