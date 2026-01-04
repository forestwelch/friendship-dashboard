/**
 * Global constants for the Friendship Dashboard
 */

// Admin name - used throughout the app
export const ADMIN_NAME = "FOREST";

// Admin user ID identifier
export const ADMIN_USER_ID = "admin";

// Grid dimensions - single source of truth
// Change these values to resize the entire grid
export const GRID_COLS = 5;
export const GRID_ROWS = 9; // Reduced from 10 to 9 rows to prevent mobile cutoff
export const GRID_TILE_SIZE_REM = 5; // Tile size in rem (5rem = 80px at 16px base)
export const GRID_GAP_REM = 0.5; // Gap between tiles in rem (0.5rem = 8px at 16px base)

// Calculated grid dimensions (for JavaScript calculations)
export const GRID_WIDTH_REM = GRID_COLS * GRID_TILE_SIZE_REM + (GRID_COLS - 1) * GRID_GAP_REM;
export const GRID_HEIGHT_REM = GRID_ROWS * GRID_TILE_SIZE_REM + (GRID_ROWS - 1) * GRID_GAP_REM;

// String versions for CSS (with 'rem' suffix)
export const GRID_TILE_SIZE = `${GRID_TILE_SIZE_REM}rem`;
export const GRID_GAP = `${GRID_GAP_REM}rem`;
