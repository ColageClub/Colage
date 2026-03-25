import { NextRequest, NextResponse } from "next/server";
import { getBusinessByEmail, createBusiness } from "@/lib/models/business";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  // ─── Cognito-authenticated login ───────────────────────
  if (action === "cognito-login") {
    const { idToken, email, businessName, sub } = body;
    if (!idToken || !email || !sub) {
      return NextResponse.json({ error: "Missing auth data" }, { status: 400 });
    }

    // Ensure business exists in DB (create on first login)
    let biz = await getBusinessByEmail(email);
    if (!biz) {
      biz = await createBusiness({
        id: sub,
        email,
        name: businessName || email.split("@")[0],
        address: "",
        category: "Other",
        logoUrl: null,
        stripeCustomerId: null,
        balance: 0,
        createdAt: new Date().toISOString(),
      });
    }

    const session = { businessId: biz.id, email: biz.email, businessName: biz.name };
    const cookieStore = await cookies();
    cookieStore.set("colage_session", JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.json({ success: true, business: biz });
  }

  // ─── Legacy login (dev fallback) ───────────────────────
  if (action === "login") {
    const { email } = body;
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    let biz = await getBusinessByEmail(email);
    if (!biz) {
      return NextResponse.json({ error: "Account not found. Please sign up first." }, { status: 400 });
    }

    const session = { businessId: biz.id, email: biz.email, businessName: biz.name };
    const cookieStore = await cookies();
    cookieStore.set("colage_session", JSON.stringify(session), {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return NextResponse.json({ success: true, business: biz });
  }

  // ─── Legacy signup (dev fallback) ──────────────────────
  if (action === "signup") {
    const { email, businessName, address, category } = body;
    if (!email || !businessName) {
      return NextResponse.json({ error: "Email and business name required" }, { status: 400 });
    }

    const existing = await getBusinessByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "Account already exists. Try logging in." }, { status: 400 });
    }

    const biz = await createBusiness({
      id: `biz-${Date.now()}`,
      email,
      name: businessName,
      address: address || "",
      category: category || "Other",
      logoUrl: null,
      stripeCustomerId: null,
      balance: 0,
      createdAt: new Date().toISOString(),
    });

    const session = { businessId: biz.id, email: biz.email, businessName: biz.name };
    const cookieStore = await cookies();
    cookieStore.set("colage_session", JSON.stringify(session), {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return NextResponse.json({ success: true, business: biz });
  }

  // ─── Logout ────────────────────────────────────────────
  if (action === "logout") {
    const cookieStore = await cookies();
    cookieStore.delete("colage_session");
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
