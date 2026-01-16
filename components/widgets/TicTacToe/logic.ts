// Tic Tac Toe game logic
// Board is a flat array of 9 cells (indices 0-8)
// Each cell is either null or a playerId string

export type Board = (string | null)[];

export const BOARD_SIZE = 9;

export function createEmptyBoard(): Board {
  return Array(BOARD_SIZE).fill(null);
}

/**
 * Check if a player has won (3 in a row)
 */
export function checkWin(board: Board, playerId: string): boolean {
  return getWinningCells(board, playerId).length > 0;
}

/**
 * Get the cell indices that form a winning line (3 in a row)
 * Returns empty array if no win
 */
export function getWinningCells(board: Board, playerId: string): number[] {
  // Winning combinations (indices 0-8)
  const winningLines = [
    // Horizontal
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    // Vertical
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    // Diagonal
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (const line of winningLines) {
    if (line.every((index) => board[index] === playerId)) {
      return line;
    }
  }

  return [];
}

/**
 * Get the oldest move from a moves array
 * Returns null if array is empty
 */
export function getOldestMove(moves: number[]): number | null {
  return moves.length > 0 ? moves[0] : null;
}

/**
 * Make a move on the board
 * If player already has 3 pieces, removes oldest piece before placing new one
 * Returns new board and updated moves array
 */
export function makeMove(
  board: Board,
  cellIndex: number,
  playerId: string,
  playerMoves: number[]
): { board: Board; moves: number[] } {
  const newBoard = [...board];
  const newMoves = [...playerMoves];

  // If this is the 4th move, remove the oldest piece
  if (newMoves.length >= 3) {
    const oldestMove = newMoves.shift()!;
    newBoard[oldestMove] = null; // Remove oldest piece
  }

  // Place new piece
  newBoard[cellIndex] = playerId;
  newMoves.push(cellIndex);

  return { board: newBoard, moves: newMoves };
}

/**
 * Validate if a move is legal
 */
export function validateMove(board: Board, cellIndex: number): boolean {
  if (cellIndex < 0 || cellIndex >= BOARD_SIZE) return false;
  return board[cellIndex] === null;
}

/**
 * Convert cell index (0-8) to row/col for display
 */
export function indexToRowCol(index: number): { row: number; col: number } {
  return {
    row: Math.floor(index / 3),
    col: index % 3,
  };
}

/**
 * Convert row/col to cell index (0-8)
 */
export function rowColToIndex(row: number, col: number): number {
  return row * 3 + col;
}
