import { getSession } from "./auth";

const ADMIN_EMAILS = ["amcarbonaro@icloud.com", "admin@colageclub.com"];

export function isAdmin(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export async function requireAdmin(): Promise<{ email: string; businessId: string }> {
  const session = await getSession();
  if (!session) {
    throw new Response("Unauthorized", { status: 401 });
  }
  if (!isAdmin(session.email)) {
    throw new Response("Forbidden", { status: 403 });
  }
  return session;
}

export async function checkAdmin(): Promise<boolean> {
  try {
    const session = await getSession();
    if (!session) return false;
    return isAdmin(session.email);
  } catch {
    return false;
  }
}
