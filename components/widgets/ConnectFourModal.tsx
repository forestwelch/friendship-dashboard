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
  getWinningPositions,
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

  // Player colors are determined by themeColors (primary/secondary)

  // Get player display names
  const myDisplayName = getUserDisplayName(currentUserId, friendName);
  const theirDisplayName = useMemo(() => {
    const otherPlayerId = currentUserId === playerOneId ? playerTwoId : playerOneId;
    return getUserDisplayName(otherPlayerId, friendName);
  }, [currentUserId, playerOneId, playerTwoId, friendName]);

  // Determine if I won/lost
  const winnerId = game?.winner_id;
  // If status is "won" and winnerId matches current user, I won
  // If status is "won" and winnerId doesn't match current user, I lost
  const iWon = status === "won" && winnerId === currentUserId;
  const iLost = status === "won" && winnerId !== currentUserId && winnerId !== undefined;

  // Get winning positions for highlighting
  const winningPositions = useMemo(() => {
    if (status !== "won" || !winnerId) return [];
    const winnerPiece = winnerId === playerOneId ? "you" : "them";
    return getWinningPositions(board, winnerPiece);
  }, [status, winnerId, board, playerOneId]);

  const isWinningCell = useCallback(
    (row: number, col: number) => {
      return winningPositions.some((pos) => pos.row === row && pos.col === col);
    },
    [winningPositions]
  );

  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);
  const [animatingColumn, setAnimatingColumn] = useState<number | null>(null);
  const [previousHoveredColumn, setPreviousHoveredColumn] = useState<number | null>(null);

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
            {/* Show board with winning positions highlighted */}
            <div className={styles.boardContainer}>
              <div className={styles.board}>
                {Array.from({ length: BOARD_ROWS }).map((_, row) => (
                  <div key={row} className={styles.boardRow}>
                    {Array.from({ length: BOARD_COLS }).map((_, col) => {
                      const cell = board[row][col];
                      // Colors are consistent: "you" = player_one (primary), "them" = player_two (secondary)
                      const isWinning = isWinningCell(row, col);

                      return (
                        <div
                          key={col}
                          className={`${styles.cell} ${isWinning ? styles.winningCell : ""}`}
                        >
                          {cell === "you" ? (
                            <div
                              className={`${styles.piece} ${isWinning ? styles.winningPiece : ""}`}
                              style={{ backgroundColor: themeColors.primary }}
                            />
                          ) : cell === "them" ? (
                            <div
                              className={`${styles.piece} ${isWinning ? styles.winningPiece : ""}`}
                              style={{ backgroundColor: themeColors.secondary }}
                            />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Result message and button in a row */}
            <div className={styles.resultRow}>
              {iWon && (
                <>
                  <div className={styles.resultIcon}>
                    <i className="hn hn-trophy-solid" style={{ fontSize: "2rem" }} />
                  </div>
                  <h2 className={styles.resultTitle}>YOU WON!</h2>
                </>
              )}
              {iLost && (
                <>
                  <div className={styles.resultIcon}>
                    <i className="hn hn-times-circle-solid" style={{ fontSize: "2rem" }} />
                  </div>
                  <h2 className={styles.resultTitle}>YOU LOST :(</h2>
                </>
              )}
              {status === "draw" && (
                <>
                  <div className={styles.resultIcon}>
                    <i className="hn hn-equals-solid" style={{ fontSize: "2rem" }} />
                  </div>
                  <h2 className={styles.resultTitle}>DRAW</h2>
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
            <span className={styles.playerName}>
              {currentUserId === playerOneId ? myDisplayName : theirDisplayName}
            </span>
            <span
              className={styles.playerCircle}
              style={{
                backgroundColor:
                  currentUserId === playerOneId ? themeColors.primary : themeColors.secondary,
              }}
            />
            <span className={styles.vs}>vs</span>
            <span className={styles.playerName}>
              {currentUserId === playerOneId ? theirDisplayName : myDisplayName}
            </span>
            <span
              className={styles.playerCircle}
              style={{
                backgroundColor:
                  currentUserId === playerOneId ? themeColors.secondary : themeColors.primary,
              }}
            />
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
                  const dropRow = calculateDropRow(board, col);
                  const isEmpty = cell === null;
                  const showGhostPiece =
                    isHoveredColumn && isEmpty && status === "active" && isMyTurn;
                  const ghostOpacity = showGhostPiece && row === dropRow ? 0.8 : 0.2;

                  // Colors are consistent: "you" = player_one (primary), "them" = player_two (secondary)
                  const isWinning = isWinningCell(row, col);

                  return (
                    <div
                      key={col}
                      className={`${styles.cell} ${isAnimating ? styles.animating : ""} ${isWinning ? styles.winningCell : ""}`}
                      onClick={() => handleColumnClick(col)}
                      onMouseEnter={() => {
                        if (status === "active" && isMyTurn) {
                          // Only trigger sound/state change if column actually changed
                          if (previousHoveredColumn !== col) {
                            setHoveredColumn(col);
                            setPreviousHoveredColumn(col);
                            playSound("game_hover");
                          } else {
                            // Same column, just update state without sound
                            setHoveredColumn(col);
                          }
                        }
                      }}
                      onMouseLeave={() => {
                        setHoveredColumn(null);
                        setPreviousHoveredColumn(null);
                      }}
                      style={{
                        cursor: status === "active" && isMyTurn ? "pointer" : "default",
                      }}
                    >
                      {cell === "you" ? (
                        <div
                          className={`${styles.piece} ${isWinning ? styles.winningPiece : ""}`}
                          style={{ backgroundColor: themeColors.primary }}
                        />
                      ) : cell === "them" ? (
                        <div
                          className={`${styles.piece} ${isWinning ? styles.winningPiece : ""}`}
                          style={{ backgroundColor: themeColors.secondary }}
                        />
                      ) : showGhostPiece ? (
                        <div
                          className={styles.ghostPiece}
                          style={{
                            backgroundColor:
                              currentUserId === playerOneId
                                ? themeColors.primary
                                : themeColors.secondary,
                            opacity: ghostOpacity,
                          }}
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
