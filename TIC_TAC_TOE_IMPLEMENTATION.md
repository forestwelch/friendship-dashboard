# Tic-Tac-Toe Widget - Complete Rewrite

You are rewriting the tic-tac-toe widget from scratch. The current implementation is broken and overcomplicated.

## CRITICAL: Use Connect Four as Your Reference

Before writing ANY code, open these files and study them:

- `components/widgets/ConnectFour/ConnectFour.tsx`
- `components/widgets/ConnectFour/ConnectFourModal.tsx`
- `components/widgets/ConnectFour/queries.ts`

**Match Connect Four's patterns exactly:**

- Tile renders game state (read-only preview)
- Modal handles all interactions
- Real-time sync via Supabase
- Optimistic updates
- Clean, simple UI

---

## Architecture Overview

### Two Components

1. **TicTacToe.tsx** (Tile Component)
   - Shows current game state
   - Click anywhere → opens modal
   - No interactions in tile, just display

2. **TicTacToeModal.tsx** (Game Interface)
   - Full-screen modal overlay
   - All game interactions happen here
   - Close button returns to dashboard

---

## Color Scheme (IMPORTANT)

**Friend (Max) = PRIMARY color**
**Admin (Forest) = SECONDARY color**

All icon displays, status text colors, and visual indicators must follow this:

- Max's pieces: styled with primary theme color
- Forest's pieces: styled with secondary theme color

---

## Tile Component (TicTacToe.tsx)

### Visual Layout

**2x2 Tile:**

    ┌─────────────┐
    │ TIC-TAC-TOE │
    │   👑 🎵 👑  │  ← 3x3 mini board preview
    │   🎵 👑 🎵  │
    │   👑 __ __  │
    └─────────────┘

**3x3 Tile:**

    ┌─────────────────┐
    │  TIC-TAC-TOE    │
    │   👑 │🎵 │👑   │  ← 3x3 board, larger
    │  ────┼───┼───  │
    │   🎵 │👑 │🎵   │
    │  ────┼───┼───  │
    │   👑 │   │     │
    └─────────────────┘

### Tile States

**No Game Exists:**

    ┌─────────────┐
    │ TIC-TAC-TOE │
    │             │
    │   [PLAY]    │
    │             │
    └─────────────┘

- Click anywhere → opens modal

**Game In Progress:**

    ┌─────────────┐
    │ YOUR TURN   │  ← Status text
    │   👑 🎵 __  │  ← Board preview
    │   __ 👑 🎵  │
    │   __ __ __  │
    └─────────────┘

- Shows whose turn it is
- Shows current board state
- Click anywhere → opens modal

**Game Over:**

    ┌─────────────┐
    │ YOU WIN! 🎉 │
    │   👑 🎵 __  │
    │   👑 __ 🎵  │
    │   👑 __ __  │  ← Winning line visible
    └─────────────┘

- Shows win/loss status
- Click anywhere → opens modal

### Tile Implementation Requirements

TypeScript interface:

    interface TicTacToeProps {
      size: WidgetSize;
      friendId: string;
      friendName: string;
      widgetId: string;
      themeColors: ThemeColors;
      config?: TicTacToeData;
      isEditMode?: boolean;
    }

**Rendering Logic:**

1. Fetch game data via `useTicTacToeGame(friendId)`
2. Show loading shimmer while fetching
3. Determine state:
   - No game → show "PLAY" button
   - Game exists → show status + board preview
4. On click (anywhere) → `setIsModalOpen(true)`
5. Render modal: `{isModalOpen && <TicTacToeModal ... />}`

**DO NOT:**

- Add any interactions in the tile (no clickable cells)
- Show icon selection in tile
- Show settings in tile
- Show play again button in tile

**DO:**

- Keep it simple: status text + board preview + click to open modal
- Match styling of other widgets (ConnectFour, MusicPlayer)
- Use CSS modules for styling

---

## Modal Component (TicTacToeModal.tsx)

### Modal Layout (Full Screen)

    ┌────────────────────────────────────┐
    │ [X]  TIC-TAC-TOE                   │ ← Header with close button
    ├────────────────────────────────────┤
    │                                    │
    │        [Status Bar]                │ ← "YOUR TURN" or "MAX'S TURN"
    │                                    │
    │      ┌───┬───┬───┐               │
    │      │ 👑│🎵 │   │               │ ← 3x3 Board (large, clickable)
    │      ├───┼───┼───┤               │
    │      │   │👑 │🎵 │               │
    │      ├───┼───┼───┤               │
    │      │   │   │   │               │
    │      └───┴───┴───┘               │
    │                                    │
    │        [PLAY AGAIN]                │ ← Only if game over
    │                                    │
    └────────────────────────────────────┘

