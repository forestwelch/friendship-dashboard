export type Player = "you" | "them" | null;
export type Board = Player[][];

export const BOARD_COLS = 7;
export const BOARD_ROWS = 6;

export function createEmptyBoard(): Board {
  return Array(BOARD_ROWS)
    .fill(null)
    .map(() => Array(BOARD_COLS).fill(null));
}

export function makeMove(
  board: Board,
  column: number,
  player: "you" | "them"
): Board | null {
  if (column < 0 || column >= BOARD_COLS) return null;

  // Find the lowest empty row in the column
  for (let row = BOARD_ROWS - 1; row >= 0; row--) {
    if (board[row][column] === null) {
      const newBoard = board.map((r) => [...r]);
      newBoard[row][column] = player;
      return newBoard;
    }
  }

  return null; // Column is full
}

export function validateMove(board: Board, column: number): boolean {
  if (column < 0 || column >= BOARD_COLS) return false;
  return board[0][column] === null; // Top row is empty
}

export function checkWin(board: Board, player: "you" | "them"): boolean {
  // Check horizontal
  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col <= BOARD_COLS - 4; col++) {
      if (
        board[row][col] === player &&
        board[row][col + 1] === player &&
        board[row][col + 2] === player &&
        board[row][col + 3] === player
      ) {
        return true;
      }
    }
  }

  // Check vertical
  for (let row = 0; row <= BOARD_ROWS - 4; row++) {
    for (let col = 0; col < BOARD_COLS; col++) {
      if (
        board[row][col] === player &&
        board[row + 1][col] === player &&
        board[row + 2][col] === player &&
        board[row + 3][col] === player
      ) {
        return true;
      }
    }
  }

  // Check diagonal (top-left to bottom-right)
  for (let row = 0; row <= BOARD_ROWS - 4; row++) {
    for (let col = 0; col <= BOARD_COLS - 4; col++) {
      if (
        board[row][col] === player &&
        board[row + 1][col + 1] === player &&
        board[row + 2][col + 2] === player &&
        board[row + 3][col + 3] === player
      ) {
        return true;
      }
    }
  }

  // Check diagonal (top-right to bottom-left)
  for (let row = 0; row <= BOARD_ROWS - 4; row++) {
    for (let col = 3; col < BOARD_COLS; col++) {
      if (
        board[row][col] === player &&
        board[row + 1][col - 1] === player &&
        board[row + 2][col - 2] === player &&
        board[row + 3][col - 3] === player
      ) {
        return true;
      }
    }
  }

  return false;
}

export function checkDraw(board: Board): boolean {
  // Board is full and no winner
  return board.every((row) => row.every((cell) => cell !== null));
}

export function calculateDropRow(board: Board, column: number): number {
  for (let row = BOARD_ROWS - 1; row >= 0; row--) {
    if (board[row][column] === null) {
      return row;
    }
  }
  return -1; // Column is full
}

