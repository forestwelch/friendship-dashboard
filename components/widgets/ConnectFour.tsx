"use client";

import { useEffect } from "react";
import { playSound } from "@/lib/sounds";
import { useUIStore } from "@/lib/store/ui-store";
import { ThemeColors } from "@/lib/types";
import { ConnectFourModal } from "./ConnectFourModal";
import { createEmptyBoard, BOARD_ROWS, BOARD_COLS } from "@/lib/connect-four-logic";
import { ConnectFourData, useConnectFourGame, useGameSubscription } from "@/lib/queries-connect-four";
import styles from "./ConnectFour.module.css";

interface ConnectFourProps {
  size: 1 | 2 | 3;
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
  const { data: gameData, refetch } = useConnectFourGame(friendId, widgetId);
  useGameSubscription(friendId, widgetId);
  
  // Also poll periodically as a fallback (every 2 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 2000);
    return () => clearInterval(interval);
  }, [refetch]);
  
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
                <div 
                  key={colIdx} 
                  className={styles.boardCell}
                >
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
  
  // Render static condensed board for 1x1 tile (4x4 board with diagonal win)
  const renderStaticBoard = () => {
    // Create a 4x4 static example board with 4 pieces filled in diagonally
    const staticBoard: (("you" | "them" | null)[])[] = [
      ["you", null, null, null],
      [null, "you", null, null],
      [null, null, "you", null],
      [null, null, null, "you"],
    ];
    
    return (
      <div className={styles.staticBoard}>
        {Array.from({ length: 4 }).map((_, rowIdx) => (
          <div key={rowIdx} className={styles.staticBoardRow}>
            {Array.from({ length: 4 }).map((_, colIdx) => {
              const cell = staticBoard[rowIdx]?.[colIdx];
              return (
                <div 
                  key={colIdx} 
                  className={styles.staticBoardCell}
                >
                  {cell === "you" ? (
                    <div 
                      className={styles.staticPiece}
                      style={{ backgroundColor: themeColors.primary }}
                    />
                  ) : cell === "them" ? (
                    <div 
                      className={styles.staticPiece}
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

  // 1x1 Tile: Static condensed grid view
  if (size === 1) {
    return (
      <>
        <div className={styles.tile1x1} onClick={handleClick}>
          {renderStaticBoard()}
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
  if (size === 2) {
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

  // 3x3 Tile: Full board preview
  if (size === 3) {
    return (
      <>
        <div className={styles.tile3x3} onClick={handleClick}>
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

  return null;
}

