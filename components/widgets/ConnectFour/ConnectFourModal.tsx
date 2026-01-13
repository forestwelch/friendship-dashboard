"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { playSound } from "@/lib/sounds";
import { useUIStore } from "@/lib/store/ui-store";
import { ThemeColors } from "@/lib/types";
import { Modal } from "@/components/shared";
import {
  createEmptyBoard,
  validateMove,
  calculateDropRow,
  getWinningPositions,
  BOARD_COLS,
  BOARD_ROWS,
} from "./logic";
import {
  useConnectFourGame,
  useMakeMove,
  useGameSubscription,
  useResetGame,
  ConnectFourData,
} from "./queries";
import { useUserContext, getUserIdForFriend, getUserDisplayName } from "@/lib/hooks/useUserContext";
import { ADMIN_USER_ID } from "@/lib/constants";
import { getUserColor } from "@/lib/utils/color-utils";
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

  // Use realtime subscription when modal is open, with polling fallback
  const { data: gameData } = useConnectFourGame(friendId, widgetId, {
    refetchInterval: isOpen ? 3000 : undefined, // Poll every 3 seconds when modal is open (fallback)
  });
  const makeMoveMutation = useMakeMove(friendId, widgetId, currentUserId);
  const resetGameMutation = useResetGame(friendId, widgetId);
  // Only subscribe when modal is open
  useGameSubscription(friendId, widgetId, { enabled: isOpen });

  const game = gameData || config;
  const board = useMemo(() => game?.board || createEmptyBoard(), [game?.board]);
  const status = game?.status || "active";
  const moves = useMemo(() => game?.moves || [], [game?.moves]);

  // Get player IDs and determine current turn
  const playerOneId = game?.player_one_id || ADMIN_USER_ID;
  const playerTwoId = game?.player_two_id || friendId;
  const currentTurnId = game?.current_turn_id || playerOneId;
  const isMyTurn = currentTurnId === currentUserId;

  // Debug: Log for ghost piece color determination
  // playerOneId is always admin, playerTwoId is always friend
  // currentTurnId should match one of them to determine whose turn it is

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
  const previousMovesLengthRef = useRef(moves.length);
  const previousIsMyTurnRef = useRef(isMyTurn);
  const hoveredColumnRef = useRef<number | null>(null);

  // Track hovered column in a ref for comparison
  useEffect(() => {
    hoveredColumnRef.current = hoveredColumn;
  }, [hoveredColumn]);

  // Clear hovered column when board state changes or when it's no longer user's turn
  // Use a callback pattern to avoid synchronous setState in effect
  useEffect(() => {
    const movesChanged = moves.length !== previousMovesLengthRef.current;
    const turnChanged = isMyTurn !== previousIsMyTurnRef.current;

    if ((movesChanged || turnChanged) && hoveredColumnRef.current !== null) {
      // Schedule state update for next tick to avoid synchronous setState
      requestAnimationFrame(() => {
        setHoveredColumn(null);
        setPreviousHoveredColumn(null);
      });
    }

    previousMovesLengthRef.current = moves.length;
    previousIsMyTurnRef.current = isMyTurn;
  }, [moves.length, isMyTurn]);

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

      // Clear hover state when making a move
      setHoveredColumn(null);
      setPreviousHoveredColumn(null);

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

  // Find the position of the most recent move
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const lastMovePosition = useMemo(() => {
    if (moves.length === 0) return null;
    const lastMove = moves[moves.length - 1];
    const column = lastMove.column;

    // Find the topmost piece in that column (most recently placed)
    // Pieces fill from bottom to top, so the last move is at the lowest row index with a piece
    for (let row = 0; row < BOARD_ROWS; row++) {
      if (board[row][column] !== null) {
        return { row, col: column };
      }
    }
    return null;
  }, [moves, board]);

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
                      // Colors: friend always = primary (pink), admin always = secondary (green)
                      // playerOneId is always admin, playerTwoId is always friend
                      // Board stores "you" and "them" relative to the player who made the move
                      // "you" = admin (player_one) moves, "them" = friend (player_two) moves
                      // This is consistent regardless of who's viewing
                      const isWinning = isWinningCell(row, col);
                      const isLastMove =
                        lastMovePosition?.row === row && lastMovePosition?.col === col;
                      let pieceColor: string | null = null;

                      if (cell === "you") {
                        // "you" piece = admin (player_one) = secondary color
                        pieceColor = getUserColor(playerOneId, friendId, themeColors);
                      } else if (cell === "them") {
                        // "them" piece = friend (player_two) = primary color
                        pieceColor = getUserColor(playerTwoId, friendId, themeColors);
                      }

                      return (
                        <div
                          key={col}
                          className={`${styles.cell} ${isWinning ? styles.winningCell : ""}`}
                        >
                          {pieceColor ? (
                            <div
                              className={`${styles.piece} ${isWinning ? styles.winningPiece : ""}`}
                              style={{ "--piece-color": pieceColor } as React.CSSProperties}
                            >
                              {isLastMove && (
                                <i className={`hn hn-face-thinking-solid ${styles.pieceIcon}`} />
                              )}
                            </div>
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
                    <i className={`hn hn-trophy-solid ${styles.trophyIcon}`} />
                  </div>
                  <h2 className={styles.resultTitle}>YOU WON!</h2>
                </>
              )}
              {iLost && (
                <>
                  <div className={styles.resultIcon}>
                    <i className={`hn hn-times-circle-solid ${styles.timesIcon}`} />
                  </div>
                  <h2 className={styles.resultTitle}>YOU LOST :(</h2>
                </>
              )}
              {status === "draw" && (
                <>
                  <div className={styles.resultIcon}>
                    <i className={`hn hn-divider-solid ${styles.dividerIcon}`} />
                  </div>
                  <h2 className={styles.resultTitle}>DRAW</h2>
                </>
              )}
              <button className={styles.playAgainButton} onClick={handlePlayAgain}>
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
                backgroundColor: getUserColor(playerOneId, friendId, themeColors),
              }}
            />
            <span className={styles.vs}>vs</span>
            <span className={styles.playerName}>
              {currentUserId === playerOneId ? theirDisplayName : myDisplayName}
            </span>
            <span
              className={styles.playerCircle}
              style={{
                backgroundColor: getUserColor(playerTwoId, friendId, themeColors),
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
                  const isLastMove = lastMovePosition?.row === row && lastMovePosition?.col === col;

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
                      onTouchStart={() => {
                        // On mobile, show ghost preview on touch start (similar to hover on desktop)
                        if (status === "active" && isMyTurn) {
                          if (previousHoveredColumn !== col) {
                            setHoveredColumn(col);
                            setPreviousHoveredColumn(col);
                            playSound("game_hover");
                          } else {
                            setHoveredColumn(col);
                          }
                        }
                      }}
                      style={{
                        cursor: status === "active" && isMyTurn ? "pointer" : "default",
                      }}
                    >
                      {(() => {
                        // Colors: friend always = primary (pink), admin always = secondary (green)
                        // playerOneId is always admin, playerTwoId is always friend
                        // Board stores "you" and "them" relative to the player who made the move
                        // "you" = admin (player_one) moves, "them" = friend (player_two) moves
                        // This is consistent regardless of who's viewing
                        let pieceColor: string | null = null;

                        if (cell === "you") {
                          // "you" piece = admin (player_one) = secondary color
                          pieceColor = getUserColor(playerOneId, friendId, themeColors);
                        } else if (cell === "them") {
                          // "them" piece = friend (player_two) = primary color
                          pieceColor = getUserColor(playerTwoId, friendId, themeColors);
                        } else if (showGhostPiece) {
                          // Ghost piece shows the color of the player whose turn it is
                          const ghostColor = getUserColor(currentTurnId, friendId, themeColors);
                          return (
                            <div
                              className={styles.ghostPiece}
                              style={{
                                backgroundColor: ghostColor,
                                opacity: ghostOpacity,
                              }}
                            />
                          );
                        }

                        if (pieceColor) {
                          const isWinning = isWinningCell(row, col);
                          return (
                            <div
                              className={`${styles.piece} ${isWinning ? styles.winningPiece : ""}`}
                              style={{ "--piece-color": pieceColor } as React.CSSProperties}
                            >
                              {isLastMove && (
                                <i className={`hn hn-face-thinking-solid ${styles.pieceIcon}`} />
                              )}
                            </div>
                          );
                        }
                        return null;
                      })()}
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
        </div>
      </div>
    </Modal>
  );
}
