import { supabase, isSupabaseConfigured } from "./supabase";

export interface Magnet {
  type: "letter" | "number" | "punctuation" | "icon";
  value: string;
  x: number;
  y: number;
}

export interface FridgeState {
  id: string;
  friend_id: string;
  magnets: Magnet[];
  updated_at: string;
}

export async function getFridgeState(friendId: string): Promise<FridgeState | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("fridge_state")
      .select("*")
      .eq("friend_id", friendId)
      .single();

    if (error) {
      // If no state exists, create one
      if (error.code === "PGRST116") {
        return await createFridgeState(friendId);
      }
      console.error("Error fetching fridge state:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in getFridgeState:", error);
    return null;
  }
}

export async function createFridgeState(friendId: string): Promise<FridgeState | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("fridge_state")
      .insert({
        friend_id: friendId,
        magnets: [],
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating fridge state:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in createFridgeState:", error);
    return null;
  }
}

export async function updateFridgeState(
  friendId: string,
  magnets: Magnet[]
): Promise<FridgeState | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("fridge_state")
      .upsert(
        {
          friend_id: friendId,
          magnets,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "friend_id",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Error updating fridge state:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in updateFridgeState:", error);
    return null;
  }
}

// Generate initial magnet inventory with random positions
export function generateMagnetInventory(): Magnet[] {
  const magnets: Magnet[] = [];
  const canvasWidth = 400; // Match modal canvas width
  const canvasHeight = 400; // Match modal canvas height
  const magnetSize = 40; // Approximate magnet size

  // Helper to get random position
  const getRandomPosition = () => ({
    x: Math.random() * (canvasWidth - magnetSize),
    y: Math.random() * (canvasHeight - magnetSize),
  });

  // Letters
  const letterCounts: Record<string, number> = {
    E: 8,
    A: 6,
    I: 6,
    O: 6,
    N: 6,
    R: 6,
    S: 6,
    T: 6,
    L: 4,
    C: 4,
    U: 4,
    D: 4,
    H: 4,
    M: 4,
    B: 2,
    F: 2,
    G: 2,
    P: 2,
    W: 2,
    Y: 2,
    V: 2,
    K: 2,
    J: 1,
    Q: 1,
    X: 1,
    Z: 1,
  };

  for (const [letter, count] of Object.entries(letterCounts)) {
    for (let i = 0; i < count; i++) {
      magnets.push({ type: "letter", value: letter, ...getRandomPosition() });
    }
  }

  // Numbers
  for (let num = 0; num <= 9; num++) {
    for (let i = 0; i < 2; i++) {
      magnets.push({ type: "number", value: String(num), ...getRandomPosition() });
    }
  }

  // Punctuation
  const punctuation: Array<{ value: string; count: number }> = [
    { value: "!", count: 3 },
    { value: "?", count: 2 },
    { value: "&", count: 1 },
    { value: "♥", count: 2 },
  ];

  for (const { value, count } of punctuation) {
    for (let i = 0; i < count; i++) {
      magnets.push({ type: "punctuation", value, ...getRandomPosition() });
    }
  }

  // Icons
  const icons = [
    "heart",
    "star",
    "skull",
    "smiley",
    "music",
    "lightning",
    "moon",
    "sun",
    "flower",
    "ghost",
    "alien",
    "pizza",
    "fire",
    "rainbow",
  ];

  for (const icon of icons) {
    magnets.push({ type: "icon", value: icon, ...getRandomPosition() });
  }

  return magnets;
}
