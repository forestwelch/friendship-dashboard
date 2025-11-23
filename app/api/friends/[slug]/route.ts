import { NextRequest, NextResponse } from "next/server";
import { getFriendPage } from "@/lib/queries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const resolvedParams = await params;
    const slug = resolvedParams?.slug;

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const pageData = await getFriendPage(slug);

    if (!pageData || !pageData.friend) {
      return NextResponse.json({ error: "Friend not found" }, { status: 404 });
    }

    return NextResponse.json(pageData);
  } catch (error) {
    console.error("Error fetching friend:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


