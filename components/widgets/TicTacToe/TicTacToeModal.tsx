"use client";

import { useEffect, useCallback, useMemo, useState } from "react";
import { playSound } from "@/lib/sounds";
import { useUIStore } from "@/lib/store/ui-store";
import { ThemeColors } from "@/lib/types";
import { Modal } from "@/components/shared";
import { createEmptyBoard, getWinningCells } from "./logic";
import {
  useTicTacToeGame,
  useMakeMove,
  useGameSubscription,
  useResetGame,
  useCreateGame,
  useUpdateIcon,
  TicTacToeData,
} from "./queries";
import { useUserContext, getUserIdForFriend, getUserDisplayName } from "@/lib/hooks/useUserContext";
import { ADMIN_USER_ID } from "@/lib/constants";
import { getUserColor } from "@/lib/utils/color-utils";
import { IconPicker } from "./IconPicker";
import styles from "./TicTacToe.module.css";

interface TicTacToeModalProps {
  friendId: string;
  friendName: string;
  widgetId: string;
  themeColors: ThemeColors;
  config?: TicTacToeData;
}

export function TicTacToeModal({
  friendId,
  friendName,
  widgetId,
  themeColors,
  config,
}: TicTacToeModalProps) {
  const { openModal, setOpenModal } = useUIStore();
  const modalId = `tictactoe-${widgetId}`;
  const isOpen = openModal === modalId;

  const userContext = useUserContext();
  const currentUserId = getUserIdForFriend(userContext, friendId);

  const { data: gameData } = useTicTacToeGame(friendId, widgetId, {
    refetchInterval: isOpen ? 3000 : undefined,
  });
  const makeMoveMutation = useMakeMove(friendId, widgetId, currentUserId);
  const resetGameMutation = useResetGame(friendId, widgetId);
  const createGameMutation = useCreateGame(friendId, widgetId);
  const updateIconMutation = useUpdateIcon(friendId, widgetId, currentUserId);

  const [showIconSelector, setShowIconSelector] = useState(false);

  useGameSubscription(friendId, widgetId, { enabled: isOpen });

  const game = gameData || config;
  const board = useMemo(() => game?.board || createEmptyBoard(), [game?.board]);
  const status = game?.status || "active";

  const player1Id = game?.player1_id || friendId;
  const player2Id = game?.player2_id || ADMIN_USER_ID;
  const currentTurnId = game?.current_turn_id || player1Id;
  const isMyTurn = currentTurnId === currentUserId;

  const myIcon = currentUserId === player1Id ? game?.player1_icon : game?.player2_icon;
  const needsIconSelection = myIcon === null;

  const theirDisplayName = useMemo(() => {
    const otherPlayerId = currentUserId === player1Id ? player2Id : player1Id;
    return getUserDisplayName(otherPlayerId, friendName);
  }, [currentUserId, player1Id, player2Id, friendName]);

  const myColor = getUserColor(currentUserId, friendId, themeColors);

  // Determine if there's no game at all (null from DB)
  const hasNoActiveGame = !game;

  const handlePlayClick = useCallback(() => {
    createGameMutation.mutate(undefined, {
      onError: (error) => {
        console.error("[TicTacToe] Failed to create game:", error);
      },
    });
    playSound("click");
  }, [createGameMutation]);

  const handleIconConfirm = useCallback(
    (icon: string) => {
      updateIconMutation.mutate(icon);
      setShowIconSelector(false);
    },
    [updateIconMutation]
  );

  const handleSettingsClick = useCallback(() => {
    setShowIconSelector(true);
    playSound("click");
  }, []);

  const handleCellClick = useCallback(
    (index: number) => {
      if (status !== "active" || !isMyTurn) {
        playSound("error");
        return;
      }

      if (board[index] !== null) {
        playSound("error");
        return;
      }

      playSound("click");
      makeMoveMutation.mutate(index);
    },
    [board, isMyTurn, status, makeMoveMutation]
  );

  const handlePlayAgain = useCallback(() => {
    resetGameMutation.mutate();
    playSound("open");
  }, [resetGameMutation]);

  const getStatusText = useCallback(() => {
    if (status === "completed") {
      const winnerId = game?.winner_id;
      if (winnerId === currentUserId) {
        return "YOU WIN!";
      } else if (winnerId) {
        return "YOU LOST";
      }
      return "TIE GAME";
    }
    if (isMyTurn) {
      return "YOUR TURN";
    }
    return `${theirDisplayName.toUpperCase()}'S TURN`;
  }, [status, game?.winner_id, currentUserId, isMyTurn, theirDisplayName]);

  const winningCells = useMemo(() => {
    if (status !== "completed" || !game?.winner_id) return [];
    return getWinningCells(board, game.winner_id);
  }, [status, game, board]);

  const isWinningCell = useCallback(
    (index: number) => {
      return winningCells.includes(index);
    },
    [winningCells]
  );

  const player1Moves = game?.player1_moves || [];
  const player2Moves = game?.player2_moves || [];
  const oldestPlayer1Move = player1Moves.length > 0 ? player1Moves[0] : null;
  const oldestPlayer2Move = player2Moves.length > 0 ? player2Moves[0] : null;

  const renderBoard = () => {
    return (
      <div className={styles.modalBoard}>
        {Array.from({ length: 9 }).map((_, index) => {
          const cellValue = board[index];
          // Only mark as oldest if player has 3 pieces (meaning 4th will remove it)
          const isOldest =
            (cellValue === player1Id && index === oldestPlayer1Move) ||
            (cellValue === player2Id && index === oldestPlayer2Move);
          // Only show oldest styling if player has 3+ pieces
          const showOldestStyling =
            isOldest &&
            ((cellValue === player1Id && player1Moves.length >= 3) ||
              (cellValue === player2Id && player2Moves.length >= 3));
          const isWinning = isWinningCell(index);
          const isClickable = status === "active" && isMyTurn && cellValue === null;

          let iconColor: string | null = null;
          let iconClass: string | null = null;

          if (cellValue === player1Id && game?.player1_icon) {
            iconColor = getUserColor(player1Id, friendId, themeColors);
            iconClass = game.player1_icon;
          } else if (cellValue === player2Id && game?.player2_icon) {
            iconColor = getUserColor(player2Id, friendId, themeColors);
            iconClass = game.player2_icon;
          }

          return (
            <div
              key={index}
              className={`${styles.modalCell} ${cellValue ? styles.hasPiece : ""} ${isWinning ? styles.winningCell : ""} ${isClickable ? styles.clickable : ""}`}
              onClick={() => handleCellClick(index)}
            >
              {iconClass && iconColor ? (
                <i
                  className={`hn ${iconClass} ${styles.modalIcon} ${showOldestStyling ? styles.oldestIcon : ""}`}
                  style={
                    {
                      "--icon-color": iconColor,
                    } as React.CSSProperties
                  }
                />
              ) : null}
            </div>
          );
        })}
      </div>
    );
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenModal(null);
        playSound("close");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setOpenModal]);

  // Determine status text
  const statusText = useMemo(() => {
    if (status === "active" && !isMyTurn) {
      return `Waiting for ${theirDisplayName}...`;
    }
    return getStatusText();
  }, [status, isMyTurn, theirDisplayName, getStatusText]);

  const handleClose = () => setOpenModal(null);

  if (!isOpen) return null;

  // Show icon picker if needed
  if (needsIconSelection || showIconSelector) {
    const opponentIcon = currentUserId === player1Id ? game?.player2_icon : game?.player1_icon;
    return (
      <Modal id={modalId} title="TIC-TAC-TOE" onClose={handleClose}>
        <div className={styles.modalContent}>
          <IconPicker
            onConfirm={handleIconConfirm}
            onCancel={showIconSelector ? () => setShowIconSelector(false) : undefined}
            userColor={myColor}
            themeColors={themeColors}
            showCancel={showIconSelector}
            opponentIcon={opponentIcon || null}
          />
        </div>
      </Modal>
    );
  }

  // Show PLAY button if no game exists
  if (hasNoActiveGame) {
    return (
      <Modal id={modalId} title="TIC-TAC-TOE" onClose={handleClose}>
        <div className={styles.modalContent}>
          <div className={styles.preGame}>
            <button className={styles.playButton} onClick={handlePlayClick} type="button">
              PLAY
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  // All game states: status bar + board + optional footer
  return (
    <Modal id={modalId} title="TIC-TAC-TOE" onClose={handleClose}>
      <div className={styles.modalContent}>
        <div className={styles.gameStatus}>
          <div className={styles.statusText}>{statusText}</div>
          <button className={styles.settingsButton} onClick={handleSettingsClick} type="button">
            <i className="hn hn-cog-solid" />
          </button>
        </div>
        <div className={styles.boardContainer}>{renderBoard()}</div>
        {status === "completed" && (
          <div className={styles.gameFooter}>
            <button className={styles.playAgainButton} onClick={handlePlayAgain} type="button">
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
