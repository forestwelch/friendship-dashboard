"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { playSound } from "@/lib/sounds";
import { createEmptyBoard, makeMove, checkWin, validateMove, Board } from "./logic";
import { ADMIN_USER_ID } from "@/lib/constants";

export interface TicTacToeData {
  player1_id: string; // Friend ID
  player2_id: string; // Admin ID ("admin")
  player1_icon: string | null; // Icon class name (e.g., "hn-crown-solid")
  player2_icon: string | null;
  player1_moves: number[]; // Cell indices 0-8 in chronological order
  player2_moves: number[];
  current_turn_id: string; // player1_id or player2_id
  winner_id: string | null;
  status: "awaiting_p2_icon" | "active" | "completed";
  board: Board; // Array of 9 cells: null or player_id
}

/**
 * Initialize a new Tic Tac Toe game
 * First game: random turn order
 * Subsequent games: loser goes first (if previousWinner provided)
 * Icons are preserved from previous game if provided
 */
function initializeGame(
  friendId: string,
  previousWinner: string | null = null,
  previousIcons: { player1_icon: string | null; player2_icon: string | null } = {
    player1_icon: null,
    player2_icon: null,
  }
): TicTacToeData {
  const player1Id = friendId;
  const player2Id = ADMIN_USER_ID;

  // Determine turn order
  let currentTurnId: string;
  if (previousWinner) {
    // Loser goes first
    currentTurnId = previousWinner === player1Id ? player2Id : player1Id;
  } else {
    // First game: random
    const coinFlip = Math.random() < 0.5;
    currentTurnId = coinFlip ? player1Id : player2Id;
  }

  // Preserve icons from previous game, or null if first game
  const player1Icon = previousIcons.player1_icon;
  const player2Icon = previousIcons.player2_icon;

  // Determine initial status
  // If both players have icons, game is active
  // If either player lacks icon, wait for icon selection
  const hasAllIcons = player1Icon !== null && player2Icon !== null;

  return {
    player1_id: player1Id,
    player2_id: player2Id,
    player1_icon: player1Icon,
    player2_icon: player2Icon,
    player1_moves: [],
    player2_moves: [],
    current_turn_id: currentTurnId,
    winner_id: null,
    status: hasAllIcons ? "active" : "awaiting_p2_icon",
    board: createEmptyBoard(),
  };
}

export function useTicTacToeGame(
  friendId: string,
  _widgetId: string,
  options?: { refetchInterval?: number }
) {
  return useQuery({
    queryKey: ["tic_tac_toe", friendId],
    queryFn: async () => {
      // Check if game exists in tic_tac_toe_games table (friend-based)
      const { data: gameData, error: gameError } = await supabase
        .from("tic_tac_toe_games")
        .select("config")
        .eq("friend_id", friendId)
        .single();

      if (gameError && gameError.code !== "PGRST116") {
        // PGRST116 = no rows returned, which is fine
        throw gameError;
      }

      if (gameData && gameData.config) {
        const rawConfig = gameData.config as Partial<TicTacToeData>;
        if (rawConfig.board || rawConfig.player1_id) {
          // Ensure board is array of 9 cells
          if (!rawConfig.board || !Array.isArray(rawConfig.board)) {
            rawConfig.board = createEmptyBoard();
          }
          return rawConfig as TicTacToeData;
        }
      }

      // No game exists - return null to show PLAY button
      return null;
    },
    staleTime: 1000 * 60 * 1, // 1 minute (shorter for real-time game)
    refetchInterval: options?.refetchInterval,
  });
}

