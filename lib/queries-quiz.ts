"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { playSound } from "./sounds";
import { calculateCompatibility, QuizResult } from "./quiz-questions";

interface QuizResultData {
  emoji: string;
  title: string;
  description: string;
  answers: string[];
  completed_at: string;
}

interface PersonalityQuizData {
  your_result?: QuizResultData;
  their_result?: QuizResultData;
  compatibility_note?: string;
}

export function usePersonalityQuizWidget(friendId: string, widgetId: string) {
  return useQuery({
    queryKey: ["personality_quiz", friendId, widgetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("friend_widgets")
        .select("config")
        .eq("friend_id", friendId)
        .eq("id", widgetId)
        .single();

      if (error) throw error;

      const config = (data?.config as PersonalityQuizData) || {
        your_result: undefined,
        their_result: undefined,
        compatibility_note: undefined,
      };

      return config;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useSubmitQuizAnswers(friendId: string, widgetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      your_result,
      compatibility_note,
    }: {
      your_result: QuizResultData;
      compatibility_note?: string;
    }) => {
      const { data: currentData } = await supabase
        .from("friend_widgets")
        .select("config")
        .eq("id", widgetId)
        .single();

      const currentConfig = (currentData?.config as PersonalityQuizData) || {
        your_result: undefined,
        their_result: undefined,
        compatibility_note: undefined,
      };

      // Calculate compatibility if their_result exists
      let finalCompatibilityNote = compatibility_note;
      if (currentConfig.their_result && !compatibility_note) {
        const theirResult: QuizResult = {
          emoji: currentConfig.their_result.emoji,
          title: currentConfig.their_result.title,
          description: currentConfig.their_result.description,
        };
        const yourResult: QuizResult = {
          emoji: your_result.emoji,
          title: your_result.title,
          description: your_result.description,
        };
        finalCompatibilityNote = calculateCompatibility(yourResult, theirResult);
      }

      const updatedConfig: PersonalityQuizData = {
        ...currentConfig,
        your_result,
        compatibility_note: finalCompatibilityNote,
      };

      const { data, error } = await supabase
        .from("friend_widgets")
        .update({ config: updatedConfig })
        .eq("id", widgetId)
        .select()
        .single();

      if (error) throw error;
      return data.config as PersonalityQuizData;
    },
    onMutate: async ({ your_result, compatibility_note }) => {
      await queryClient.cancelQueries({
        queryKey: ["personality_quiz", friendId, widgetId],
      });

      const previousData = queryClient.getQueryData<PersonalityQuizData>([
        "personality_quiz",
        friendId,
        widgetId,
      ]);

      // Calculate compatibility if their_result exists
      let finalCompatibilityNote = compatibility_note;
      if (previousData?.their_result && !compatibility_note) {
        const theirResult: QuizResult = {
          emoji: previousData.their_result.emoji,
          title: previousData.their_result.title,
          description: previousData.their_result.description,
        };
        const yourResult: QuizResult = {
          emoji: your_result.emoji,
          title: your_result.title,
          description: your_result.description,
        };
        finalCompatibilityNote = calculateCompatibility(yourResult, theirResult);
      }

      const optimisticData: PersonalityQuizData = {
        ...previousData,
        your_result,
        compatibility_note: finalCompatibilityNote,
      };

      queryClient.setQueryData<PersonalityQuizData>(
        ["personality_quiz", friendId, widgetId],
        optimisticData
      );
      playSound("quiz_results");

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData<PersonalityQuizData>(
          ["personality_quiz", friendId, widgetId],
          context.previousData
        );
      }
      playSound("error");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["personality_quiz", friendId, widgetId],
      });
    },
  });
}
