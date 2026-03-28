// Business auth — reads Cognito tokens from httpOnly cookies
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

export interface Session {
  businessId: string; // Cognito sub
  email: string;
  businessName: string;
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.warn("[Auth] WARNING: SESSION_SECRET not set in production! Using insecure default.");
    }
    return "colage-dev-secret-change-me";
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function verifySignature(payload: string, signature: string): boolean {
  const expected = sign(payload);
  try {
    const sigBuf = Buffer.from(signature, "base64url");
    const expBuf = Buffer.from(expected, "base64url");
    if (sigBuf.length !== expBuf.length) return false;
    return timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("colage_biz_session");
  if (!cookie) return null;

  try {
    const { payload, signature } = JSON.parse(
      Buffer.from(cookie.value, "base64url").toString()
    );
    if (!payload || !signature) return null;
    if (!verifySignature(payload, signature)) return null;
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export async function setSession(session: Session) {
  const payload = JSON.stringify(session);
  const signature = sign(payload);
  const cookieValue = Buffer.from(
    JSON.stringify({ payload, signature })
  ).toString("base64url");

  const cookieStore = await cookies();
  cookieStore.set("colage_biz_session", cookieValue, COOKIE_OPTIONS);
}

export async function setTokens(accessToken: string, idToken: string, refreshToken?: string) {
  const cookieStore = await cookies();
  cookieStore.set("colage_biz_access", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
  cookieStore.set("colage_biz_id", idToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  if (refreshToken) {
    cookieStore.set("colage_biz_refresh", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
}

export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("colage_biz_access")?.value || null;
}

export async function getRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("colage_biz_refresh")?.value || null;
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("colage_biz_session");
  cookieStore.delete("colage_biz_access");
  cookieStore.delete("colage_biz_id");
  cookieStore.delete("colage_biz_refresh");
}
