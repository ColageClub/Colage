import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, email, businessName, address, category } = body;

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  if (action === "login") {
    // Dev mode: auto-login, create business if doesn't exist
    let biz = store.getBusinessByEmail(email);
    if (!biz) {
      // In dev mode, auto-create on login attempt
      biz = store.createBusiness({
        id: `biz-${Date.now()}`,
        email,
        name: email.split("@")[0],
        address: "",
        category: "Other",
        logoUrl: null,
        createdAt: new Date().toISOString(),
      });
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

  if (action === "signup") {
    if (!businessName) {
      return NextResponse.json({ error: "Business name required" }, { status: 400 });
    }

    // Check if already exists
    const existing = store.getBusinessByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "Account already exists. Try logging in." }, { status: 400 });
    }

    const biz = store.createBusiness({
      id: `biz-${Date.now()}`,
      email,
      name: businessName,
      address: address || "",
      category: category || "Other",
      logoUrl: null,
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

  if (action === "logout") {
    const cookieStore = await cookies();
    cookieStore.delete("colage_session");
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
