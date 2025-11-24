"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { playSound } from "@/lib/sounds";
import { useUIStore } from "@/lib/store/ui-store";
import { ThemeColors } from "@/lib/types";
import { Modal } from "@/components/Modal";
import {
  createEmptyBoard,
  validateMove,
  calculateDropRow,
  BOARD_COLS,
  BOARD_ROWS,
} from "@/lib/connect-four-logic";
import {
  useConnectFourGame,
  useMakeMove,
  useGameSubscription,
  useResetGame,
  ConnectFourData,
} from "@/lib/queries-connect-four";
import { useUserContext, getUserIdForFriend, getUserDisplayName } from "@/lib/use-user-context";
import { ADMIN_USER_ID } from "@/lib/constants";
import styles from "./ConnectFourModal.module.css";

interface ConnectFourModalProps {
  friendId: string;
  friendName: string;
  widgetId: string;
  themeColors: ThemeColors;
  config?: ConnectFourData;
}

export function ConnectFourModal({
  friendId,
  friendName,
  widgetId,
  themeColors,
  config,
}: ConnectFourModalProps) {
  const { openModal, setOpenModal } = useUIStore();
  const modalId = `connectfour-${widgetId}`;
  const isOpen = openModal === modalId;
  const userContext = useUserContext();
  const currentUserId = getUserIdForFriend(userContext, friendId);

  const { data: gameData } = useConnectFourGame(friendId, widgetId);
  const makeMoveMutation = useMakeMove(friendId, widgetId, currentUserId);
  const resetGameMutation = useResetGame(friendId, widgetId);
  useGameSubscription(friendId, widgetId);

  const game = gameData || config;
  const board = game?.board || createEmptyBoard();
  const status = game?.status || "active";
  const moves = game?.moves || [];

  // Get player IDs and determine current turn
  const playerOneId = game?.player_one_id || ADMIN_USER_ID;
  const playerTwoId = game?.player_two_id || friendId;
  const currentTurnId = game?.current_turn_id || playerOneId;
  const isMyTurn = currentTurnId === currentUserId;

  // Get player colors
  const playerOneColor = game?.player_one_color || "⚫";
  const playerTwoColor = game?.player_two_color || "⚪";
  const myColor = currentUserId === playerOneId ? playerOneColor : playerTwoColor;
  const theirColor = currentUserId === playerOneId ? playerTwoColor : playerOneColor;

  // Get player display names
  const myDisplayName = getUserDisplayName(currentUserId, friendName);
  const theirDisplayName = useMemo(() => {
    const otherPlayerId = currentUserId === playerOneId ? playerTwoId : playerOneId;
    return getUserDisplayName(otherPlayerId, friendName);
  }, [currentUserId, playerOneId, playerTwoId, friendName]);

  // Determine if I won/lost
  const winnerId = game?.winner_id;
  const iWon = status === "won" && winnerId === currentUserId;
  const iLost = status === "lost" && winnerId !== currentUserId && winnerId !== undefined;

  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);
  const [animatingColumn, setAnimatingColumn] = useState<number | null>(null);

  const handleColumnClick = useCallback(
    (column: number) => {
      if (status !== "active" || !isMyTurn) {
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
    [board, isMyTurn, status, makeMoveMutation]
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
    resetGameMutation.mutate();
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
            {iWon && (
              <>
                <div className={styles.resultIcon}>
                  <i className="hn hn-trophy-solid" style={{ fontSize: "4rem" }} />
                </div>
                <h2 className={styles.resultTitle}>{myDisplayName} WON!</h2>
                <p className={styles.resultMessage}>Victory achieved!</p>
                <div className={styles.resultDetails}>
                  <p>Winner: {myDisplayName}</p>
                  <p>Opponent: {theirDisplayName}</p>
                </div>
              </>
            )}
            {iLost && (
              <>
                <div className={styles.resultIcon}>
                  <i className="hn hn-times-circle-solid" style={{ fontSize: "4rem" }} />
                </div>
                <h2 className={styles.resultTitle}>{myDisplayName} LOST</h2>
                <p className={styles.resultMessage}>Defeat...</p>
                <div className={styles.resultDetails}>
                  <p>Winner: {theirDisplayName}</p>
                  <p>Loser: {myDisplayName}</p>
                </div>
              </>
            )}
            {status === "draw" && (
              <>
                <div className={styles.resultIcon}>
                  <i className="hn hn-equals-solid" style={{ fontSize: "4rem" }} />
                </div>
                <h2 className={styles.resultTitle}>DRAW</h2>
                <p className={styles.resultMessage}>It&apos;s a tie!</p>
                <div className={styles.resultDetails}>
                  <p>
                    Players: {myDisplayName} vs {theirDisplayName}
                  </p>
                  <p>No winner this round</p>
                </div>
              </>
            )}
            <button
              className={styles.playAgainButton}
              onClick={handlePlayAgain}
              style={{ minHeight: "44px" }}
            >
              <i className="hn hn-redo-solid" style={{ marginRight: "var(--space-sm)" }} />
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
            {myDisplayName} ({myColor}) vs {theirDisplayName} ({theirColor})
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
                    isMyTurn &&
                    cell === null &&
                    row === calculateDropRow(board, col);
                  const isEmpty = cell === null;

                  // Determine piece color based on which player it belongs to
                  const isMyPiece = cell === (currentUserId === playerOneId ? "you" : "them");
                  const isTheirPiece = cell === (currentUserId === playerOneId ? "them" : "you");

                  return (
                    <div
                      key={col}
                      className={`${styles.cell} ${isAnimating ? styles.animating : ""} ${isHoveredCell ? styles.ghost : ""} ${isHoveredColumn && isEmpty ? styles.hoveredColumn : ""}`}
                      onClick={() => handleColumnClick(col)}
                      onMouseEnter={() => {
                        if (status === "active" && isMyTurn) {
                          setHoveredColumn(col);
                          playSound("game_hover");
                        }
                      }}
                      onMouseLeave={() => setHoveredColumn(null)}
                      style={{ cursor: status === "active" && isMyTurn ? "pointer" : "default" }}
                    >
                      {isMyPiece ? (
                        <div
                          className={styles.piece}
                          style={{ backgroundColor: themeColors.primary }}
                        />
                      ) : isTheirPiece ? (
                        <div
                          className={styles.piece}
                          style={{ backgroundColor: themeColors.secondary }}
                        />
                      ) : isHoveredCell ? (
                        <div
                          className={styles.ghostPiece}
                          style={{ backgroundColor: themeColors.primary }}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.gameStatus}>
          {status === "active" && isMyTurn && (
            <div className={styles.turnIndicator}>{myDisplayName}&apos;S TURN</div>
          )}
          {status === "active" && !isMyTurn && (
            <div className={styles.turnIndicator}>Waiting for {theirDisplayName}...</div>
          )}
          {lastMove && (
            <div className={styles.moveHistory}>
              Last move: {lastMove.player_id === currentUserId ? myDisplayName : theirDisplayName}{" "}
              played column {lastMove.column + 1} ({formatTimeAgo(lastMove.timestamp)})
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
