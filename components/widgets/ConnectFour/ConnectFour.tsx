"use client";

import { useMemo } from "react";
import { Widget } from "@/components/Widget";
import { playSound } from "@/lib/sounds";
import { useUIStore } from "@/lib/store/ui-store";
import { ThemeColors, WidgetSize } from "@/lib/types";
import { ConnectFourModal } from "./ConnectFourModal";
import { createEmptyBoard, BOARD_ROWS, BOARD_COLS } from "./logic";
import { ConnectFourData, useConnectFourGame } from "./queries";
import { ADMIN_USER_ID } from "@/lib/constants";
import { getUserColor } from "@/lib/color-utils";
import { useUserContext, getUserIdForFriend, getUserDisplayName } from "@/lib/use-user-context";
import styles from "./ConnectFour.module.css";

interface ConnectFourProps {
  size: WidgetSize;
  friendId: string;
  friendName: string;
  widgetId: string;
  themeColors: ThemeColors;
  config?: ConnectFourData;
}

export function ConnectFour({
  size,
  friendId,
  friendName,
  widgetId,
  themeColors,
  config,
}: ConnectFourProps) {
  const { setOpenModal } = useUIStore();

  // Use polling for widget updates (cheap, every 5 seconds)
  const { data: gameData } = useConnectFourGame(friendId, widgetId, {
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Use live data from query, fallback to config prop
  const game = gameData || config;
  const board = game?.board || createEmptyBoard();

  // Get current user and turn info (hooks must be called unconditionally)
  const userContext = useUserContext();
  const currentUserId = getUserIdForFriend(userContext, friendId);
  const playerOneId = game?.player_one_id || ADMIN_USER_ID;
  const playerTwoId = game?.player_two_id || friendId;
  const currentTurnId = game?.current_turn_id || playerOneId;
  const status = game?.status || "active";
  const isMyTurn = currentTurnId === currentUserId;

  const theirDisplayName = useMemo(() => {
    const otherPlayerId = currentUserId === playerOneId ? playerTwoId : playerOneId;
    return getUserDisplayName(otherPlayerId, friendName);
  }, [currentUserId, playerOneId, playerTwoId, friendName]);

  const getTurnText = () => {
    if (status !== "active") {
      return "CONNECT FOUR";
    }
    if (isMyTurn) {
      return "My turn";
    }
    return `${theirDisplayName}'s turn`;
  };

  const handleClick = () => {
    setOpenModal(`connectfour-${widgetId}`);
    playSound("open");
  };

  // Render full board preview (6x7)
  const renderFullBoard = () => {
    const displayBoard = board.length > 0 ? board : createEmptyBoard();
    const moves = game?.moves || [];

    // Build a map of which player owns each piece by tracking moves
    // The board stores "you" and "them" relative to whoever made the move
    // We need to reconstruct actual ownership from the moves array
    const pieceOwnership = new Map<string, string>(); // "row,col" -> playerId

    moves.forEach((move) => {
      // Find which row this move ended up in
      const col = move.column;
      let row = BOARD_ROWS - 1;
      for (let r = BOARD_ROWS - 1; r >= 0; r--) {
        const key = `${r},${col}`;
        if (!pieceOwnership.has(key)) {
          row = r;
          break;
        }
      }
      const key = `${row},${col}`;
      pieceOwnership.set(key, move.player_id);
    });

    return (
      <div className={styles.fullBoard}>
        {Array.from({ length: BOARD_ROWS }).map((_, rowIdx) => (
          <div key={rowIdx} className={styles.boardRow}>
            {Array.from({ length: BOARD_COLS }).map((_, colIdx) => {
              const cell = displayBoard[rowIdx]?.[colIdx];
              if (!cell) return <div key={colIdx} className={styles.boardCell} />;

              // Determine actual owner from moves history
              const key = `${rowIdx},${colIdx}`;
              const ownerId = pieceOwnership.get(key);

              // If we can't determine from moves, use a fallback based on cell value
              // This shouldn't happen, but just in case
              // "you" = admin (player_one), "them" = friend (player_two)
              let pieceColor: string | null = null;
              if (ownerId) {
                pieceColor = getUserColor(ownerId, friendId, themeColors);
              } else {
                // Fallback: "you" pieces are from playerOneId (admin), "them" pieces are from playerTwoId (friend)
                const fallbackOwnerId = cell === "you" ? playerOneId : playerTwoId;
                pieceColor = getUserColor(fallbackOwnerId, friendId, themeColors);
              }

              return (
                <div key={colIdx} className={styles.boardCell}>
                  {pieceColor ? (
                    <div className={styles.piecePreview} style={{ backgroundColor: pieceColor }} />
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  // 2x1 Tile: Scrolling marquee
  if (size === "2x1") {
    return (
      <>
        <div className={styles.tile2x1} onClick={handleClick}>
          <div className={styles.marquee}>
            <div className={styles.marqueeContent}>CONNECT FOUR</div>
          </div>
        </div>
        <ConnectFourModal
          friendId={friendId}
          friendName={friendName}
          widgetId={widgetId}
          themeColors={themeColors}
          config={game}
        />
      </>
    );
  }

  // 2x2 Tile: Full board preview
  if (size === "2x2") {
    return (
      <>
        <div className={styles.tile2x2} onClick={handleClick}>
          <div className={styles.title}>{getTurnText()}</div>
          {renderFullBoard()}
        </div>
        <ConnectFourModal
          friendId={friendId}
          friendName={friendName}
          widgetId={widgetId}
          themeColors={themeColors}
          config={game}
        />
      </>
    );
  }

  // 3x3 and larger: Full board preview
  const [cols, rows] = size.split("x").map(Number);
  if (cols >= 3 && rows >= 3) {
    const tileClass =
      cols === 4 && rows === 4
        ? styles.tile4x4
        : cols === 5 && rows === 5
          ? styles.tile5x5
          : styles.tile3x3;
    return (
      <>
        <div className={tileClass} onClick={handleClick}>
          <div className={styles.title}>{getTurnText()}</div>
          {renderFullBoard()}
        </div>
        <ConnectFourModal
          friendId={friendId}
          friendName={friendName}
          widgetId={widgetId}
          themeColors={themeColors}
          config={game}
        />
      </>
    );
  }

  // Default: show error for unsupported sizes
  return (
    <Widget size={size}>
      <div className="widget-error-message">Connect Four supports 2×1, 2×2, and 3×3+ sizes</div>
    </Widget>
  );
}
