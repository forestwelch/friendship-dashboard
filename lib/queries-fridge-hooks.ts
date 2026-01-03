import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getFridgeState,
  updateFridgeState,
  generateMagnetInventory,
  Magnet,
} from "./queries-fridge";

export function useFridgeState(friendId: string) {
  return useQuery({
    queryKey: ["fridge_state", friendId],
    queryFn: async () => {
      const state = await getFridgeState(friendId);
      if (state && state.magnets.length > 0) {
        return state;
      }
      // Initialize with inventory if no state exists or empty
      const inventory = generateMagnetInventory();
      const newState = await updateFridgeState(friendId, inventory);
      if (newState) {
        return newState;
      }
      // Fallback: return state with inventory if update failed
      return state ? { ...state, magnets: inventory } : null;
    },
  });
}

export function useUpdateFridgeState(friendId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (magnets: Magnet[]) => {
      return updateFridgeState(friendId, magnets);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fridge_state", friendId] });
    },
  });
}
