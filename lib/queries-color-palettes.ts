import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";
import { randomUUID } from "crypto";

export interface ColorPalette {
  id: string;
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  text: string;
  created_at: string;
}

/**
 * Get all saved color palettes from global_content
 */
export async function getColorPalettes(): Promise<ColorPalette[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const adminClient = getSupabaseAdmin();
    const { data, error } = await adminClient
      .from("global_content")
      .select("data")
      .eq("content_type", "color_palettes")
      .single();

    if (error || !data) {
      // No palettes exist yet, return empty array
      if (error?.code === "PGRST116") {
        return [];
      }
      console.error("Error fetching color palettes:", error);
      return [];
    }

    const palettes = data.data as ColorPalette[];
    return Array.isArray(palettes) ? palettes : [];
  } catch (error) {
    console.error("Error in getColorPalettes:", error);
    return [];
  }
}

/**
 * Save color palettes array to global_content
 */
async function saveColorPalettesArray(palettes: ColorPalette[]): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const adminClient = getSupabaseAdmin();
    const { error } = await adminClient.from("global_content").upsert(
      {
        content_type: "color_palettes",
        data: palettes,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "content_type",
      }
    );

    if (error) {
      console.error("Error saving color palettes:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in saveColorPalettesArray:", error);
    return false;
  }
}

/**
 * Add a new color palette
 */
export async function saveColorPalette(
  palette: Omit<ColorPalette, "id" | "created_at">
): Promise<ColorPalette | null> {
  const palettes = await getColorPalettes();

  const newPalette: ColorPalette = {
    ...palette,
    id: randomUUID(),
    created_at: new Date().toISOString(),
  };

  palettes.push(newPalette);
  const success = await saveColorPalettesArray(palettes);

  return success ? newPalette : null;
}

/**
 * Update an existing color palette
 */
export async function updateColorPalette(
  id: string,
  palette: Partial<Omit<ColorPalette, "id" | "created_at">>
): Promise<boolean> {
  const palettes = await getColorPalettes();
  const index = palettes.findIndex((p) => p.id === id);

  if (index === -1) {
    return false;
  }

  palettes[index] = {
    ...palettes[index],
    ...palette,
  };

  return await saveColorPalettesArray(palettes);
}

/**
 * Delete a color palette
 */
export async function deleteColorPalette(id: string): Promise<boolean> {
  const palettes = await getColorPalettes();
  const filtered = palettes.filter((p) => p.id !== id);

  if (filtered.length === palettes.length) {
    // Palette not found
    return false;
  }

  return await saveColorPalettesArray(filtered);
}
