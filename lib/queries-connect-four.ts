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
import { ADMIN_USER_ID } from "./constants";

function convertLegacyGame(game: Partial<ConnectFourData>, friendId: string): ConnectFourData {
  // If already in new format, return as-is
  if (game.player_one_id && game.player_two_id && game.current_turn_id) {
    return game as ConnectFourData;
  }

  // Convert from legacy format
  const playerOneId = ADMIN_USER_ID;
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
  const playerOneId = ADMIN_USER_ID;
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

export function useConnectFourGame(
  friendId: string,
  _widgetId: string,
  options?: { refetchInterval?: number }
) {
  return useQuery({
    queryKey: ["connect_four", friendId],
    queryFn: async () => {
      // Check if game exists in connect_four_games table (friend-based)
      const { data: gameData, error: gameError } = await supabase
        .from("connect_four_games")
        .select("config")
        .eq("friend_id", friendId)
        .single();

      if (gameError && gameError.code !== "PGRST116") {
        // PGRST116 = no rows returned, which is fine
        throw gameError;
      }

      if (gameData && gameData.config) {
        const rawConfig = (gameData.config as Partial<ConnectFourData>) || {};
        if (rawConfig.board || rawConfig.player_one_id) {
          // Convert legacy format if needed
          return convertLegacyGame(rawConfig, friendId);
        }
      }

      // No game exists, initialize new one
      const newGame = initializeGame(friendId);
      // Save initialized game to connect_four_games table
      await supabase
        .from("connect_four_games")
        .upsert({ friend_id: friendId, config: newGame }, { onConflict: "friend_id" });
      return newGame;
    },
    staleTime: 1000 * 60 * 1, // 1 minute (shorter for real-time game)
    refetchInterval: options?.refetchInterval,
  });
}

export function useMakeMove(friendId: string, _widgetId: string, currentUserId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (column: number) => {
      // Get game state from connect_four_games table (friend-based)
      const { data: currentData, error: fetchError } = await supabase
        .from("connect_four_games")
        .select("config")
        .eq("friend_id", friendId)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

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
      const playerPiece: "you" | "them" =
        currentUserId === currentConfig.player_one_id ? "you" : "them";

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
      const nextTurnId =
        currentConfig.current_turn_id === currentConfig.player_one_id
          ? currentConfig.player_two_id
          : currentConfig.player_one_id;
      let winnerId: string | undefined;

      if (currentPlayerWon) {
        newStatus = "won";
        winnerId = currentUserId;
      } else if (otherPlayerWon) {
        newStatus = "lost";
        winnerId =
          currentUserId === currentConfig.player_one_id
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

      // Update game state in connect_four_games table
      const { data, error } = await supabase
        .from("connect_four_games")
        .upsert({ friend_id: friendId, config: updatedConfig }, { onConflict: "friend_id" })
        .select()
        .single();

      if (error) throw error;

      // #region agent log
      fetch("http://127.0.0.1:7242/ingest/08ba6ecb-f05f-479b-b2cd-50cb668f1262", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: "lib/queries-connect-four.ts:224",
          message: "Connect4 move made",
          data: { friendId, widgetId: _widgetId, status: updatedConfig.status },
          timestamp: Date.now(),
          sessionId: "debug-session",
          runId: "run1",
          hypothesisId: "C",
        }),
      }).catch(() => {});
      // #endregion

      // Also update friend_widgets.last_updated_at for the Connect4 widget
      // Find the Connect4 widget for this friend
      const { data: connectFourWidgetType } = await supabase
        .from("widgets")
        .select("id")
        .eq("type", "connect_four")
        .single();

      if (connectFourWidgetType?.id) {
        const { data: widgetData, error: widgetError } = await supabase
          .from("friend_widgets")
          .select("id")
          .eq("friend_id", friendId)
          .eq("widget_id", connectFourWidgetType.id)
          .maybeSingle();

        // #region agent log
        fetch("http://127.0.0.1:7242/ingest/08ba6ecb-f05f-479b-b2cd-50cb668f1262", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "lib/queries-connect-four.ts:232",
            message: "Finding Connect4 widget",
            data: {
              friendId,
              connectFourWidgetTypeId: connectFourWidgetType.id,
              foundWidgetId: widgetData?.id || null,
              widgetError: widgetError?.message || null,
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "C",
          }),
        }).catch(() => {});
        // #endregion

        if (widgetData?.id) {
          const updateResult = await supabase
            .from("friend_widgets")
            .update({ last_updated_at: new Date().toISOString() })
            .eq("id", widgetData.id)
            .select();

          // #region agent log
          fetch("http://127.0.0.1:7242/ingest/08ba6ecb-f05f-479b-b2cd-50cb668f1262", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: "lib/queries-connect-four.ts:242",
              message: "Updated friend_widgets.last_updated_at",
              data: {
                widgetId: widgetData.id,
                updateSuccess: !!updateResult.data,
                updateError: updateResult.error?.message || null,
              },
              timestamp: Date.now(),
              sessionId: "debug-session",
              runId: "run1",
              hypothesisId: "C",
            }),
          }).catch(() => {});
          // #endregion
        }
      }

      return convertLegacyGame(data.config as Partial<ConnectFourData>, friendId);
    },
    onMutate: async (column) => {
      await queryClient.cancelQueries({
        queryKey: ["connect_four", friendId],
      });

      const previousData = queryClient.getQueryData<ConnectFourData>(["connect_four", friendId]);

      if (!previousData) return { previousData };

      // Determine which player piece to place
      const playerPiece: "you" | "them" =
        currentUserId === previousData.player_one_id ? "you" : "them";

      const newBoard = makeMove(previousData.board, column, playerPiece);
      if (!newBoard) return { previousData };

      const currentPlayerWon = checkWin(newBoard, playerPiece);
      const otherPlayerPiece: "you" | "them" = playerPiece === "you" ? "them" : "you";
      const otherPlayerWon = checkWin(newBoard, otherPlayerPiece);
      const isDraw = checkDraw(newBoard);

      let newStatus: "active" | "won" | "lost" | "draw" = "active";
      const nextTurnId =
        previousData.current_turn_id === previousData.player_one_id
          ? previousData.player_two_id
          : previousData.player_one_id;
      let winnerId: string | undefined;

      if (currentPlayerWon) {
        newStatus = "won";
        winnerId = currentUserId;
        playSound("game_win");
      } else if (otherPlayerWon) {
        newStatus = "lost";
        winnerId =
          currentUserId === previousData.player_one_id
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

      queryClient.setQueryData<ConnectFourData>(["connect_four", friendId], optimisticData);

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData<ConnectFourData>(["connect_four", friendId], context.previousData);
      }
      playSound("error");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["connect_four", friendId],
      });
    },
  });
}

