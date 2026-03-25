import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isAdmin } from "@/lib/admin-auth";

// GET /api/admin/login?email=amcarbonaro@icloud.com
// Dev-only admin login shortcut
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email") || "amcarbonaro@icloud.com";

  if (!isAdmin(email)) {
    return NextResponse.json({ error: "Not an admin email" }, { status: 403 });
  }

  const session = {
    businessId: "admin",
    email,
    businessName: "Admin",
  };

  const cookieStore = await cookies();
  cookieStore.set("colage_session", JSON.stringify(session), {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  // Get the actual host from headers (works behind CloudFront/Amplify)
  const host = req.headers.get("host") || req.headers.get("x-forwarded-host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const origin = host ? `${proto}://${host}` : new URL(req.url).origin;
  return NextResponse.redirect(new URL("/admin", origin));
}
