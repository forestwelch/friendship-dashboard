"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "./supabase";
import { playSound } from "./sounds";
import {
  createEmptyBoard,
  makeMove,
  checkWin,
  checkDraw,
  validateMove,
  Board,
} from "./connect-four-logic";

interface GameMove {
  player: "you" | "them";
  column: number;
  timestamp: string;
}

interface ConnectFourData {
  board: Board;
  current_turn: "you" | "them";
  your_color: string;
  their_color: string;
  status: "active" | "won" | "lost" | "draw";
  moves: GameMove[];
}

export function useConnectFourGame(friendId: string, widgetId: string) {
  return useQuery({
    queryKey: ["connect_four", friendId, widgetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("friend_widgets")
        .select("config")
        .eq("friend_id", friendId)
        .eq("id", widgetId)
        .eq("widget_type", "connect_four")
        .single();

      if (error) throw error;

      const config = (data?.config as ConnectFourData) || {
        board: createEmptyBoard(),
        current_turn: "you",
        your_color: "⚫",
        their_color: "⚪",
        status: "active",
        moves: [],
      };

      return config;
    },
    staleTime: 1000 * 60 * 1, // 1 minute (shorter for real-time game)
  });
}

export function useMakeMove(friendId: string, widgetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (column: number) => {
      const { data: currentData } = await supabase
        .from("friend_widgets")
        .select("config")
        .eq("id", widgetId)
        .single();

      const currentConfig = (currentData?.config as ConnectFourData) || {
        board: createEmptyBoard(),
        current_turn: "you",
        your_color: "⚫",
        their_color: "⚪",
        status: "active",
        moves: [],
      };

      if (!validateMove(currentConfig.board, column)) {
        throw new Error("Invalid move");
      }

      const newBoard = makeMove(currentConfig.board, column, currentConfig.current_turn);
      if (!newBoard) {
        throw new Error("Failed to make move");
      }

      // Check for win
      const youWon = checkWin(newBoard, "you");
      const theyWon = checkWin(newBoard, "them");
      const isDraw = checkDraw(newBoard);

      let newStatus: "active" | "won" | "lost" | "draw" = "active";
      const nextTurn: "you" | "them" = currentConfig.current_turn === "you" ? "them" : "you";

      if (youWon) {
        newStatus = "won";
      } else if (theyWon) {
        newStatus = "lost";
      } else if (isDraw) {
        newStatus = "draw";
      }

      const newMove: GameMove = {
        player: currentConfig.current_turn,
        column,
        timestamp: new Date().toISOString(),
      };

      const updatedConfig: ConnectFourData = {
        ...currentConfig,
        board: newBoard,
        current_turn: newStatus === "active" ? nextTurn : currentConfig.current_turn,
        status: newStatus,
        moves: [...currentConfig.moves, newMove],
      };

      const { data, error } = await supabase
        .from("friend_widgets")
        .update({ config: updatedConfig })
        .eq("id", widgetId)
        .select()
        .single();

      if (error) throw error;
      return data.config as ConnectFourData;
    },
    onMutate: async (column) => {
      await queryClient.cancelQueries({
        queryKey: ["connect_four", friendId, widgetId],
      });

      const previousData = queryClient.getQueryData<ConnectFourData>([
        "connect_four",
        friendId,
        widgetId,
      ]);

      if (!previousData) return { previousData };

      const newBoard = makeMove(previousData.board, column, previousData.current_turn);
      if (!newBoard) return { previousData };

      const youWon = checkWin(newBoard, "you");
      const theyWon = checkWin(newBoard, "them");
      const isDraw = checkDraw(newBoard);

      let newStatus: "active" | "won" | "lost" | "draw" = "active";
      const nextTurn: "you" | "them" = previousData.current_turn === "you" ? "them" : "you";

      if (youWon) {
        newStatus = "won";
        playSound("game_win");
      } else if (theyWon) {
        newStatus = "lost";
        playSound("game_lose");
      } else if (isDraw) {
        newStatus = "draw";
        playSound("game_draw");
      }

      const newMove: GameMove = {
        player: previousData.current_turn,
        column,
        timestamp: new Date().toISOString(),
      };

      const optimisticData: ConnectFourData = {
        ...previousData,
        board: newBoard,
        current_turn: newStatus === "active" ? nextTurn : previousData.current_turn,
        status: newStatus,
        moves: [...previousData.moves, newMove],
      };

      queryClient.setQueryData<ConnectFourData>(
        ["connect_four", friendId, widgetId],
        optimisticData
      );

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData<ConnectFourData>(
          ["connect_four", friendId, widgetId],
          context.previousData
        );
      }
      playSound("error");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["connect_four", friendId, widgetId],
      });
    },
  });
}

export function useGameSubscription(friendId: string, widgetId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`game:${widgetId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "friend_widgets",
          filter: `id=eq.${widgetId}`,
        },
        (payload) => {
          const newConfig = payload.new.config as ConnectFourData;
          queryClient.setQueryData<ConnectFourData>(
            ["connect_four", friendId, widgetId],
            newConfig
          );
          playSound("opponent_move");
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [friendId, widgetId, queryClient]);
}

