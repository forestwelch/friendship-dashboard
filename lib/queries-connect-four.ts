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

export interface GameMove {
  player_id: string; // "admin" or friend.id
  column: number;
  timestamp: string;
}

export interface ConnectFourData {
  board: Board;
  player_one_id: string; // "admin" or friend.id
  player_two_id: string; // friend.id or "admin"
  current_turn_id: string; // Which player's turn
  player_one_color: string;
  player_two_color: string;
  status: "active" | "won" | "lost" | "draw";
  winner_id?: string; // Who won (if status is "won")
  moves: GameMove[];
  // Legacy fields for backward compatibility (will be converted on access)
  current_turn?: "you" | "them";
  your_color?: string;
  their_color?: string;
}

/**
 * Convert legacy format to new format
 */
function convertLegacyGame(game: Partial<ConnectFourData>, friendId: string): ConnectFourData {
  // If already in new format, return as-is
  if (game.player_one_id && game.player_two_id && game.current_turn_id) {
    return game as ConnectFourData;
  }

  // Convert from legacy format
  const playerOneId = "admin";
  const playerTwoId = friendId;
  
  // Map "you" -> admin, "them" -> friend
  const currentTurnId = game.current_turn === "you" ? playerOneId : playerTwoId;
  
  return {
    board: game.board || createEmptyBoard(),
    player_one_id: playerOneId,
    player_two_id: playerTwoId,
    current_turn_id: currentTurnId,
    player_one_color: game.your_color || game.player_one_color || "⚫",
    player_two_color: game.their_color || game.player_two_color || "⚪",
    status: game.status || "active",
    winner_id: game.winner_id,
    moves: (game.moves || []).map((move) => {
      // Convert legacy moves
      if ("player" in move) {
        return {
          player_id: move.player === "you" ? playerOneId : playerTwoId,
          column: move.column,
          timestamp: move.timestamp,
        };
      }
      return move as GameMove;
    }),
  };
}

/**
 * Initialize a new Connect Four game with coin flip for starting player
 */
function initializeGame(friendId: string): ConnectFourData {
  const playerOneId = "admin";
  const playerTwoId = friendId;
  
  // Coin flip: 50/50 chance
  const coinFlip = Math.random() < 0.5;
  const currentTurnId = coinFlip ? playerOneId : playerTwoId;
  
  return {
    board: createEmptyBoard(),
    player_one_id: playerOneId,
    player_two_id: playerTwoId,
    current_turn_id: currentTurnId,
    player_one_color: "⚫",
    player_two_color: "⚪",
    status: "active",
    moves: [],
  };
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
        .single();

      if (error) throw error;

      const rawConfig = (data?.config as Partial<ConnectFourData>) || {};
      
      // If no game exists, initialize new one
      if (!rawConfig.board && !rawConfig.player_one_id) {
        const newGame = initializeGame(friendId);
        // Save initialized game to database
        await supabase
          .from("friend_widgets")
          .update({ config: newGame })
          .eq("id", widgetId);
        return newGame;
      }

      // Convert legacy format if needed
      return convertLegacyGame(rawConfig, friendId);
    },
    staleTime: 1000 * 60 * 1, // 1 minute (shorter for real-time game)
  });
}

