import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getFridgeState,
  updateFridgeState,
  generateMagnetInventory,
  DEFAULT_INVENTORY,
  Magnet,
  FridgeState,
} from "./queries-fridge";

export function useFridgeState(friendId: string) {
  return useQuery({
    queryKey: ["fridge_state", friendId],
    queryFn: async () => {
      const state = await getFridgeState(friendId);
      if (state) {
        // Always ensure inventory exists and includes all keys from DEFAULT_INVENTORY
        // Merge to ensure icons and other keys are present even if missing from DB
        const inventory = { ...DEFAULT_INVENTORY, ...(state.inventory || {}) };

        // Return state with merged inventory (magnets can be empty - all start in bank)
        return { ...state, inventory };
      }
      // No state exists - create new one
      const magnets = generateMagnetInventory();
      const newState = await updateFridgeState(friendId, magnets, DEFAULT_INVENTORY);
      if (newState) {
        return newState;
      }
      // Fallback: return new state in memory
      return {
        id: "",
        friend_id: friendId,
        magnets,
        inventory: DEFAULT_INVENTORY,
        updated_at: new Date().toISOString(),
      };
    },
  });
}

export function useUpdateFridgeState(friendId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (magnets: Magnet[]) => {
      // Get current state to preserve inventory
      const currentState = queryClient.getQueryData<FridgeState>(["fridge_state", friendId]);
      const inventory = currentState?.inventory || DEFAULT_INVENTORY;
      return updateFridgeState(friendId, magnets, inventory);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fridge_state", friendId] });
    },
  });
}
