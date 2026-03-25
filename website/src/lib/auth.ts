// Business auth — reads Cognito tokens from httpOnly cookies
import { cookies } from "next/headers";

export interface Session {
  businessId: string; // Cognito sub
  email: string;
  businessName: string;
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("colage_biz_session");
  if (session) {
    try {
      return JSON.parse(session.value);
    } catch {
      return null;
    }
  }
  return null;
}

export async function setSession(session: Session) {
  const cookieStore = await cookies();
  cookieStore.set("colage_biz_session", JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
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