export function useMakeMove(friendId: string, widgetId: string, currentUserId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (column: number) => {
      const { data: currentData } = await supabase
        .from("friend_widgets")
        .select("config")
        .eq("id", widgetId)
        .single();

      const rawConfig = (currentData?.config as Partial<ConnectFourData>) || {};
      const currentConfig = convertLegacyGame(rawConfig, friendId);

      // Check if it's the current user's turn
      if (currentConfig.current_turn_id !== currentUserId) {
        throw new Error("Not your turn");
      }

      if (!validateMove(currentConfig.board, column)) {
        throw new Error("Invalid move");
      }

      // Determine which player piece to place
      const playerPiece: "you" | "them" = currentUserId === currentConfig.player_one_id ? "you" : "them";
      
      const newBoard = makeMove(currentConfig.board, column, playerPiece);
      if (!newBoard) {
        throw new Error("Failed to make move");
      }

      // Check for win
      const currentPlayerWon = checkWin(newBoard, playerPiece);
      const otherPlayerPiece: "you" | "them" = playerPiece === "you" ? "them" : "you";
      const otherPlayerWon = checkWin(newBoard, otherPlayerPiece);
      const isDraw = checkDraw(newBoard);

      let newStatus: "active" | "won" | "lost" | "draw" = "active";
      const nextTurnId = currentConfig.current_turn_id === currentConfig.player_one_id 
        ? currentConfig.player_two_id 
        : currentConfig.player_one_id;
      let winnerId: string | undefined;

      if (currentPlayerWon) {
        newStatus = "won";
        winnerId = currentUserId;
      } else if (otherPlayerWon) {
        newStatus = "lost";
        winnerId = currentUserId === currentConfig.player_one_id 
          ? currentConfig.player_two_id 
          : currentConfig.player_one_id;
      } else if (isDraw) {
        newStatus = "draw";
      }

      const newMove: GameMove = {
        player_id: currentUserId,
        column,
        timestamp: new Date().toISOString(),
      };

      const updatedConfig: ConnectFourData = {
        ...currentConfig,
        board: newBoard,
        current_turn_id: newStatus === "active" ? nextTurnId : currentConfig.current_turn_id,
        status: newStatus,
        winner_id: winnerId,
        moves: [...currentConfig.moves, newMove],
      };

      const { data, error } = await supabase
        .from("friend_widgets")
        .update({ config: updatedConfig })
        .eq("id", widgetId)
        .select()
        .single();

      if (error) throw error;
      return convertLegacyGame(data.config as Partial<ConnectFourData>, friendId);
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

      // Determine which player piece to place
      const playerPiece: "you" | "them" = currentUserId === previousData.player_one_id ? "you" : "them";
      
      const newBoard = makeMove(previousData.board, column, playerPiece);
      if (!newBoard) return { previousData };

      const currentPlayerWon = checkWin(newBoard, playerPiece);
      const otherPlayerPiece: "you" | "them" = playerPiece === "you" ? "them" : "you";
      const otherPlayerWon = checkWin(newBoard, otherPlayerPiece);
      const isDraw = checkDraw(newBoard);

      let newStatus: "active" | "won" | "lost" | "draw" = "active";
      const nextTurnId = previousData.current_turn_id === previousData.player_one_id 
        ? previousData.player_two_id 
        : previousData.player_one_id;
      let winnerId: string | undefined;

      if (currentPlayerWon) {
        newStatus = "won";
        winnerId = currentUserId;
        playSound("game_win");
      } else if (otherPlayerWon) {
        newStatus = "lost";
        winnerId = currentUserId === previousData.player_one_id 
          ? previousData.player_two_id 
          : previousData.player_one_id;
        playSound("game_lose");
      } else if (isDraw) {
        newStatus = "draw";
        playSound("game_draw");
      }

      const newMove: GameMove = {
        player_id: currentUserId,
        column,
        timestamp: new Date().toISOString(),
      };

      const optimisticData: ConnectFourData = {
        ...previousData,
        board: newBoard,
        current_turn_id: newStatus === "active" ? nextTurnId : previousData.current_turn_id,
        status: newStatus,
        winner_id: winnerId,
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
          const rawConfig = payload.new.config as Partial<ConnectFourData>;
          const newConfig = convertLegacyGame(rawConfig, friendId);
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

export function useResetGame(friendId: string, widgetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const newGame = initializeGame(friendId);
      
      const { data, error } = await supabase
        .from("friend_widgets")
        .update({ config: newGame })
        .eq("id", widgetId)
        .select()
        .single();

      if (error) throw error;
      return convertLegacyGame(data.config as Partial<ConnectFourData>, friendId);
    },
    onSuccess: (newGame) => {
      queryClient.setQueryData<ConnectFourData>(
        ["connect_four", friendId, widgetId],
        newGame
      );
      playSound("retake");
    },
    onError: () => {
      playSound("error");
    },
  });
}