export function useMakeMove(friendId: string, _widgetId: string, currentUserId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cellIndex: number) => {
      // Get game state from tic_tac_toe_games table (friend-based)
      const { data: currentData, error: fetchError } = await supabase
        .from("tic_tac_toe_games")
        .select("config")
        .eq("friend_id", friendId)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      const currentConfig =
        (currentData?.config as Partial<TicTacToeData>) ||
        ({
          board: createEmptyBoard(),
          player1_id: friendId,
          player2_id: ADMIN_USER_ID,
          player1_icon: null,
          player2_icon: null,
          player1_moves: [],
          player2_moves: [],
          current_turn_id: friendId,
          winner_id: null,
          status: "active",
        } as TicTacToeData);

      // Ensure board is valid
      if (!currentConfig.board || !Array.isArray(currentConfig.board)) {
        currentConfig.board = createEmptyBoard();
      }

      // Check if it's the current user's turn
      if (currentConfig.current_turn_id !== currentUserId) {
        throw new Error("Not your turn");
      }

      if (!validateMove(currentConfig.board, cellIndex)) {
        throw new Error("Invalid move");
      }

      // Determine which player's moves array to use
      const isPlayer1 = currentUserId === currentConfig.player1_id;
      const playerMoves = isPlayer1
        ? currentConfig.player1_moves || []
        : currentConfig.player2_moves || [];

      // Make the move (handles oldest piece removal if needed)
      const { board: newBoard, moves: newMoves } = makeMove(
        currentConfig.board,
        cellIndex,
        currentUserId,
        playerMoves
      );

      // Update the appropriate moves array
      const updatedConfig: Partial<TicTacToeData> = {
        ...currentConfig,
        board: newBoard,
      };
      if (isPlayer1) {
        updatedConfig.player1_moves = newMoves;
      } else {
        updatedConfig.player2_moves = newMoves;
      }

      // Check for win
      const currentPlayerWon = checkWin(newBoard, currentUserId);
      const otherPlayerId = isPlayer1
        ? currentConfig.player2_id || ADMIN_USER_ID
        : currentConfig.player1_id || friendId;
      const otherPlayerWon = checkWin(newBoard, otherPlayerId);

      let newStatus: "awaiting_p2_icon" | "active" | "completed" = "active";
      const nextTurnId =
        currentConfig.current_turn_id === currentConfig.player1_id
          ? currentConfig.player2_id
          : currentConfig.player1_id;
      let winnerId: string | null = null;

      if (currentPlayerWon) {
        newStatus = "completed";
        winnerId = currentUserId;
      } else if (otherPlayerWon) {
        newStatus = "completed";
        winnerId = otherPlayerId;
      }

      const finalConfig: TicTacToeData = {
        ...updatedConfig,
        current_turn_id: newStatus === "active" ? nextTurnId : currentConfig.current_turn_id,
        status: newStatus,
        winner_id: winnerId,
      } as TicTacToeData;

      // Update game state in tic_tac_toe_games table
      const { data, error } = await supabase
        .from("tic_tac_toe_games")
        .upsert({ friend_id: friendId, config: finalConfig }, { onConflict: "friend_id" })
        .select()
        .single();

      if (error) throw error;

      return data.config as TicTacToeData;
    },
    onMutate: async (cellIndex: number) => {
      await queryClient.cancelQueries({
        queryKey: ["tic_tac_toe", friendId],
      });

      const previousData = queryClient.getQueryData<TicTacToeData>(["tic_tac_toe", friendId]);

      if (!previousData) return { previousData };

      // Ensure board is valid
      if (!previousData.board || !Array.isArray(previousData.board)) {
        return { previousData };
      }

      // Check if it's the current user's turn
      if (previousData.current_turn_id !== currentUserId) {
        return { previousData };
      }

      if (!validateMove(previousData.board, cellIndex)) {
        return { previousData };
      }

      // Determine which player's moves array to use
      const isPlayer1 = currentUserId === previousData.player1_id;
      const playerMoves = isPlayer1
        ? previousData.player1_moves || []
        : previousData.player2_moves || [];

      // Make the move
      const { board: newBoard, moves: newMoves } = makeMove(
        previousData.board,
        cellIndex,
        currentUserId,
        playerMoves
      );

      // Update the appropriate moves array
      const updatedData: Partial<TicTacToeData> = {
        ...previousData,
        board: newBoard,
      };
      if (isPlayer1) {
        updatedData.player1_moves = newMoves;
      } else {
        updatedData.player2_moves = newMoves;
      }

      // Check for win
      const currentPlayerWon = checkWin(newBoard, currentUserId);
      const otherPlayerId = isPlayer1
        ? previousData.player2_id || ADMIN_USER_ID
        : previousData.player1_id || friendId;
      const otherPlayerWon = checkWin(newBoard, otherPlayerId);

      let newStatus: "awaiting_p2_icon" | "active" | "completed" = "active";
      const nextTurnId =
        previousData.current_turn_id === previousData.player1_id
          ? previousData.player2_id
          : previousData.player1_id;
      let winnerId: string | null = null;

      if (currentPlayerWon) {
        newStatus = "completed";
        winnerId = currentUserId;
        playSound("game_win");
      } else if (otherPlayerWon) {
        newStatus = "completed";
        winnerId = otherPlayerId;
        playSound("game_lose");
      } else {
        playSound("click");
      }

      const optimisticData: TicTacToeData = {
        ...updatedData,
        current_turn_id: newStatus === "active" ? nextTurnId : previousData.current_turn_id,
        status: newStatus,
        winner_id: winnerId,
      } as TicTacToeData;

      queryClient.setQueryData<TicTacToeData>(["tic_tac_toe", friendId], optimisticData);

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData<TicTacToeData>(["tic_tac_toe", friendId], context.previousData);
      }
      playSound("error");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tic_tac_toe", friendId],
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
  const enabled = options?.enabled !== false;

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel(`tic_tac_toe:${friendId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tic_tac_toe_games",
          filter: `friend_id=eq.${friendId}`,
        },
        (payload) => {
          const newConfig = payload.new.config as TicTacToeData;
          // Ensure board is valid
          if (!newConfig.board || !Array.isArray(newConfig.board)) {
            newConfig.board = createEmptyBoard();
          }
          queryClient.setQueryData<TicTacToeData>(["tic_tac_toe", friendId], newConfig);
          queryClient.invalidateQueries({
            queryKey: ["tic_tac_toe", friendId],
          });
          playSound("opponent_move");
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [friendId, queryClient, enabled]);
}

export function useResetGame(friendId: string, _widgetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Get previous game to preserve icons and determine turn order (loser goes first)
      const { data: previousData } = await supabase
        .from("tic_tac_toe_games")
        .select("config")
        .eq("friend_id", friendId)
        .single();

      const previousConfig = previousData?.config as TicTacToeData | null;
      const previousWinner = previousConfig?.winner_id || null;
      const previousIcons = {
        player1_icon: previousConfig?.player1_icon || null,
        player2_icon: previousConfig?.player2_icon || null,
      };

      const newGame = initializeGame(friendId, previousWinner, previousIcons);

      // Update game state in tic_tac_toe_games table
      const { data, error } = await supabase
        .from("tic_tac_toe_games")
        .upsert({ friend_id: friendId, config: newGame }, { onConflict: "friend_id" })
        .select()
        .single();

      if (error) throw error;
      return data.config as TicTacToeData;
    },
    onSuccess: (newGame) => {
      queryClient.setQueryData<TicTacToeData>(["tic_tac_toe", friendId], newGame);
      playSound("retake");
    },
    onError: () => {
      playSound("error");
    },
  });
}

export function useCreateGame(friendId: string, _widgetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Get previous game to preserve icons if they exist
      const { data: previousData } = await supabase
        .from("tic_tac_toe_games")
        .select("config")
        .eq("friend_id", friendId)
        .single();

      const previousConfig = previousData?.config as TicTacToeData | null;
      const previousIcons = {
        player1_icon: previousConfig?.player1_icon || null,
        player2_icon: previousConfig?.player2_icon || null,
      };

      // Create new game with preserved icons (random first player for first game)
      const newGame = initializeGame(friendId, null, previousIcons);

      // Update game state in tic_tac_toe_games table
      const { data, error } = await supabase
        .from("tic_tac_toe_games")
        .upsert({ friend_id: friendId, config: newGame }, { onConflict: "friend_id" })
        .select()
        .single();

      if (error) throw error;
      return data.config as TicTacToeData;
    },
    onSuccess: (newGame) => {
      queryClient.setQueryData<TicTacToeData>(["tic_tac_toe", friendId], newGame);
      playSound("open");
    },
    onError: () => {
      playSound("error");
    },
  });
}

export function useUpdateIcon(friendId: string, _widgetId: string, currentUserId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (icon: string) => {
      // Get current game state
      const { data: currentData, error: fetchError } = await supabase
        .from("tic_tac_toe_games")
        .select("config")
        .eq("friend_id", friendId)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      const currentConfig =
        (currentData?.config as Partial<TicTacToeData>) ||
        ({
          player1_id: friendId,
          player2_id: ADMIN_USER_ID,
          player1_icon: null,
          player2_icon: null,
          player1_moves: [],
          player2_moves: [],
          current_turn_id: friendId,
          winner_id: null,
          status: "awaiting_p2_icon",
          board: createEmptyBoard(),
        } as TicTacToeData);

      // Determine which player's icon to update
      const isPlayer1 = currentUserId === currentConfig.player1_id;
      const updatedConfig: Partial<TicTacToeData> = {
        ...currentConfig,
      };

      if (isPlayer1) {
        updatedConfig.player1_icon = icon;
      } else {
        updatedConfig.player2_icon = icon;
      }

      // Update board to reflect new icon (if game is active)
      if (currentConfig.board && Array.isArray(currentConfig.board)) {
        // Icons are stored per player, not per cell, so board doesn't need updating
        // But we need to ensure status transitions correctly
        if (updatedConfig.status === "awaiting_p2_icon") {
          // Check if both players have icons now
          const hasPlayer1Icon = updatedConfig.player1_icon !== null;
          const hasPlayer2Icon = updatedConfig.player2_icon !== null;
          if (hasPlayer1Icon && hasPlayer2Icon) {
            updatedConfig.status = "active";
          }
        }
      }

      const finalConfig = updatedConfig as TicTacToeData;

      // Update game state
      const { data, error } = await supabase
        .from("tic_tac_toe_games")
        .upsert({ friend_id: friendId, config: finalConfig }, { onConflict: "friend_id" })
        .select()
        .single();

      if (error) throw error;
      return data.config as TicTacToeData;
    },
    onMutate: async (icon: string) => {
      await queryClient.cancelQueries({
        queryKey: ["tic_tac_toe", friendId],
      });

      const previousData = queryClient.getQueryData<TicTacToeData>(["tic_tac_toe", friendId]);

      if (!previousData) return { previousData };

      const isPlayer1 = currentUserId === previousData.player1_id;
      const updatedData: TicTacToeData = {
        ...previousData,
      };

      if (isPlayer1) {
        updatedData.player1_icon = icon;
      } else {
        updatedData.player2_icon = icon;
      }

      // Check if both players have icons now
      if (
        updatedData.status === "awaiting_p2_icon" &&
        updatedData.player1_icon &&
        updatedData.player2_icon
      ) {
        updatedData.status = "active";
      }

      queryClient.setQueryData<TicTacToeData>(["tic_tac_toe", friendId], updatedData);
      playSound("select");

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData<TicTacToeData>(["tic_tac_toe", friendId], context.previousData);
      }
      playSound("error");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tic_tac_toe", friendId],
      });
    },
  });
}
