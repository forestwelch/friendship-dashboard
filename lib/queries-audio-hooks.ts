import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAudioSnippets, uploadAudioSnippet } from "./queries-audio";
import { playSound } from "./sounds";

export function useAudioSnippets(friendId: string) {
  return useQuery({
    queryKey: ["audio_snippets", friendId],
    queryFn: () => getAudioSnippets(friendId),
  });
}

export function useUploadAudioSnippet(friendId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      audioBlob,
      recordedBy,
      iconName,
    }: {
      audioBlob: Blob;
      recordedBy: "admin" | "friend";
      iconName: string;
    }) => {
      return uploadAudioSnippet(friendId, audioBlob, recordedBy, iconName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audio_snippets", friendId] });
      playSound("success");
    },
    onError: () => {
      playSound("error");
    },
  });
}