### Modal States

**State 1: No Game / Need Icons**

If no game exists OR player hasn't selected icon:

    ┌────────────────────────────────────┐
    │ [X]  TIC-TAC-TOE                   │
    ├────────────────────────────────────┤
    │                                    │
    │      PICK YOUR ICON                │
    │                                    │
    │      ┌──┬──┬──┬──┬──┐            │
    │      │🔊│👑│❤️│🎵│❓│            │ ← Row 1
    │      └──┴──┴──┴──┴──┘            │
    │      ┌──┬──┬──┬──┬──┐            │
    │      │🗑️│🤔│👁️│🤝│☪️│            │ ← Row 2
    │      └──┴──┴──┴──┴──┘            │
    │                                    │
    │      (Selected: 👑)                │ ← Highlight selected
    │                                    │
    │         [CONFIRM]                  │
    │                                    │
    └────────────────────────────────────┘

**Icon Colors:**

- If Friend (Max) is selecting: all icons display in PRIMARY color
- If Admin (Forest) is selecting: all icons display in SECONDARY color

**Flow:**

1. Modal opens
2. Check if current user has icon for this game
3. If no icon → show icon selector
4. User clicks icon → highlight it
5. User clicks CONFIRM → save icon via `updateIconMutation.mutate(icon)`
6. If both players now have icons → transition to State 2
7. If opponent doesn't have icon yet → show "WAITING FOR [NAME]" (simple text, no special UI)
8. When opponent picks icon → both players see board (State 2)

**State 2: Active Game (Your Turn)**

    ┌────────────────────────────────────┐
    │ [X]  TIC-TAC-TOE              ⚙️   │ ← Settings cog in header
    ├────────────────────────────────────┤
    │                                    │
    │         YOUR TURN                  │ ← Your color (primary if friend, secondary if admin)
    │                                    │
    │      ┌─────┬─────┬─────┐          │
    │      │  👑 │ 🎵  │     │          │
    │      ├─────┼─────┼─────┤          │
    │      │     │ 👑  │ 🎵  │          │
    │      ├─────┼─────┼─────┤          │
    │      │     │     │     │          │
    │      └─────┴─────┴─────┘          │
    │                                    │
    │   If you have 3 pieces:            │
    │   Oldest piece = 50% opacity       │
    │                                    │
    └────────────────────────────────────┘

**Interaction:**

- Empty cells are clickable
- Click cell → `makeMoveMutation.mutate(cellIndex)`
- Optimistic update: piece appears immediately
- Board syncs to database
- Real-time subscription updates opponent's view
- Turn switches to opponent

**Oldest Piece:**

- If player has 3 pieces, oldest is at 50% opacity
- No tooltip needed (visual indicator is enough)
- When 4th piece placed, oldest disappears

