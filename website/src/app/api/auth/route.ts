export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getBusinessByEmail, createBusiness } from "@/lib/models/business";
import { setSession, logout } from "@/lib/auth";

const COGNITO_POOL_ID = process.env.NEXT_PUBLIC_BIZ_POOL_ID || "us-east-2_jeryfm6Xs";
const COGNITO_CLIENT_ID = process.env.NEXT_PUBLIC_BIZ_CLIENT_ID || "jffa9jhioo8adpvtq5bv2r9ks";
const COGNITO_ISSUER = `https://cognito-idp.us-east-2.amazonaws.com/${COGNITO_POOL_ID}`;

// Rate limiting: max 10 login requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 10;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  // Clean up expired entries
  for (const [key, entry] of rateLimitMap) {
    if (entry.resetAt <= now) rateLimitMap.delete(key);
  }
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt <= now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

/** Decode a base64url string (JWT segment) */
function decodeBase64Url(str: string): string {
  // Pad to multiple of 4
  const padded = str + "=".repeat((4 - (str.length % 4)) % 4);
  return Buffer.from(padded, "base64").toString("utf-8");
}

/** Verify JWT structural integrity and claims (not full JWKS signature verification) */
function verifyIdToken(idToken: string): { email: string; sub: string; businessName: string } | null {
  try {
    const parts = idToken.split(".");
    if (parts.length !== 3) return null;

    const claims = JSON.parse(decodeBase64Url(parts[1]));

    // Verify issuer
    if (claims.iss !== COGNITO_ISSUER) return null;

    // Verify token_use
    if (claims.token_use !== "id") return null;

    // Verify expiration
    if (!claims.exp || claims.exp < Math.floor(Date.now() / 1000)) return null;

    // Verify audience (client ID)
    if (claims.aud !== COGNITO_CLIENT_ID) return null;

    // Extract required fields
    const email = claims.email;
    const sub = claims.sub;
    if (!email || !sub) return null;

    return {
      email,
      sub,
      businessName: claims["custom:biz_name"] || email.split("@")[0],
    };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  // ─── Cognito-authenticated login ───────────────────────
  if (action === "cognito-login") {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { idToken } = body;
    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    // Verify the JWT and extract claims server-side
    const verified = verifyIdToken(idToken);
    if (!verified) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const { email, sub, businessName } = verified;

    // Ensure business exists in DB (create on first login)
    let biz = await getBusinessByEmail(email);
    if (!biz) {
      biz = await createBusiness({
        id: sub,
        email,
        name: businessName,
        address: "",
        category: "Other",
        logoUrl: null,
        stripeCustomerId: null,
        balance: 0,
        createdAt: new Date().toISOString(),
      });
    }

    // Set HMAC-signed session cookie
    await setSession({ businessId: biz.id, email: biz.email, businessName: biz.name });

    return NextResponse.json({ success: true, business: biz });
  }

  // ─── Logout ────────────────────────────────────────────
  if (action === "logout") {
    await logout();
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
