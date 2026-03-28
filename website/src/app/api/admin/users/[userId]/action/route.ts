import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { updateUserStatus, deleteUser, getUser } from "@/lib/models/user";
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, Tables } from "@/lib/db";

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
      case "delete": {
        await deleteUser(userId);
        // Cascade: clean up location record
        try {
          await docClient.send(new DeleteCommand({
            TableName: Tables.LOCATIONS,
            Key: { universityDomain: user.universityDomain, userId },
          }));
          console.log(`[AdminDelete] Cleaned up location for user ${userId} at ${user.universityDomain}`);
        } catch (cleanupErr) {
          console.warn(`[AdminDelete] Location cleanup failed for user ${userId}:`, cleanupErr);
        }
        return NextResponse.json({ success: true, status: "deleted" });
      }
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Failed to perform action" }, { status: 500 });
  }
}
