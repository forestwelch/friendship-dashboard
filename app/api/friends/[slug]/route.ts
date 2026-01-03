import { NextRequest, NextResponse } from "next/server";
import { getFriendPage } from "@/lib/queries";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const resolvedParams = await params;
    const slug = resolvedParams?.slug;

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const adminClient = getSupabaseAdmin();

    // Find the friend by slug
    const { data: friend, error: findError } = await adminClient
      .from("friends")
      .select("id")
      .eq("slug", slug)
      .single();

    if (findError || !friend) {
      return NextResponse.json({ error: "Friend not found" }, { status: 404 });
    }

    // Delete the friend (cascade will handle related records)
    const { error: deleteError } = await adminClient.from("friends").delete().eq("id", friend.id);

    if (deleteError) {
      console.error("Error deleting friend:", deleteError);
      return NextResponse.json({ error: "Failed to delete friend" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/friends/[slug]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