**State 3: Active Game (Opponent's Turn)**

    ┌────────────────────────────────────┐
    │ [X]  TIC-TAC-TOE              ⚙️   │
    ├────────────────────────────────────┤
    │                                    │
    │         MAX'S TURN                 │ ← Opponent's color
    │                                    │
    │      ┌─────┬─────┬─────┐          │
    │      │  👑 │ 🎵  │     │          │
    │      ├─────┼─────┼─────┤          │
    │      │     │ 👑  │ 🎵  │          │
    │      ├─────┼─────┼─────┤          │
    │      │     │     │     │          │
    │      └─────┴─────┴─────┘          │
    │                                    │
    │   Opponent's oldest piece          │
    │   shown at 50% opacity             │
    │                                    │
    └────────────────────────────────────┘

**Interaction:**

- Cells are NOT clickable (not your turn)
- Board updates in real-time when opponent moves
- Settings cog still clickable

**State 4: Game Over (You Win)**

    ┌────────────────────────────────────┐
    │ [X]  TIC-TAC-TOE              ⚙️   │
    ├────────────────────────────────────┤
    │                                    │
    │       🎉 YOU WIN! 🎉               │ ← Celebratory text
    │                                    │
    │      ┌─────┬─────┬─────┐          │
    │      │  👑 │ 🎵  │ 👑  │          │
    │      ├─────┼─────┼─────┤          │
    │      │ 🎵  │ 👑  │ 🎵  │          │
    │      ├─────┼─────┼─────┤          │
    │      │  👑 │     │     │          │ ← Winning cells highlighted
    │      └─────┴─────┴─────┘          │
    │                                    │
    │        [PLAY AGAIN]                │
    │                                    │
    └────────────────────────────────────┘

**Winning Cells:**

- Add CSS class to winning cells: `.winningCell`
- Style: thick border in player's color, or subtle glow

**Interaction:**

- Click PLAY AGAIN → `resetGameMutation.mutate()`
- Resets board, loser goes first
- Returns to State 2 (active game)

**State 5: Game Over (You Lost)**

Same as State 4 but with "YOU LOST" text and opponent's winning cells highlighted.

**State 6: Settings Cog (Icon Changer)**

When settings cog (⚙️) clicked from any state:

    ┌────────────────────────────────────┐
    │ [X]  CHANGE ICON              [←]  │ ← Back button
    ├────────────────────────────────────┤
    │                                    │
    │      PICK YOUR ICON                │
    │                                    │
    │      ┌──┬──┬──┬──┬──┐            │
    │      │🔊│👑│❤️│🎵│❓│            │
    │      └──┴──┴──┴──┴──┘            │
    │      ┌──┬──┬──┬──┬──┐            │
    │      │🗑️│🤔│👁️│🤝│☪️│            │
    │      └──┴──┴──┴──┴──┘            │
    │                                    │
    │      (Selected: 🗑️)                │
    │                                    │
    │         [CONFIRM]                  │
    │                                    │
    └────────────────────────────────────┘

**Flow:**

1. User clicks ⚙️ cog
2. Show icon selector (same as State 1)
3. User selects new icon
4. Click CONFIRM → updates icon immediately
5. All pieces on board update to new icon
6. Opponent sees change in real-time
7. Return to previous state (game board)

### Modal Implementation Requirements

TypeScript interface:

    interface TicTacToeModalProps {
      friendId: string;
      friendName: string;
      widgetId: string;
      themeColors: ThemeColors;
      onClose: () => void;
    }

**Rendering Logic:**

1. Fetch game data (same query as tile)
2. Determine which state to show:
   - No icon → State 1 (icon selector)
   - Opponent no icon → State 1 with "WAITING FOR [NAME]" text
   - Your turn → State 2
   - Opponent turn → State 3
   - Game over (you win) → State 4
   - Game over (you lost) → State 5
3. Render appropriate UI
4. Handle interactions (cell clicks, icon selection, etc.)

**Styling:**

- Full-screen overlay (background: theme bg color with 95% opacity)
- Centered content area
- Large, touch-friendly cells (min 60px × 60px)
- Clean spacing between elements
- Match existing modal patterns (see ConnectFourModal)

---

## Simplified State Machine

**Remove all "waiting" intermediary states.** Here's the flow:

### First Game Ever

1. Player 1 clicks PLAY → modal opens
2. Check if Player 1 has icon:
   - No → show icon selector
   - Yes → create game, show board
3. Check if Player 2 has icon:
   - No → show "Waiting for [name] to pick icon" (just text in modal, no special UI)
   - Yes → show board
4. Once both have icons → show board with whose turn it is

### Subsequent Games

1. Either player clicks widget → modal opens
2. Icons already exist from previous games
3. Show board immediately
4. No icon selection needed (unless user clicks settings cog)

### Icon Changes Mid-Game

1. User clicks ⚙️ cog
2. Show icon selector
3. User picks new icon
4. All pieces update immediately
5. Return to game board

**Key Simplification:**

- Don't make both players wait in separate "waiting" states
- Just load the board and show whose turn it is
- If opponent hasn't picked icon, show simple text: "Waiting for Max to join"
- No deadlock situations possible

---

## Data Model (Keep Existing)

TypeScript interface:

    interface TicTacToeData {
      player1_id: string;         // Friend (Max)
      player2_id: string;         // Admin (Forest)
      player1_icon: string | null;
      player2_icon: string | null;
      player1_moves: number[];    // Chronological order [0, 4, 7]
      player2_moves: number[];
      current_turn_id: string;
      winner_id: string | null;
      status: "awaiting_p2_icon" | "active" | "completed";
      board: (string | null)[];   // 9 cells, indices 0-8
    }

**Status Values:**

- `"awaiting_p2_icon"` - One or both players need to select icon
- `"active"` - Game in progress
- `"completed"` - Game over, winner determined

---

## Icon Library (10 Icons, 2 Rows of 5)

HTML icon classes:

    <!-- Row 1 -->
    <i class="hn hn-bullhorn-solid"></i>
    <i class="hn hn-crown-solid"></i>
    <i class="hn hn-heart-solid"></i>
    <i class="hn hn-music-solid"></i>
    <i class="hn hn-question-solid"></i>

    <!-- Row 2 -->
    <i class="hn hn-trash-alt-solid"></i>
    <i class="hn hn-face-thinking-solid"></i>
    <i class="hn hn-eye-solid"></i>
    <i class="hn hn-people-carry-solid"></i>
    <i class="hn hn-star-crescent-solid"></i>

**Icon Colors:**

- Friend (Max, player1) icons: PRIMARY color
- Admin (Forest, player2) icons: SECONDARY color

---

## Mutations & Queries (Use Existing)

Keep the existing query hooks from `queries.ts`:

- `useTicTacToeGame(friendId)` - Fetch game data
- `useMakeMove()` - Handle cell clicks
- `useUpdateIcon()` - Update player icon
- `useResetGame()` - Start new game
- `useGameSubscription()` - Real-time sync

**DO NOT rewrite these.** They work fine. Just use them.

---

## Critical Requirements

### 1. Reference Connect Four

Before writing code, study ConnectFour component:

- How it renders the tile (simple, clean)
- How it opens the modal
- How the modal is structured
- How it handles real-time updates
- Copy the patterns exactly

### 2. Keep UI Clean

**Good:**

- Large, touch-friendly cells (60px × 60px minimum)
- Clear spacing between elements
- Status text is concise ("YOUR TURN", not "It is currently your turn to make a move")
- Icons are large enough to see easily
- PLAY AGAIN button is normal size (not half the widget)

**Bad:**

- Tiny cells that are hard to click
- Cramped layout
- Verbose text
- Oversized buttons
- Inconsistent spacing

### 3. Match Existing Styling

Use the same CSS patterns as other widgets:

- CSS modules (`.module.css` files)
- Theme color variables
- Consistent spacing
- Pixel-art aesthetic (chunky borders, solid colors)

### 4. No Overcomplicated Logic

**Don't:**

- Add extra waiting states
- Make players sit in limbo
- Require both players to do things in exact sequence
- Create deadlock situations

**Do:**

- Show the board as soon as possible
- Let either player pick icon whenever
- Handle asynchronous icon selection gracefully
- Keep state machine simple

### 5. Optimistic Updates

All mutations should:

1. Update UI immediately (optimistic)
2. Sync to database in background
3. Roll back on error
4. Trigger real-time update for opponent

Follow the exact pattern from Connect Four.

### 6. Real-time Sync

Use Supabase Realtime:

- Subscribe to `tic_tac_toe_games` table
- Filter by `friend_id`
- Update React Query cache when changes occur
- Play sound when opponent makes move

Follow the exact pattern from Connect Four.

---

## Step-by-Step Implementation

1. **Study ConnectFour** (spend 10 minutes reading the code)
2. **Create TicTacToe.tsx** (tile component, very simple)
3. **Create TicTacToeModal.tsx** (all game logic here)
4. **Test icon selection flow** (both players, mid-game changes)
5. **Test game flow** (making moves, winning, resetting)
6. **Test real-time sync** (open two browsers, play game)
7. **Fix all build errors** (`npm run build`)
8. **Fix all lint errors** (`npm run lint`)

---

## Validation Checklist

Before claiming you're done:

- [ ] Build passes (`npm run build`)
- [ ] Lint passes (`npm run lint`)
- [ ] Tile shows game state correctly
- [ ] Clicking tile opens modal
- [ ] Modal shows icon selector if needed
- [ ] Both players can pick icons without deadlock
- [ ] Board shows whose turn it is
- [ ] Cells are clickable only on your turn
- [ ] Oldest piece shows 50% opacity when you have 3 pieces
- [ ] Win condition detected correctly
- [ ] Winning cells highlighted
- [ ] PLAY AGAIN works and loser goes first
- [ ] Settings cog allows mid-game icon changes
- [ ] Real-time updates work (test with two browsers)
- [ ] UI looks clean and matches other widgets
- [ ] No console errors
- [ ] No unused imports/variables
- [ ] Colors are correct (Friend=primary, Admin=secondary)

---

## Common Mistakes to Avoid

1. **Making tile interactive** - Tile should just be a preview, no game logic
2. **Oversized buttons** - Keep buttons normal size
3. **Cramped layout** - Give elements room to breathe
4. **Verbose text** - Keep it concise
5. **Ignoring Connect Four** - It's your template, use it
6. **Rewriting working code** - Queries are fine, don't touch them
7. **Skipping build/lint checks** - Fix errors as you go
8. **Adding fancy animations** - Keep it simple, add polish later
9. **Wrong colors** - Remember: Friend=primary, Admin=secondary

---

## Final Notes

This is a complete rewrite. Delete the current tic-tac-toe implementation and start fresh.

Use Connect Four as your reference for everything:

- File structure
- Component patterns
- Modal structure
- Styling approach
- Real-time sync
- Optimistic updates

Keep it simple. Make it clean. Test thoroughly.
