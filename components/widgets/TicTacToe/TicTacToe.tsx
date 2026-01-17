"use client";

import { playSound } from "@/lib/sounds";
import { useUIStore } from "@/lib/store/ui-store";
import { ThemeColors, WidgetSize } from "@/lib/types";
import { TicTacToeModal } from "./TicTacToeModal";
import { createEmptyBoard } from "./logic";
import { TicTacToeData, useTicTacToeGame } from "./queries";
import { ADMIN_USER_ID } from "@/lib/constants";
import { getUserColor } from "@/lib/utils/color-utils";
import { useUserContext, getUserIdForFriend } from "@/lib/hooks/useUserContext";
import { Shimmer } from "@/components/shared";
import styles from "./TicTacToe.module.css";

interface TicTacToeProps {
  size: WidgetSize;
  friendId: string;
  friendName: string;
  widgetId: string;
  themeColors: ThemeColors;
  config?: TicTacToeData;
  isEditMode?: boolean;
}

export function TicTacToe({
  size,
  friendId,
  friendName,
  widgetId,
  themeColors,
  config,
  isEditMode = false,
}: TicTacToeProps) {
  const { setOpenModal } = useUIStore();

  const {
    data: gameData,
    isLoading,
    isPending,
  } = useTicTacToeGame(friendId, widgetId, {
    refetchInterval: isEditMode ? undefined : 5000,
  });

  const isLoadingState = isLoading || isPending;
  const game = gameData || config;
  const board = game?.board || createEmptyBoard();

  const userContext = useUserContext();
  const currentUserId = getUserIdForFriend(userContext, friendId);
  const player1Id = game?.player1_id || friendId;
  const player2Id = game?.player2_id || ADMIN_USER_ID;
  const currentTurnId = game?.current_turn_id || player1Id;
  const status = game?.status || "active";
  const isMyTurn = currentTurnId === currentUserId;

  // Check if there's no game at all
  const hasNoActiveGame = !game;

  const getTurnText = () => {
    if (hasNoActiveGame) {
      return "Tic-Tac-Toe";
    }
    if (status === "completed") {
      return "Game Over";
    }
    if (isMyTurn) {
      return "My turn";
    }
    return "Waiting...";
  };

  const handleClick = () => {
    const modalId = `tictactoe-${widgetId}`;
    setOpenModal(modalId);
    playSound("open");
  };

  const renderBoardPreview = () => {
    const displayBoard = board.length === 9 ? board : createEmptyBoard();
    const player1Moves = game?.player1_moves || [];
    const player2Moves = game?.player2_moves || [];
    const oldestPlayer1Move = player1Moves.length > 0 ? player1Moves[0] : null;
    const oldestPlayer2Move = player2Moves.length > 0 ? player2Moves[0] : null;

    return (
      <div className={styles.board}>
        {Array.from({ length: 9 }).map((_, index) => {
          const cellValue = displayBoard[index];
          // Only mark as oldest if player has 3 pieces (meaning 4th will remove it)
          const isOldest =
            (cellValue === player1Id && player1Moves.length >= 3 && index === oldestPlayer1Move) ||
            (cellValue === player2Id && player2Moves.length >= 3 && index === oldestPlayer2Move);

          let iconColor: string | null = null;
          let iconClass: string | null = null;

          if (cellValue === player1Id && game?.player1_icon) {
            iconColor = getUserColor(player1Id, friendId, themeColors);
            iconClass = game.player1_icon;
          } else if (cellValue === player2Id && game?.player2_icon) {
            iconColor = getUserColor(player2Id, friendId, themeColors);
            iconClass = game.player2_icon;
          }

          // Only show oldest styling if player has 3+ pieces
          const showOldestStyling =
            isOldest &&
            ((cellValue === player1Id && player1Moves.length >= 3) ||
              (cellValue === player2Id && player2Moves.length >= 3));

          return (
            <div key={index} className={`${styles.cell} ${cellValue ? styles.hasPiece : ""}`}>
              {iconClass && iconColor ? (
                <i
                  className={`hn ${iconClass} ${styles.iconDisplay} ${showOldestStyling ? styles.oldestIcon : ""}`}
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

  if (isLoadingState) {
    const [cols, rows] = size.split("x").map(Number);
    const tileClass = cols >= 3 && rows >= 3 ? styles.tile3x3 : styles.tile2x2;

    return (
      <>
        <div className={tileClass}>
          <Shimmer animation="verticalwipe" className={tileClass} />
        </div>
        <TicTacToeModal
          friendId={friendId}
          friendName={friendName}
          widgetId={widgetId}
          themeColors={themeColors}
          config={game}
        />
      </>
    );
  }

  if (size !== "2x2" && size !== "3x3") {
    return (
      <div className={styles.tile2x2}>
        <div className="widget-error-message">Tic Tac Toe supports 2×2 and 3×3 sizes only</div>
      </div>
    );
  }

  const tileClass = size === "3x3" ? styles.tile3x3 : styles.tile2x2;

  return (
    <>
      <div className={tileClass} onClick={handleClick}>
        <div className={styles.title}>{getTurnText()}</div>
        {renderBoardPreview()}
      </div>
      <TicTacToeModal
        friendId={friendId}
        friendName={friendName}
        widgetId={widgetId}
        themeColors={themeColors}
        config={game}
      />
    </>
  );
}
