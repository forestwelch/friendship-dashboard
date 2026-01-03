import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCurrentTopic,
  getReviewsForTopic,
  createTopic,
  submitReview,
  revealTopic,
} from "./queries-reviews";
import { playSound } from "./sounds";

export function useCurrentTopic(friendId: string) {
  return useQuery({
    queryKey: ["review_topic", friendId],
    queryFn: () => getCurrentTopic(friendId),
  });
}

export function useReviewsForTopic(topicId: string | null) {
  return useQuery({
    queryKey: ["reviews", topicId],
    queryFn: () => (topicId ? getReviewsForTopic(topicId) : Promise.resolve([])),
    enabled: !!topicId,
  });
}

export function useCreateTopic(friendId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (topicName: string) => {
      return createTopic(friendId, topicName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review_topic", friendId] });
      playSound("success");
    },
    onError: () => {
      playSound("error");
    },
  });
}

export function useSubmitReview(friendId: string, topicId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reviewer,
      stars,
      reviewText,
      recommend,
    }: {
      reviewer: "admin" | "friend";
      stars: number;
      reviewText: string;
      recommend: boolean;
    }) => {
      return submitReview(topicId, reviewer, stars, reviewText, recommend);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", topicId] });
      queryClient.invalidateQueries({ queryKey: ["review_topic", friendId] });
      playSound("success");
    },
    onError: () => {
      playSound("error");
    },
  });
}

export function useRevealTopic(friendId: string, topicId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return revealTopic(topicId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review_topic", friendId] });
      queryClient.invalidateQueries({ queryKey: ["reviews", topicId] });
      playSound("success");
    },
    onError: () => {
      playSound("error");
    },
  });
}
