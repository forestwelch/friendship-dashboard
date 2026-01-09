import { NextRequest, NextResponse } from "next/server";
import {
  getColorPalettes,
  saveColorPalette,
  updateColorPalette,
  deleteColorPalette,
  ColorPalette,
} from "@/lib/queries-color-palettes";

export async function GET() {
  try {
    const palettes = await getColorPalettes();
    return NextResponse.json({ palettes });
  } catch (error) {
    console.error("Error fetching color palettes:", error);
    return NextResponse.json({ palettes: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { primary, secondary, accent, bg, text } = body;

    // Validate required fields
    if (!primary || !secondary || !accent || !bg || !text) {
      return NextResponse.json({ error: "Missing required color fields" }, { status: 400 });
    }

    // Validate color format (basic hex check)
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    const colors = [primary, secondary, accent, bg, text];
    if (!colors.every((color) => hexPattern.test(color))) {
      return NextResponse.json(
        { error: "Invalid color format. Must be hex colors (e.g., #4a9eff)" },
        { status: 400 }
      );
    }

    const palette = await saveColorPalette({
      primary,
      secondary,
      accent,
      bg,
      text,
    });

    if (!palette) {
      return NextResponse.json({ error: "Failed to save palette" }, { status: 500 });
    }

    return NextResponse.json({ palette });
  } catch (error) {
    console.error("Error creating color palette:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, primary, secondary, accent, bg, text } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing palette ID" }, { status: 400 });
    }

    const updates: Partial<ColorPalette> = {};
    if (primary) updates.primary = primary;
    if (secondary) updates.secondary = secondary;
    if (accent) updates.accent = accent;
    if (bg) updates.bg = bg;
    if (text) updates.text = text;

    const success = await updateColorPalette(id, updates);

    if (!success) {
      return NextResponse.json({ error: "Palette not found or update failed" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating color palette:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing palette ID" }, { status: 400 });
    }

    const success = await deleteColorPalette(id);

    if (!success) {
      return NextResponse.json({ error: "Palette not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting color palette:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