export function useGameSubscription(
  friendId: string,
  _widgetId: string,
  options?: { enabled?: boolean }
) {
  const queryClient = useQueryClient();
  const enabled = options?.enabled !== false; // Default to true for backward compatibility

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel(`connect_four:${friendId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "connect_four_games",
          filter: `friend_id=eq.${friendId}`,
        },
        (payload) => {
          const rawConfig = payload.new.config as Partial<ConnectFourData>;
          const newConfig = convertLegacyGame(rawConfig, friendId);
          // Update query cache and invalidate to trigger re-render
          queryClient.setQueryData<ConnectFourData>(["connect_four", friendId], newConfig);
          // Also invalidate to ensure all components using this query re-render
          queryClient.invalidateQueries({
            queryKey: ["connect_four", friendId],
          });
          playSound("opponent_move");
        }
      )
      .subscribe((status) => {
        // Note: We don't need to handle subscription failures here because
        // polling via refetchInterval in useConnectFourGame will continue
        // to fetch updates regardless of subscription status. The subscription
        // is an optimization for real-time updates, but polling ensures
        // updates always work even if subscription fails.
        if (status === "SUBSCRIBED") {
          // Subscription active - real-time updates will be received
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          // Subscription failed or closed - polling will handle updates
          // No action needed as refetchInterval continues polling
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [friendId, queryClient, enabled]);
}

/**
 * Polling hook for fallback or widget updates
 * Uses React Query's refetchInterval for efficient polling
 * Note: Polling is actually handled by refetchInterval in useConnectFourGame,
 * so this hook is just a placeholder for future enhancements if needed.
 */
export function useGamePolling(_friendId: string, _widgetId: string, _intervalMs: number) {
  // This hook doesn't need to do anything - the polling is handled by refetchInterval
  // in useConnectFourGame. This is just a placeholder for consistency.
  return null;
}

export function useResetGame(friendId: string, _widgetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const newGame = initializeGame(friendId);

      // Update game state in connect_four_games table
      const { data, error } = await supabase
        .from("connect_four_games")
        .upsert({ friend_id: friendId, config: newGame }, { onConflict: "friend_id" })
        .select()
        .single();

      if (error) throw error;
      return convertLegacyGame(data.config as Partial<ConnectFourData>, friendId);
    },
    onSuccess: (newGame) => {
      queryClient.setQueryData<ConnectFourData>(["connect_four", friendId], newGame);
      playSound("retake");
    },
    onError: () => {
      playSound("error");
    },
  });
}
