import { supabase, isSupabaseConfigured } from "./supabase";

export interface Magnet {
  type: "letter" | "number" | "punctuation" | "icon";
  value: string;
  x: number;
  y: number;
  color?: string;
  rotation?: number;
  inBank?: boolean;
}

export interface FridgeState {
  id: string;
  friend_id: string;
  magnets: Magnet[];
  inventory?: Record<string, number>;
  updated_at: string;
}

export const DEFAULT_INVENTORY: Record<string, number> = {
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
  "0": 2,
  "1": 2,
  "2": 2,
  "3": 2,
  "4": 2,
  "5": 2,
  "6": 2,
  "7": 2,
  "8": 2,
  "9": 2,
  "!": 3,
  "?": 2,
  "&": 1,
  "hn-tiktok": 2,
  "hn-heart-solid": 2,
  "hn-crown-solid": 1,
  "hn-headphones-solid": 1,
  "hn-gaming": 1,
  "hn-lightbulb-solid": 1,
  "hn-moon-solid": 1,
  "hn-sun-solid": 1,
  "hn-star-solid": 2,
  "hn-paperclip-solid": 1,
  "hn-lock-solid": 1,
  "hn-lock-open-solid": 1,
  "hn-trash-alt-solid": 1,
};

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

    if (data) {
      const mergedInventory = { ...DEFAULT_INVENTORY, ...(data.inventory || {}) };

      let cleanedMagnets: Magnet[] = (data.magnets || []) as Magnet[];
      const needsUpdate = cleanedMagnets.some(
        (m: Magnet) => m.inBank === undefined && m.x === 0 && m.y === 0
      );
      if (needsUpdate && cleanedMagnets.length > 0) {
        cleanedMagnets = cleanedMagnets.map((m: Magnet) => {
          if (m.inBank === undefined && m.x === 0 && m.y === 0) {
            return { ...m, inBank: true };
          }
          return m;
        });
      }

      if (!data.inventory || Object.keys(data.inventory || {}).length === 0) {
        const updatedState = await updateFridgeState(
          data.friend_id,
          cleanedMagnets,
          mergedInventory
        );
        if (updatedState) {
          return updatedState;
        }
        return { ...data, magnets: cleanedMagnets, inventory: mergedInventory };
      }

      const hasAllKeys = Object.keys(DEFAULT_INVENTORY).every(
        (key) => key in (data.inventory || {})
      );
      if (!hasAllKeys || needsUpdate) {
        const updatedState = await updateFridgeState(
          data.friend_id,
          cleanedMagnets,
          mergedInventory
        );
        if (updatedState) {
          return updatedState;
        }
        return { ...data, magnets: cleanedMagnets, inventory: mergedInventory };
      }

      return { ...data, magnets: cleanedMagnets, inventory: mergedInventory };
    }

    return null;
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
        inventory: DEFAULT_INVENTORY,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating fridge state:", error);
      return null;
    }

    if (!data.inventory) {
      return { ...data, inventory: DEFAULT_INVENTORY };
    }

    return data;
  } catch (error) {
    console.error("Error in createFridgeState:", error);
    return null;
  }
}

export async function updateFridgeState(
  friendId: string,
  magnets: Magnet[],
  inventory?: Record<string, number>
): Promise<FridgeState | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    // Build update object - only include inventory if it exists in schema
    const updateData: {
      friend_id: string;
      magnets: Magnet[];
      inventory?: Record<string, number>;
      updated_at: string;
    } = {
      friend_id: friendId,
      magnets,
      updated_at: new Date().toISOString(),
    };

    if (inventory) {
      updateData.inventory = inventory;
    }

    const { data, error } = await supabase
      .from("fridge_state")
      .upsert(updateData, {
        onConflict: "friend_id",
      })
      .select()
      .single();

    if (error) {
      console.error("Error updating fridge state:", error);
      if (error.message?.includes("inventory") || error.code === "42703") {
        const { data: retryData, error: retryError } = await supabase
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

        if (retryError) {
          console.error("Error updating fridge state (retry):", retryError);
          return null;
        }
        return { ...retryData, inventory: DEFAULT_INVENTORY };
      }
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in updateFridgeState:", error);
    return null;
  }
}

const MAGNET_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#FFA07A",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E2",
  "#F8B739",
  "#52BE80",
  "#EC7063",
  "#5DADE2",
  "#F1948A",
  "#82E0AA",
  "#F4D03F",
  "#AF7AC5",
];

export function getColorForValue(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  const index = Math.abs(hash) % MAGNET_COLORS.length;
  return MAGNET_COLORS[index];
}

export function getRandomColor(): string {
  return MAGNET_COLORS[Math.floor(Math.random() * MAGNET_COLORS.length)];
}

export function getRandomRotation(): number {
  return (Math.random() - 0.5) * 10;
}

export function getCanvasDimensions(size: string): { width: number; height: number } {
  // Calculate canvas dimensions based on size
  // Base dimensions scale proportionally
  const [cols, rows] = size.split("x").map(Number);

  // Base size for 2x3: 400x600
  // Scale proportionally for other sizes
  const baseWidth = 200; // per column
  const baseHeight = 185; // per row (slightly reduced to fit better)

  return {
    width: baseWidth * cols,
    height: baseHeight * rows,
  };
}

export function generateMagnetInventory(): Magnet[] {
  return [];
}

export function getBankCounts(magnets: Magnet[]): Record<string, number> {
  const counts: Record<string, number> = {};
  magnets.forEach((magnet) => {
    if (magnet.inBank) {
      counts[magnet.value] = (counts[magnet.value] || 0) + 1;
    }
  });
  return counts;
}

export function getCanvasCounts(magnets: Magnet[]): Record<string, number> {
  const counts: Record<string, number> = {};
  magnets.forEach((magnet) => {
    if (!magnet.inBank) {
      counts[magnet.value] = (counts[magnet.value] || 0) + 1;
    }
  });
  return counts;
}

export function getAvailableBankCounts(
  inventory: Record<string, number>,
  canvasCounts: Record<string, number>
): Record<string, number> {
  const available: Record<string, number> = {};
  const mergedInventory = { ...DEFAULT_INVENTORY, ...inventory };

  Object.keys(mergedInventory).forEach((key) => {
    const total = mergedInventory[key] || 0;
    const onCanvas = canvasCounts[key] || 0;
    const inBank = total - onCanvas;
    available[key] = Math.max(0, inBank);
  });
  return available;
}
