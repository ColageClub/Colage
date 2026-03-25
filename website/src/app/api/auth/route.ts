import { NextRequest, NextResponse } from "next/server";
import { setSession, setTokens, logout as serverLogout } from "@/lib/auth";
import { createBusiness, getBusinessByEmail } from "@/lib/models/business";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  try {
    // ─── Login: receive tokens from client-side Cognito auth ───
    if (action === "login") {
      const { email, businessName, sub, accessToken, idToken, refreshToken } = body;

      if (!accessToken || !idToken || !email || !sub) {
        return NextResponse.json({ error: "Missing auth data" }, { status: 400 });
      }

      // Store tokens in httpOnly cookies
      await setTokens(accessToken, idToken, refreshToken);

      // Create or fetch business record in our DB
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

      await setSession({ businessId: biz.id, email: biz.email, businessName: biz.name });

      return NextResponse.json({ success: true, business: biz });
    }

    // ─── Logout ───
    if (action === "logout") {
      await serverLogout();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    console.error("[auth]", error);
    return NextResponse.json(
      { error: error.message || "Auth failed" },
      { status: 500 }
    );
  }
}
