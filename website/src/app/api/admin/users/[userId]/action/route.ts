import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { updateUserStatus, deleteUser, getUser } from "@/lib/models/user";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { userId } = await params;
    const body = await request.json();
    const { action } = body;

    const user = await getUser(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    switch (action) {
      case "suspend":
        await updateUserStatus(userId, "suspended");
        return NextResponse.json({ success: true, status: "suspended" });
      case "unsuspend":
        await updateUserStatus(userId, "active");
        return NextResponse.json({ success: true, status: "active" });
      case "ban":
        await updateUserStatus(userId, "banned");
        return NextResponse.json({ success: true, status: "banned" });
      case "delete":
        await deleteUser(userId);
        return NextResponse.json({ success: true, status: "deleted" });
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Failed to perform action" }, { status: 500 });
  }
}
