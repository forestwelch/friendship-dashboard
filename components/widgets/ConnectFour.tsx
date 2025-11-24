"use client";

import { useMemo } from "react";
import { playSound } from "@/lib/sounds";
import { useUIStore } from "@/lib/store/ui-store";
import { ThemeColors } from "@/lib/types";
import { ConnectFourModal } from "./ConnectFourModal";
import { createEmptyBoard, BOARD_ROWS, BOARD_COLS } from "@/lib/connect-four-logic";
import styles from "./ConnectFour.module.css";

interface GameMove {
  player: "you" | "them";
  column: number;
  timestamp: string;
}

interface ConnectFourData {
  board?: (("you" | "them" | null)[])[];
  current_turn?: "you" | "them";
  your_color?: string;
  their_color?: string;
  status?: "active" | "won" | "lost" | "draw";
  moves?: GameMove[];
}

interface ConnectFourProps {
  size: 1 | 2 | 3;
  friendId: string;
  widgetId: string;
  themeColors: ThemeColors;
  config?: ConnectFourData;
}

export function ConnectFour({
  size,
  friendId,
  widgetId,
  themeColors,
  config,
}: ConnectFourProps) {
  const { setOpenModal } = useUIStore();
  const board = config?.board || createEmptyBoard();
  const currentTurn = config?.current_turn || "you";
  const _yourColor = config?.your_color || "⚫";
  const _theirColor = config?.their_color || "⚪";
  const status = config?.status || "active";

  // Determine who won last (for 1x1 tile color assignment)
  // Winner gets primary color, loser gets secondary
  const lastWinner = useMemo(() => {
    const gameMoves = config?.moves || [];
    if (status === "won") return "you";
    if (status === "lost") return "them";
    // If game is active, check last move
    if (gameMoves.length > 0) {
      return gameMoves[gameMoves.length - 1].player;
    }
    // Default: current turn player
    return currentTurn === "you" ? "you" : "them";
  }, [status, config?.moves, currentTurn]);

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
                  className={`${styles.boardCell} ${cell === "you" ? styles.youPiece : cell === "them" ? styles.themPiece : styles.emptyCell}`}
                />
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  // 1x1 Tile: Minimalist - pixelated circles, one-word CTA
  if (size === 1) {
    const youColor = lastWinner === "you" ? themeColors.primary : themeColors.secondary;
    const themColor = lastWinner === "them" ? themeColors.primary : themeColors.secondary;
    
    return (
      <>
        <div className={styles.tile1x1} onClick={handleClick}>
          <div className={styles.circles}>
            <div 
              className={styles.pixelCircle} 
              style={{ backgroundColor: youColor }}
            />
            <div 
              className={styles.pixelCircle} 
              style={{ backgroundColor: themColor }}
            />
          </div>
          {status === "active" && currentTurn === "you" && (
            <div className={styles.cta}>PLAY</div>
          )}
        </div>
        <ConnectFourModal
          friendId={friendId}
          widgetId={widgetId}
          themeColors={themeColors}
          config={config}
        />
      </>
    );
  }

  // 2x2 Tile: Full board preview
  if (size === 2) {
    return (
      <>
        <div className={styles.tile2x2} onClick={handleClick}>
          <div className={styles.title}>C4 GAME</div>
          {renderFullBoard()}
          {status === "active" && currentTurn === "you" && (
            <div className={styles.turnIndicator}>YOUR TURN</div>
          )}
        </div>
        <ConnectFourModal
          friendId={friendId}
          widgetId={widgetId}
          themeColors={themeColors}
          config={config}
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
          {status === "active" && currentTurn === "you" && (
            <div className={styles.turnIndicator}>YOUR TURN</div>
          )}
        </div>
        <ConnectFourModal
          friendId={friendId}
          widgetId={widgetId}
          themeColors={themeColors}
          config={config}
        />
      </>
    );
  }

  return null;
}

