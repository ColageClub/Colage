import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getAllUniversities, createUniversity, type University } from "@/lib/models/university";
import { getUserCountBySchool } from "@/lib/models/user";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const universities = await getAllUniversities();
    const schools = await Promise.all(
      universities.map(async (uni) => {
        const userCount = await getUserCountBySchool(uni.domain);
        return { ...uni, userCount };
      })
    );
    return NextResponse.json({ schools });
  } catch {
    return NextResponse.json({ schools: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { domain, name, primaryColor, accentColor, textColor } = body;

    if (!domain || !name) {
      return NextResponse.json({ error: "domain and name are required" }, { status: 400 });
    }

    const uni: University = {
      domain,
      name,
      primaryColor: primaryColor || "#6C5CE7",
      accentColor: accentColor || "#00CEC9",
      textColor: textColor || "#FFFFFF",
      createdAt: new Date().toISOString(),
    };

    await createUniversity(uni);
    return NextResponse.json({ school: uni }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create school" }, { status: 500 });
  }
}
