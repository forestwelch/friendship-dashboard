# User Authentication & Multi-User Connect Four Implementation Plan

## Overview

We need to implement:

1. **Authentication system** - Admin signs in, friends can view their dashboards
2. **User identification** - Determine who is viewing/interacting
3. **Multi-user Connect Four** - Two players (admin + friend) can play together

## Current State

- ✅ Supabase Auth is configured but not used
- ✅ Friend pages exist (`/[friend]` route)
- ✅ Connect Four widget exists but uses hardcoded "you" vs "them"
- ❌ No user authentication
- ❌ No way to identify current user
- ❌ Friends table not linked to admin user

## What We Need

### 1. Database Schema Updates

**Migration: `012_add_user_auth.sql`**

- Link `friends` table to admin user (creator)
- Add `created_by_user_id UUID REFERENCES auth.users(id)` to `friends` table
- Update Connect Four config to store actual user IDs instead of "you"/"them"
  - Change `current_turn` from `"you" | "them"` to `user_id UUID`
  - Add `player_one_user_id` and `player_two_user_id` to track who is playing
  - Update `moves` to include `user_id` instead of `"you" | "them"`

### 2. Authentication System

**Files to create:**

- `app/auth/signin/page.tsx` - Sign in page
- `app/auth/signup/page.tsx` - Sign up page (optional, or admin-only)
- `lib/auth-context.tsx` - User context provider
- `lib/auth-utils.ts` - Auth helper functions
- `app/api/auth/[...supabase]/route.ts` - Supabase auth route handler

**Files to update:**

- `app/layout.tsx` - Wrap app with AuthProvider
- `lib/supabase.ts` - Enable auth session persistence
- `components/Navigation.tsx` - Add sign in/out button

### 3. User Identification Logic

**Determine user role:**

- **Admin (creator)**: Logged in user who created the friend
- **Friend (viewer)**: Visiting `/daniel` without being logged in, or logged in as someone else
- **Current user**: The person currently viewing/interacting

**For Connect Four:**

- `player_one_user_id` = Admin (creator of the friend)
- `player_two_user_id` = Friend (the friend themselves)
- `current_turn` = Which user_id's turn it is
- When making a move, check if `current_turn === current_user_id`

### 4. Connect Four Updates

**Files to update:**

- `lib/queries-connect-four.ts`:
  - Update `ConnectFourData` interface to use `user_id` instead of `"you" | "them"`
  - Update `useMakeMove` to check current user ID
  - Update game initialization to set player IDs
- `components/widgets/ConnectFour.tsx`:
  - Determine if it's "your turn" based on current user ID
  - Show correct player colors based on who is viewing
- `components/widgets/ConnectFourModal.tsx`:
  - Show "YOUR TURN" vs "THEIR TURN" based on current user
  - Disable moves if not your turn
  - Update player display names

### 5. Protected Routes

**Admin routes** (require authentication):

- `/admin/*` - All admin pages
- API routes that modify data

**Public routes** (no auth required):

- `/[friend]` - Friend dashboard pages
- API routes that read data (with RLS)

### 6. API Route Updates

**Files to update:**

- `app/api/widgets/[friendId]/route.ts`:
  - Check if user is admin (created the friend) before allowing updates
  - Allow reads for anyone
- `app/api/friends/[slug]/route.ts`:
  - Check auth for updates
  - Allow reads for anyone

## Implementation Steps

### Phase 1: Database Schema

1. Create migration to add `created_by_user_id` to `friends`
2. Create migration to update Connect Four config structure
3. Run migrations

### Phase 2: Authentication Setup

1. Install `@supabase/auth-helpers-nextjs` or use Supabase client auth
2. Create auth context provider
3. Create sign in page
4. Update layout to include auth provider
5. Add sign in/out to navigation

### Phase 3: User Identification

1. Create hook `useCurrentUser()` to get current user
2. Create hook `useIsAdmin(friendId)` to check if user created friend
3. Update friend page to determine viewer role

### Phase 4: Connect Four Multi-User

1. Update Connect Four data structure to use user IDs
2. Update game initialization to assign player IDs
3. Update move validation to check current user
4. Update UI to show correct turn indicators
5. Test with two different users

### Phase 5: Protected Routes

1. Add middleware to protect admin routes
2. Update API routes to check authentication
3. Add error handling for unauthorized access

## Database Schema Changes

### Friends Table

```sql
ALTER TABLE friends
ADD COLUMN created_by_user_id UUID REFERENCES auth.users(id);
```

### Connect Four Config Structure

**Old:**

```typescript
{
  board: Board,
  current_turn: "you" | "them",
  your_color: "⚫",
  their_color: "⚪",
  status: "active" | "won" | "lost" | "draw",
  moves: [{ player: "you" | "them", column: number, timestamp: string }]
}
```

**New:**

```typescript
{
  board: Board,
  player_one_user_id: UUID,  // Admin (creator)
  player_two_user_id: UUID,  // Friend
  current_turn_user_id: UUID, // Whose turn it is
  player_one_color: "⚫",
  player_two_color: "⚪",
  status: "active" | "won" | "lost" | "draw",
  winner_user_id?: UUID,  // Who won (if status is "won")
  moves: [{ user_id: UUID, column: number, timestamp: string }]
}
```

## User Flow Examples

### Admin Flow

1. Admin signs in at `/auth/signin`
2. Admin goes to `/admin/friends` to create/edit friends
3. Admin creates dashboard for "daniel"
4. Admin can play Connect Four as player_one

### Friend Flow

1. Friend visits `mysite.com/daniel` (no login required)
2. Friend sees their dashboard
3. Friend clicks Connect Four widget
4. If it's their turn, they can make a move
5. Friend sees "YOUR TURN" or "THEIR TURN" based on current state

### Connect Four Game Flow

1. Admin creates Connect Four widget for friend "daniel"
2. Game initializes with:
   - `player_one_user_id` = admin's user ID
   - `player_two_user_id` = friend's user ID (or null if friend not logged in)
   - `current_turn_user_id` = admin (starts first)
3. Admin makes move → `current_turn_user_id` switches to friend
4. Friend visits page → sees "YOUR TURN" → makes move
5. Game continues until win/draw

## Open Questions

1. **Friend Authentication**: Should friends need to sign in, or can they play anonymously?
   - **Option A**: Friends can play without signing in (use friend's slug as identifier)
   - **Option B**: Friends must sign in to play (more secure, better tracking)
   - **Recommendation**: Start with Option A, add Option B later

2. **Player Identification for Anonymous Friends**: If friend doesn't sign in, how do we identify them?
   - Use `friend_id` as the identifier
   - Store `player_two_user_id` as the friend's UUID (from friends table)
   - When friend makes move, use `friend.id` instead of `user.id`

3. **Admin Access to Friend Dashboards**: Should admin be able to view/edit friend dashboards?
   - Yes, admin should be able to view and edit
   - Add check: if `current_user_id === friend.created_by_user_id`, show admin controls

4. **Multiple Admins**: Can multiple users create friends?
   - For now: Yes, any authenticated user can create friends
   - Later: Add admin role/permissions system

## Next Steps

1. Review and approve this plan
2. Start with Phase 1 (Database Schema)
3. Implement Phase 2 (Authentication)
4. Test authentication flow
5. Implement Phase 3 & 4 (User ID + Connect Four)
6. Test multi-user Connect Four
7. Add protected routes (Phase 5)
