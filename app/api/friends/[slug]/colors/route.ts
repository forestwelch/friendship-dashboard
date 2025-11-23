import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json();
  const { colors } = body;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  if (!colors || typeof colors !== "object") {
    return NextResponse.json(
      { error: "Invalid colors data" },
      { status: 400 }
    );
  }

  try {
    const adminClient = getSupabaseAdmin();

    // Update friend colors
    const { error } = await adminClient
      .from("friends")
      .update({
        color_primary: colors.primary,
        color_secondary: colors.secondary,
        color_accent: colors.accent,
        color_bg: colors.bg,
        color_text: colors.text,
      })
      .eq("slug", slug);

    if (error) {
      console.error("Error updating colors:", error);
      return NextResponse.json(
        { error: `Failed to save colors: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving colors:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

