"use client";

import { useMemo } from "react";
import { playSound } from "@/lib/sounds";
import { useUIStore } from "@/lib/store/ui-store";
import { ThemeColors } from "@/lib/types";
import { ConnectFourModal } from "./ConnectFourModal";
import { createEmptyBoard, BOARD_ROWS, BOARD_COLS } from "@/lib/connect-four-logic";
import { useUserContext, getUserIdForFriend, getUserDisplayName } from "@/lib/use-user-context";
import { ConnectFourData } from "@/lib/queries-connect-four";
import { ADMIN_USER_ID } from "@/lib/constants";
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
  const userContext = useUserContext();
  const currentUserId = getUserIdForFriend(userContext, friendId);
  const myDisplayName = getUserDisplayName(currentUserId, friendName);
  
  const board = config?.board || createEmptyBoard();
  const status = config?.status || "active";
  const playerOneId = config?.player_one_id || ADMIN_USER_ID;
  const _playerTwoId = config?.player_two_id || friendId;
  const currentTurnId = config?.current_turn_id || playerOneId;
  const isMyTurn = currentTurnId === currentUserId;

  // Determine who won last (for 1x1 tile color assignment)
  // Winner gets primary color, loser gets secondary
  const lastWinner = useMemo(() => {
    const gameMoves = config?.moves || [];
    const winnerId = config?.winner_id;
    
    if (status === "won" && winnerId) {
      return winnerId === currentUserId ? "you" : "them";
    }
    // If game is active, check last move
    if (gameMoves.length > 0) {
      const lastMove = gameMoves[gameMoves.length - 1];
      return lastMove.player_id === currentUserId ? "you" : "them";
    }
    // Default: current turn player
    return isMyTurn ? "you" : "them";
  }, [status, config?.moves, config?.winner_id, currentUserId, isMyTurn]);

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
          {status === "active" && isMyTurn && (
            <div className={styles.cta}>PLAY</div>
          )}
        </div>
        <ConnectFourModal
          friendId={friendId}
          friendName={friendName}
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
          {status === "active" && isMyTurn && (
            <div className={styles.turnIndicator}>{myDisplayName}&apos;S TURN</div>
          )}
        </div>
        <ConnectFourModal
          friendId={friendId}
          friendName={friendName}
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
          {status === "active" && isMyTurn && (
            <div className={styles.turnIndicator}>{myDisplayName}&apos;S TURN</div>
          )}
        </div>
        <ConnectFourModal
          friendId={friendId}
          friendName={friendName}
          widgetId={widgetId}
          themeColors={themeColors}
          config={config}
        />
      </>
    );
  }

  return null;
}

