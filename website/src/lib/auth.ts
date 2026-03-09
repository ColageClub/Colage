// Dev mode auth — simple cookie-based session
// Replace with Cognito/NextAuth for production

import { cookies } from "next/headers";

export interface Session {
  businessId: string;
  email: string;
  businessName: string;
}

const DEV_SESSION: Session = {
  businessId: "demo-biz-1",
  email: "owner@bluebrew.com",
  businessName: "Blue Brew Coffee",
};

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("colage_session");
  if (session) {
    try {
      return JSON.parse(session.value);
    } catch {
      return null;
    }
  }
  return null;
}

export async function devLogin(email: string, businessName: string, businessId: string): Promise<Session> {
  const session: Session = { businessId, email, businessName };
  const cookieStore = await cookies();
  cookieStore.set("colage_session", JSON.stringify(session), {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return session;
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("colage_session");
}
