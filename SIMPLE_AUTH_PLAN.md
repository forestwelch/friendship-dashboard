# Simple URL-Based User Identification Plan

## Overview

No authentication needed! Use URL paths to distinguish between admin and friend:

- `/daniel` = Friend view page (public, interactive)
- `/admin/daniel` = Admin edit/view page (what you've been using)

## Current State

- ✅ `/admin/[friend]` route exists (admin edit page)
- ✅ `/[friend]` route exists (friend view page)
- ❌ No way to distinguish admin vs friend interactions
- ❌ Connect Four uses hardcoded "you" vs "them"

## What We Need

### 1. URL-Based User Identification

**No authentication needed!** Just check the URL path:

- If URL starts with `/admin/` → Admin user
- If URL is just `/[friend]` → Friend user

**For Connect Four:**

- Admin = person viewing `/admin/daniel`
- Friend = person viewing `/daniel`
- Use `friend.id` as friend identifier
- Use a constant or session-based identifier for admin (or just use "admin" string)

### 2. Database Schema Updates

**Migration: `012_update_connect_four_schema.sql`**

Update Connect Four config structure:

- Change from `"you" | "them"` to user identifiers
- Store `player_one_id` and `player_two_id` (can be UUIDs or strings)
- Track `current_turn_id` (whose turn it is)
- Coin flip to determine starting player

**New Connect Four Config:**

```typescript
{
  board: Board,
  player_one_id: string,  // "admin" or friend.id
  player_two_id: string,  // friend.id or "admin"
  current_turn_id: string, // Which player's turn
  player_one_color: "⚫",
  player_two_color: "⚪",
  status: "active" | "won" | "lost" | "draw",
  winner_id?: string,  // Who won
  moves: [{ player_id: string, column: number, timestamp: string }]
}
```

### 3. User Context Hook

**File: `lib/use-user-context.ts` (NEW)**

```typescript
export function useUserContext() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin/") ?? false;
  const userType: "admin" | "friend" = isAdmin ? "admin" : "friend";
  const userId = isAdmin ? "admin" : null; // Will be set per friend page

  return {
    isAdmin,
    userType,
    userId, // For admin, this is 'admin'. For friend, we'll use friend.id
  };
}
```

### 4. Connect Four Updates

**Files to update:**

1. **`lib/queries-connect-four.ts`**:
   - Update `ConnectFourData` interface
   - Update `useMakeMove` to check current user ID
   - Add coin flip logic for starting player
   - Update game initialization

2. **`components/widgets/ConnectFour.tsx`**:
   - Use `useUserContext()` to determine if it's "your turn"
   - Show correct player colors based on current user

3. **`components/widgets/ConnectFourModal.tsx`**:
   - Show "YOUR TURN" vs "THEIR TURN" based on current user
   - Disable moves if not your turn
   - Update player display names

### 5. Friend Page Updates

**File: `app/[friend]/page.tsx`**:

- Pass `friendId` to `FriendPageClient`
- Friend page is read-only (no edit mode)

**File: `app/[friend]/FriendPageClient.tsx`**:

- Check if admin route → show edit mode
- Check if friend route → hide edit controls
- Pass `friendId` to Connect Four widgets

**File: `app/admin/[friend]/page.tsx`**:

- This is the admin edit page (already exists)
- Can view/edit everything

## Implementation Steps

### Phase 1: User Context Hook

1. Create `lib/use-user-context.ts`
2. Create `lib/user-context.tsx` (context provider if needed)
3. Test hook returns correct `isAdmin` based on URL

### Phase 2: Database Migration

1. Create migration to update Connect Four config structure
2. Add coin flip logic for starting player
3. Run migration

### Phase 3: Connect Four Updates

1. Update `ConnectFourData` interface
2. Update game initialization (coin flip for starting player)
3. Update move validation to check current user ID
4. Update UI to show correct turn indicators
5. Update player display names

### Phase 4: Friend Page Read-Only Mode

1. Update `/[friend]/FriendPageClient.tsx` to hide edit controls
2. Ensure friend can still interact with widgets (mood, events, Connect Four)
3. Test friend interactions work correctly

### Phase 5: Admin Page Edit Mode

1. Ensure `/admin/[friend]` shows edit controls
2. Test admin can edit everything
3. Test admin can play Connect Four

## Coin Flip Logic

**When initializing a new Connect Four game:**

```typescript
function initializeGame(friendId: string): ConnectFourData {
  const playerOneId = "admin";
  const playerTwoId = friendId;

  // Coin flip: 50/50 chance
  const coinFlip = Math.random() < 0.5;
  const currentTurnId = coinFlip ? playerOneId : playerTwoId;

  return {
    board: createEmptyBoard(),
    player_one_id: playerOneId,
    player_two_id: playerTwoId,
    current_turn_id: currentTurnId,
    player_one_color: "⚫",
    player_two_color: "⚪",
    status: "active",
    moves: [],
  };
}
```

## User Identification in Connect Four

**When making a move:**

```typescript
function canMakeMove(game: ConnectFourData, currentUserId: string): boolean {
  return game.status === "active" && game.current_turn_id === currentUserId;
}

function makeMove(game: ConnectFourData, column: number, currentUserId: string) {
  if (!canMakeMove(game, currentUserId)) {
    throw new Error("Not your turn!");
  }

  // Make move...
  // Switch turn to other player
  const nextPlayerId =
    game.current_turn_id === game.player_one_id ? game.player_two_id : game.player_one_id;

  // Update game state...
}
```

## Display Names

**In Connect Four UI:**

```typescript
function getPlayerDisplayName(playerId: string, friendName: string): string {
  if (playerId === "admin") {
    return "YOU"; // Or admin's name if we add that later
  }
  return friendName.toUpperCase(); // e.g., "DANIEL"
}

// Usage:
const yourDisplayName = getPlayerDisplayName(currentUserId, friend.name);
const theirDisplayName = getPlayerDisplayName(
  currentUserId === game.player_one_id ? game.player_two_id : game.player_one_id,
  friend.name
);
```

## Migration Strategy

**For existing Connect Four games:**

1. Check if game has old format (`current_turn: "you" | "them"`)
2. Convert to new format:
   - `"you"` → `player_one_id` (admin)
   - `"them"` → `player_two_id` (friend)
3. Update all moves to use `player_id` instead of `player`

## Testing Checklist

- [ ] Friend visits `/daniel` → sees read-only dashboard
- [ ] Friend can interact with widgets (mood, events, Connect Four)
- [ ] Admin visits `/admin/daniel` → sees edit controls
- [ ] Admin can edit widgets
- [ ] Connect Four coin flip works (test multiple times)
- [ ] Connect Four shows correct "YOUR TURN" / "THEIR TURN"
- [ ] Connect Four prevents moves when not your turn
- [ ] Connect Four real-time sync works between admin and friend
- [ ] Winner detection works correctly
- [ ] Play again resets game with new coin flip

## Benefits of This Approach

1. ✅ **No authentication complexity** - Just URL routing
2. ✅ **Easy to share** - Friend just visits `/daniel`
3. ✅ **Simple to implement** - No auth system needed
4. ✅ **Clear separation** - Admin vs friend is obvious from URL
5. ✅ **Works immediately** - No sign-up required

## Future Enhancements (Optional)

- Add admin name/identifier (currently just "admin")
- Add friend authentication later if needed
- Add multiple admins support
- Add friend-specific settings/permissions
