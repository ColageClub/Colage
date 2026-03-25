import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getUniversity } from "@/lib/models/university";
import { getUsersBySchool } from "@/lib/models/user";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { domain } = await params;
    const university = await getUniversity(domain);
    if (!university) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const users = await getUsersBySchool(domain);
    return NextResponse.json({ university, users });
  } catch {
    return NextResponse.json({ error: "Failed to fetch school" }, { status: 500 });
  }
}
