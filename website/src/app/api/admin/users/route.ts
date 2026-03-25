import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { scanUsers } from "@/lib/models/user";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const school = searchParams.get("school") || undefined;
    const search = searchParams.get("search") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const lastKeyParam = searchParams.get("lastKey");
    const lastKey = lastKeyParam ? JSON.parse(lastKeyParam) : undefined;

    const result = await scanUsers({ school, search, limit, lastKey });
    return NextResponse.json({
      users: result.users,
      lastKey: result.lastKey ? JSON.stringify(result.lastKey) : null,
    });
  } catch {
    return NextResponse.json({ users: [], lastKey: null });
  }
}
