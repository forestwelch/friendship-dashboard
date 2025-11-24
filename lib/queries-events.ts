"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { playSound } from "./sounds";

interface Event {
  id: string;
  name: string;
  date: string;
  emoji: string;
  description?: string;
  created_at: string;
}

interface EventCountdownData {
  events: Event[];
}

export function useEventCountdownWidget(friendId: string, widgetId: string) {
  return useQuery({
    queryKey: ["event_countdown", friendId, widgetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("friend_widgets")
        .select("config")
        .eq("friend_id", friendId)
        .eq("id", widgetId)
        .eq("widget_type", "event_countdown")
        .single();

      if (error) throw error;

      const config = (data?.config as EventCountdownData) || {
        events: [],
      };

      return config;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateEvent(friendId: string, widgetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventData: Omit<Event, "created_at">) => {
      const { data: currentData } = await supabase
        .from("friend_widgets")
        .select("config")
        .eq("id", widgetId)
        .single();

      const currentConfig = (currentData?.config as EventCountdownData) || {
        events: [],
      };

      const newEvent: Event = {
        ...eventData,
        created_at: new Date().toISOString(),
      };

      const updatedConfig: EventCountdownData = {
        events: [...currentConfig.events, newEvent],
      };

      const { data, error } = await supabase
        .from("friend_widgets")
        .update({ config: updatedConfig })
        .eq("id", widgetId)
        .select()
        .single();

      if (error) throw error;
      return data.config as EventCountdownData;
    },
    onMutate: async (eventData) => {
      await queryClient.cancelQueries({ queryKey: ["event_countdown", friendId, widgetId] });

      const previousData = queryClient.getQueryData<EventCountdownData>([
        "event_countdown",
        friendId,
        widgetId,
      ]);

      const newEvent: Event = {
        ...eventData,
        created_at: new Date().toISOString(),
      };

      const optimisticData: EventCountdownData = {
        events: previousData ? [...previousData.events, newEvent] : [newEvent],
      };

      queryClient.setQueryData<EventCountdownData>(
        ["event_countdown", friendId, widgetId],
        optimisticData
      );
      playSound("event_save");

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData<EventCountdownData>(
          ["event_countdown", friendId, widgetId],
          context.previousData
        );
      }
      playSound("error");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event_countdown", friendId, widgetId] });
    },
  });
}

export function useUpdateEvent(friendId: string, widgetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventData: Omit<Event, "created_at">) => {
      const { data: currentData } = await supabase
        .from("friend_widgets")
        .select("config")
        .eq("id", widgetId)
        .single();

      const currentConfig = (currentData?.config as EventCountdownData) || {
        events: [],
      };

      const updatedConfig: EventCountdownData = {
        events: currentConfig.events.map((event) =>
          event.id === eventData.id ? { ...event, ...eventData } : event
        ),
      };

      const { data, error } = await supabase
        .from("friend_widgets")
        .update({ config: updatedConfig })
        .eq("id", widgetId)
        .select()
        .single();

      if (error) throw error;
      return data.config as EventCountdownData;
    },
    onMutate: async (eventData) => {
      await queryClient.cancelQueries({ queryKey: ["event_countdown", friendId, widgetId] });

      const previousData = queryClient.getQueryData<EventCountdownData>([
        "event_countdown",
        friendId,
        widgetId,
      ]);

      const optimisticData: EventCountdownData = {
        events: previousData
          ? previousData.events.map((event) =>
              event.id === eventData.id ? { ...event, ...eventData } : event
            )
          : [],
      };

      queryClient.setQueryData<EventCountdownData>(
        ["event_countdown", friendId, widgetId],
        optimisticData
      );

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData<EventCountdownData>(
          ["event_countdown", friendId, widgetId],
          context.previousData
        );
      }
      playSound("error");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event_countdown", friendId, widgetId] });
    },
  });
}

export function useDeleteEvent(friendId: string, widgetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const { data: currentData } = await supabase
        .from("friend_widgets")
        .select("config")
        .eq("id", widgetId)
        .single();

      const currentConfig = (currentData?.config as EventCountdownData) || {
        events: [],
      };

      const updatedConfig: EventCountdownData = {
        events: currentConfig.events.filter((event) => event.id !== eventId),
      };

      const { data, error } = await supabase
        .from("friend_widgets")
        .update({ config: updatedConfig })
        .eq("id", widgetId)
        .select()
        .single();

      if (error) throw error;
      return data.config as EventCountdownData;
    },
    onMutate: async (eventId) => {
      await queryClient.cancelQueries({ queryKey: ["event_countdown", friendId, widgetId] });

      const previousData = queryClient.getQueryData<EventCountdownData>([
        "event_countdown",
        friendId,
        widgetId,
      ]);

      const optimisticData: EventCountdownData = {
        events: previousData
          ? previousData.events.filter((event) => event.id !== eventId)
          : [],
      };

      queryClient.setQueryData<EventCountdownData>(
        ["event_countdown", friendId, widgetId],
        optimisticData
      );
      playSound("delete");

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData<EventCountdownData>(
          ["event_countdown", friendId, widgetId],
          context.previousData
        );
      }
      playSound("error");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event_countdown", friendId, widgetId] });
    },
  });
}

