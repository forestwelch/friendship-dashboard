"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { playSound } from "./sounds";

interface MoodData {
  current_mood: {
    emoji: string;
    timestamp: string;
    notes?: string;
  };
  history: Array<{
    emoji: string;
    timestamp: string;
    notes?: string;
  }>;
}

export function useMoodWidget(friendId: string, widgetId: string) {
  return useQuery({
    queryKey: ["mood", friendId, widgetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("friend_widgets")
        .select("config")
        .eq("friend_id", friendId)
        .eq("id", widgetId)
        .single();

      if (error) throw error;

      const config = (data?.config as MoodData) || {
        current_mood: undefined,
        history: [],
      };

      return config;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useSetMood(friendId: string, widgetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ emoji, notes }: { emoji: string; notes?: string }) => {
      const timestamp = new Date().toISOString();

      // Get current config
      const { data: currentData } = await supabase
        .from("friend_widgets")
        .select("config")
        .eq("id", widgetId)
        .single();

      const currentConfig = (currentData?.config as MoodData) || {
        current_mood: undefined,
        history: [],
      };

      // Update config
      const newMood = {
        emoji,
        timestamp,
        notes: notes || "",
      };

      const updatedConfig: MoodData = {
        current_mood: newMood,
        history: [
          newMood,
          ...(currentConfig.history || []).filter(
            (entry) => new Date(entry.timestamp).getTime() !== new Date(timestamp).getTime()
          ),
        ].slice(0, 30), // Keep last 30 entries
      };

      const { data, error } = await supabase
        .from("friend_widgets")
        .update({ config: updatedConfig })
        .eq("id", widgetId)
        .select()
        .single();

      if (error) throw error;
      return data.config as MoodData;
    },
    onMutate: async ({ emoji, notes }) => {
      await queryClient.cancelQueries({ queryKey: ["mood", friendId, widgetId] });

      const previousData = queryClient.getQueryData<MoodData>(["mood", friendId, widgetId]);

      const timestamp = new Date().toISOString();
      const newMood = {
        emoji,
        timestamp,
        notes: notes || "",
      };

      const optimisticData: MoodData = {
        current_mood: newMood,
        history: previousData
          ? [newMood, ...(previousData.history || [])].slice(0, 30)
          : [newMood],
      };

      queryClient.setQueryData<MoodData>(["mood", friendId, widgetId], optimisticData);
      playSound("mood_set");

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData<MoodData>(["mood", friendId, widgetId], context.previousData);
      }
      playSound("error");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mood", friendId, widgetId] });
    },
  });
}

export function useUpdateMoodNotes(friendId: string, widgetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notes: string) => {
      const { data: currentData } = await supabase
        .from("friend_widgets")
        .select("config")
        .eq("id", widgetId)
        .single();

      const currentConfig = (currentData?.config as MoodData) || {
        current_mood: undefined,
        history: [],
      };

      if (!currentConfig.current_mood) {
        throw new Error("No current mood to update");
      }

      const updatedConfig: MoodData = {
        ...currentConfig,
        current_mood: {
          ...currentConfig.current_mood,
          notes,
        },
      };

      const { data, error } = await supabase
        .from("friend_widgets")
        .update({ config: updatedConfig })
        .eq("id", widgetId)
        .select()
        .single();

      if (error) throw error;
      return data.config as MoodData;
    },
    onMutate: async (notes) => {
      await queryClient.cancelQueries({ queryKey: ["mood", friendId, widgetId] });

      const previousData = queryClient.getQueryData<MoodData>(["mood", friendId, widgetId]);

      if (previousData?.current_mood) {
        const optimisticData: MoodData = {
          ...previousData,
          current_mood: {
            ...previousData.current_mood,
            notes,
          },
        };

        queryClient.setQueryData<MoodData>(["mood", friendId, widgetId], optimisticData);
      }

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData<MoodData>(["mood", friendId, widgetId], context.previousData);
      }
      playSound("error");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mood", friendId, widgetId] });
    },
  });
}

