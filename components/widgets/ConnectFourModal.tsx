"use client";

import { useState, useEffect, useCallback } from "react";
import { playSound } from "@/lib/sounds";
import { useUIStore } from "@/lib/store/ui-store";
import { ThemeColors } from "@/lib/types";
import { Modal } from "@/components/Modal";
import {
  createEmptyBoard,
  validateMove,
  calculateDropRow,
  Board,
  BOARD_COLS,
  BOARD_ROWS,
} from "@/lib/connect-four-logic";
import {
  useConnectFourGame,
  useMakeMove,
  useGameSubscription,
} from "@/lib/queries-connect-four";
import styles from "./ConnectFourModal.module.css";

interface GameMove {
  player: "you" | "them";
  column: number;
  timestamp: string;
}

interface ConnectFourData {
  board?: Board;
  current_turn?: "you" | "them";
  your_color?: string;
  their_color?: string;
  status?: "active" | "won" | "lost" | "draw";
  moves?: GameMove[];
}

interface ConnectFourModalProps {
  friendId: string;
  widgetId: string;
  themeColors: ThemeColors;
  config?: ConnectFourData;
}

export function ConnectFourModal({
  friendId,
  widgetId,
  themeColors,
  config,
}: ConnectFourModalProps) {
  const { openModal, setOpenModal } = useUIStore();
  const modalId = `connectfour-${widgetId}`;
  const isOpen = openModal === modalId;

  const { data: gameData } = useConnectFourGame(friendId, widgetId);
  const makeMoveMutation = useMakeMove(friendId, widgetId);
  useGameSubscription(friendId, widgetId);

  const board = gameData?.board || config?.board || createEmptyBoard();
  const currentTurn = gameData?.current_turn || config?.current_turn || "you";
  const yourColor = gameData?.your_color || config?.your_color || "⚫";
  const theirColor = gameData?.their_color || config?.their_color || "⚪";
  const status = gameData?.status || config?.status || "active";
  const moves = gameData?.moves || config?.moves || [];

  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);
  const [animatingColumn, setAnimatingColumn] = useState<number | null>(null);

  const handleColumnClick = useCallback(
    (column: number) => {
      if (status !== "active" || currentTurn !== "you") {
        playSound("error");
        return;
      }

      if (!validateMove(board, column)) {
        playSound("error");
        return;
      }

      // Optimistic update: animate piece drop
      setAnimatingColumn(column);
      playSound("game_drop");

      // Make move
      makeMoveMutation.mutate(column);
    },
    [board, currentTurn, status, makeMoveMutation]
  );

  // Keyboard navigation - removed column button navigation, keep Escape to close
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

  const handlePlayAgain = () => {
    // Reset game (would need a mutation)
    playSound("retake");
    // TODO: Implement reset game mutation
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "just now";
    if (diffMins === 1) return "1 minute ago";
    return `${diffMins} minutes ago`;
  };

  const lastMove = moves.length > 0 ? moves[moves.length - 1] : null;

  // Win/Loss/Draw screen
  if (status === "won" || status === "lost" || status === "draw") {
    return (
      <Modal id={modalId} title="CONNECT FOUR" onClose={() => setOpenModal(null)}>
        <div className={styles.gameModal}>
          <div className={styles.resultScreen}>
            {status === "won" && (
              <>
                <div className={styles.resultEmoji}>🎉</div>
                <h2 className={styles.resultTitle}>YOU WON!</h2>
                <p className={styles.resultMessage}>Congratulations!</p>
              </>
            )}
            {status === "lost" && (
              <>
                <div className={styles.resultEmoji}>😔</div>
                <h2 className={styles.resultTitle}>YOU LOST</h2>
                <p className={styles.resultMessage}>Better luck next time!</p>
              </>
            )}
            {status === "draw" && (
              <>
                <div className={styles.resultEmoji}>🤝</div>
                <h2 className={styles.resultTitle}>DRAW</h2>
                <p className={styles.resultMessage}>It&apos;s a tie!</p>
              </>
            )}
            <button
              className={styles.playAgainButton}
              onClick={handlePlayAgain}
              style={{ minHeight: "44px" }}
            >
              PLAY AGAIN
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  // Game board
  return (
    <Modal id={modalId} title="CONNECT FOUR" onClose={() => setOpenModal(null)}>
      <div className={styles.gameModal}>
        <div className={styles.gameHeader}>
          <div className={styles.playerInfo}>
            YOU ({yourColor}) vs THEM ({theirColor})
          </div>
        </div>

        <div className={styles.boardContainer}>
          {/* Game board with hover interactions */}
          <div className={styles.board}>
            {Array.from({ length: BOARD_ROWS }).map((_, row) => (
              <div key={row} className={styles.boardRow}>
                {Array.from({ length: BOARD_COLS }).map((_, col) => {
                  const cell = board[row][col];
                  const isAnimating =
                    animatingColumn === col && row === calculateDropRow(board, col);
                  const isHoveredColumn = hoveredColumn === col;
                  const isHoveredCell =
                    isHoveredColumn &&
                    status === "active" &&
                    currentTurn === "you" &&
                    cell === null &&
                    row === calculateDropRow(board, col);
                  const isEmpty = cell === null;

                  return (
                    <div
                      key={col}
                      className={`${styles.cell} ${isAnimating ? styles.animating : ""} ${isHoveredCell ? styles.ghost : ""} ${isHoveredColumn && isEmpty ? styles.hoveredColumn : ""}`}
                      onClick={() => handleColumnClick(col)}
                      onMouseEnter={() => {
                        if (status === "active" && currentTurn === "you") {
                          setHoveredColumn(col);
                          playSound("game_hover");
                        }
                      }}
                      onMouseLeave={() => setHoveredColumn(null)}
                      style={{ cursor: status === "active" && currentTurn === "you" ? "pointer" : "default" }}
                    >
                      {cell === "you" ? (
                        <div className={styles.piece} style={{ backgroundColor: themeColors.primary }} />
                      ) : cell === "them" ? (
                        <div className={styles.piece} style={{ backgroundColor: themeColors.secondary }} />
                      ) : isHoveredCell ? (
                        <div className={styles.ghostPiece} style={{ backgroundColor: themeColors.primary }} />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.gameStatus}>
          {status === "active" && currentTurn === "you" && (
            <div className={styles.turnIndicator}>
              YOUR TURN
            </div>
          )}
          {status === "active" && currentTurn === "them" && (
            <div className={styles.turnIndicator}>
              Waiting for them...
            </div>
          )}
          {lastMove && (
            <div className={styles.moveHistory}>
              Last move: {lastMove.player === "you" ? "You" : "They"} played column{" "}
              {lastMove.column + 1} ({formatTimeAgo(lastMove.timestamp)})
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

