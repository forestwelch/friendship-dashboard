import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getConsumptionEntries,
  createConsumptionEntry,
  markConsumptionEntryAsRead,
} from "./queries-consumption";
import { playSound } from "./sounds";

export function useConsumptionEntries(friendId: string) {
  return useQuery({
    queryKey: ["consumption_entries", friendId],
    queryFn: () => getConsumptionEntries(friendId),
  });
}

export function useCreateConsumptionEntry(friendId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      thought,
      link,
      addedBy,
    }: {
      title: string;
      thought: string;
      link: string | null;
      addedBy: "admin" | "friend";
    }) => {
      return createConsumptionEntry(friendId, title, thought, link, addedBy);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consumption_entries", friendId] });
      playSound("success");
    },
    onError: () => {
      playSound("error");
    },
  });
}

export function useMarkConsumptionEntryAsRead(friendId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entryId, reader }: { entryId: string; reader: "admin" | "friend" }) => {
      return markConsumptionEntryAsRead(entryId, reader);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consumption_entries", friendId] });
    },
  });
}
