"use client";

import { Widget } from "@/components/Widget";
import { playSound } from "@/lib/sounds";
import { useUIStore } from "@/lib/store/ui-store";
import { ThemeColors, WidgetSize } from "@/lib/types";
import { ConnectFourModal } from "./ConnectFourModal";
import { createEmptyBoard, BOARD_ROWS, BOARD_COLS } from "@/lib/connect-four-logic";
import {
  ConnectFourData,
  useConnectFourGame,
  useGameSubscription,
} from "@/lib/queries-connect-four";
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

  // Add real-time updates for preview tiles
  const { data: gameData } = useConnectFourGame(friendId, widgetId);
  useGameSubscription(friendId, widgetId);

  // Removed polling - rely on real-time subscriptions for better performance

  // Use live data from query, fallback to config prop
  const game = gameData || config;
  const board = game?.board || createEmptyBoard();

  const handleClick = () => {
    setOpenModal(`connectfour-${widgetId}`);
    playSound("open");
  };

  // Render full board preview (6x7)
  const renderFullBoard = () => {
    const displayBoard = board.length > 0 ? board : createEmptyBoard();

    return (
      <div className={styles.fullBoard}>
        {Array.from({ length: BOARD_ROWS }).map((_, rowIdx) => (
          <div key={rowIdx} className={styles.boardRow}>
            {Array.from({ length: BOARD_COLS }).map((_, colIdx) => {
              const cell = displayBoard[rowIdx]?.[colIdx];
              return (
                <div key={colIdx} className={styles.boardCell}>
                  {cell === "you" ? (
                    <div
                      className={styles.piecePreview}
                      style={{ backgroundColor: themeColors.primary }}
                    />
                  ) : cell === "them" ? (
                    <div
                      className={styles.piecePreview}
                      style={{ backgroundColor: themeColors.secondary }}
                    />
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
          <div className={styles.title}>CONNECT FOUR</div>
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
          <div className={styles.title}>CONNECT FOUR</div>
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
