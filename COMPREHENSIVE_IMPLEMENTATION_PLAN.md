# Comprehensive Implementation Plan
## Complete Implementation Based on Specification & Tooling Strategy Documents

## Overview
Implement 4 new interactive widgets (Mood Tracker, Event Countdown, Personality Quiz, Connect Four) following strict zero-friction principles: no confirmation dialogs, no save buttons, instant optimistic updates. Integrate comprehensive tooling infrastructure (TanStack Query, Zustand, Jest, Playwright, ESLint, Prettier, Husky, Bundle Analyzer, Web Vitals, Sentry) and add mobile responsiveness.

---

## CHECKPOINT ANSWERS (Completed Above)

All 6 checkpoint sections have been answered and validated. Proceeding with implementation plan.

---

## Phase 0: Complete Tooling & Infrastructure Setup

### 0.1 Install All Required Dependencies

**Production Dependencies:**
```bash
npm install @tanstack/react-query@^5.x.x
npm install zustand@^4.x.x
npm install web-vitals
# Note: @sentry/nextjs deferred for now
```

**Dev Dependencies:**
```bash
npm install --save-dev @tanstack/react-query-devtools
npm install --save-dev jest@^29.x.x
npm install --save-dev @testing-library/react@^14.x.x
npm install --save-dev @testing-library/jest-dom@^6.x.x
npm install --save-dev @testing-library/user-event@^14.x.x
npm install --save-dev @playwright/test@^1.x.x  # Already installed, verify version
npm install --save-dev husky@^8.x.x
npm install --save-dev prettier@^3.x.x
npm install --save-dev @typescript-eslint/eslint-plugin@^6.x.x
npm install --save-dev @typescript-eslint/parser@^6.x.x
# Note: @next/bundle-analyzer deferred until later
```

### 0.2 Configure TypeScript Strict Mode

**File: `tsconfig.json`**
- Set `"strict": true`
- Set `"strictNullChecks": true`
- Set `"strictFunctionTypes": true`
- Set `"strictBindCallApply": true`
- Set `"strictPropertyInitialization": true`
- Set `"noImplicitThis": true`
- Set `"noImplicitAny": true`
- Set `"alwaysStrict": true`
- Set `"noImplicitReturns": true`

### 0.3 Configure ESLint

**File: `.eslintrc.json` (UPDATE existing `eslint.config.mjs` or create new)**
```json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "@typescript-eslint/no-explicit-any": "error"
  }
}
```

### 0.4 Configure Prettier

**File: `.prettierrc` (NEW)**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

**File: `.prettierignore` (NEW)**
```
node_modules
.next
dist
build
coverage
```

### 0.5 Setup Husky Pre-commit Hooks

**File: `.husky/pre-commit` (NEW)**
```bash
#!/bin/sh
npm test -- --bail
npm run lint
```

**Commands:**
```bash
npx husky install
npx husky add .husky/pre-commit "npm test -- --bail && npm run lint"
```

### 0.6 Setup TanStack Query Infrastructure

**File: `app/layout.tsx`**
- Wrap app with `QueryClientProvider` (inside ThemeProvider)
- Configure QueryClient with default options:
  - `staleTime: 1000 * 60 * 5` (5 minutes)
  - `gcTime: 1000 * 60 * 10` (10 minutes, formerly cacheTime)
  - `retry: 2` for queries
  - `retry: 1` for mutations
  - `refetchOnWindowFocus: true`
- Add `ReactQueryDevtools` in development mode only

**File: `lib/queries.ts` (refactor existing)**
- Convert ALL existing Supabase queries to TanStack Query hooks:
  - `useFriendPage(friendSlug)` - Query hook
  - `useFriendWidgets(friendId)` - Query hook
  - `useGlobalContent(contentType)` - Query hook
  - `useAllFriends()` - Query hook
- Create mutation hooks with optimistic updates:
  - `useUpdateWidgetConfig()` - Mutation with optimistic update
  - `useSaveLayout()` - Mutation with optimistic update
  - `useUpdateFriendColors()` - Mutation with optimistic update
- All mutations must follow optimistic update pattern (onMutate, onError revert, onSuccess invalidate)

**File: `lib/queries-client.ts` (NEW)**
- Create client-side query hooks that use TanStack Query
- Separate from server-side queries

### 0.7 Setup Zustand for Global UI State

**File: `lib/store/ui-store.ts` (NEW)**
- Create Zustand store for truly global state:
  - `openModal: string | null` - Current open modal ID
  - `setOpenModal(modalId: string | null)` - Function to open/close modals
  - Only for UI state, NOT widget data (use TanStack Query for that)

### 0.8 Remove ALL Confirmation Dialogs

**Files to update:**
- `components/admin/WidgetManager.tsx` - Line 160: Remove `confirm("Delete this widget?")`
  - Replace with instant delete + optimistic update + error revert
  - Pattern: Update local state immediately → playSound('delete') → sync to DB in background → revert on error
- `components/admin/ImageManager.tsx` - Remove any delete confirmations
- `components/admin/FriendManager.tsx` - Remove any delete confirmations
- Search entire codebase for: `confirm(`, `alert(`, "Are you sure", "Delete this"
  - Remove ALL confirmation dialogs
  - Replace with optimistic delete pattern

**Pattern (Required for ALL deletions):**
```typescript
const deleteMutation = useMutation({
  mutationFn: async (id) => {
    // API call to delete
  },
  onMutate: async (id) => {
    await queryClient.cancelQueries({ queryKey: [...] })
    const previousData = queryClient.getQueryData([...])
    queryClient.setQueryData([...], (old) => old.filter(item => item.id !== id))
    playSound('delete')
    return { previousData }
  },
  onError: (err, variables, context) => {
    if (context?.previousData) {
      queryClient.setQueryData([...], context.previousData)
    }
    playSound('error')
  }
})
```

### 0.9 Create Modal Infrastructure

**File: `components/Modal.tsx` (NEW)**
- Full-screen modal component
- X button in top-left (closes modal, plays sound)
- Escape key support (closes modal)
- Backdrop overlay using `var(--game-overlay-bg-80)`
- Mobile-responsive: Full screen on mobile (< 768px), no background visible
- Sound effects: `playSound('open')` on open, `playSound('close')` on close
- Click outside to close (optional, or only X button)
- Focus trap (keyboard navigation stays within modal)
- Scrollable content if > screen height
- Uses theme colors only

**File: `lib/modal-context.tsx` (NEW)**
- Context for managing open modals (or use Zustand store)
- Single modal active at a time (prevents multiple modals)
- `openModal: string | null` state
- `setOpenModal(modalId: string | null)` function

**File: `components/DatePicker.tsx` (NEW)**
- Modal date picker component
- Opens when date input is tapped
- Calendar view OR native date input (mobile)
- Sound effect on selection: `playSound('whoosh')`
- Uses theme colors only

### 0.10 Database Migrations

**File: `supabase/migrations/009_widget_events_table.sql` (NEW)**
- Create `widget_events` table:
  ```sql
  CREATE TABLE widget_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    friend_widget_id UUID NOT NULL REFERENCES friend_widgets(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  ```
- Add indexes:
  ```sql
  CREATE INDEX idx_widget_events_friend_widget_id ON widget_events(friend_widget_id);
  CREATE INDEX idx_widget_events_event_type ON widget_events(event_type);
  CREATE INDEX idx_widget_events_created_at ON widget_events(created_at);
  ```
- Add RLS policies if needed (or disable RLS as per existing pattern)

**File: `supabase/migrations/010_enable_realtime.sql` (NEW)**
- Enable Realtime on `friend_widgets` table:
  ```sql
  ALTER PUBLICATION supabase_realtime ADD TABLE friend_widgets;
  ```
- Add necessary permissions for Realtime subscriptions

### 0.11 Mobile Responsiveness Foundation

**File: `styles/responsive.css` (NEW)**
- Media query breakpoint at 768px
- Grid → Stack transformation utilities
- Mobile-specific spacing adjustments
- Full-width card styles for mobile

**File: `components/Grid.tsx`**
- Add mobile detection using `useMediaQuery` or CSS media queries
- Switch to full-width stacked cards on mobile (< 768px)
- Maintain desktop grid on larger screens (≥ 768px)
- Each widget becomes full-width card, one per row on mobile
- Maintain spacing and styling consistency

**File: `lib/useMediaQuery.ts` (NEW)**
- Custom hook for detecting viewport width
- Returns boolean: `isMobile` (< 768px)

### 0.12 Setup Error Boundaries

**File: `components/ErrorBoundary.tsx` (NEW)**
- React Error Boundary component
- Catches component errors
- Displays user-friendly error message
- Logs errors to console (and Sentry if configured)
- Wrap around each widget in `WidgetRenderer.tsx`

### 0.13 Setup Performance Monitoring

**File: `lib/web-vitals.ts` (NEW)**
- Import `getCLS`, `getFID`, `getFCP`, `getLCP`, `getTTFB` from `web-vitals`
- Create `reportWebVitals` function
- Log performance metrics
- Targets:
  - LCP < 2.5s
  - FID < 100ms
  - CLS < 0.1
  - TTFB < 600ms

**File: `next.config.ts`**
- Bundle Analyzer setup deferred (will be added later)
- Target: Keep JS bundle < 250KB gzipped

### 0.14 Setup Sentry (SKIPPED FOR NOW)

**Note:** Sentry error tracking setup deferred. Can be added later if needed.

### 0.15 Setup Jest Configuration

**File: `jest.config.js` (NEW)**
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

module.exports = createJestConfig(customJestConfig)
```

**File: `jest.setup.js` (NEW)**
```javascript
import '@testing-library/jest-dom'
```

### 0.16 Update Package.json Scripts

**File: `package.json`**
- Add scripts:
  ```json
  {
    "scripts": {
      "test": "jest",
      "test:watch": "jest --watch",
      "test:coverage": "jest --coverage",
      "lint": "eslint .",
      "lint:fix": "eslint . --fix",
      "format": "prettier --write .",
      "format:check": "prettier --check .",
      "analyze": "ANALYZE=true npm run build"
    }
  }
  ```

---

## Phase 1: Mood Tracker Widget

### 1.1 Create Mood Widget Component

**File: `components/widgets/Mood.tsx` (NEW)**
- Implement 1x1, 2x2, 3x3 tile versions
- Props: `size: 1 | 2 | 3`, `friendId: string`, `widgetId: string`, `themeColors: ThemeColors`
- 1x1: Show current emoji, tap to open modal
- 2x2: Current mood + timestamp + history preview
- 3x3: Current mood + last 7 days history
- Use theme colors only (`var(--primary)`, `var(--secondary)`, etc.)
- Memoize with `React.memo`

**File: `components/widgets/Mood.module.css` (NEW)**
- Styles for all three tile sizes
- Mobile responsive styles
- Theme color variables

### 1.2 Create Mood Modal Component

**File: `components/widgets/MoodModal.tsx` (NEW)**
- Full-screen modal with X button
- Emoticon grid (10 emoticons: :D, :), :|, :(, T_T, :P, ;), o_o, >:), ^^)
- Notes input (auto-saves as you type, debounced 300ms)
- Mood history (last 7 days)
- Keyboard navigation:
  - Arrow keys to navigate emoticons
  - Enter to select
  - Escape to close
- Sound effects:
  - `playSound('mood_set')` on emoji selection (cute beep, higher pitch)
  - `playSound('mood_change')` on mood change (ascending tone for positive, descending for negative)
  - `playSound('open')` on modal open
  - `playSound('close')` on modal close
- Mobile: Full-screen modal, emoticon grid horizontal scroll if needed

**File: `components/widgets/MoodModal.module.css` (NEW)**
- Modal styles
- Emoticon grid layout
- Mobile responsive styles

### 1.3 Implement Data Layer

**File: `lib/queries-mood.ts` (NEW)**
- `useMoodWidget(friendId, widgetId)` - Query hook
  - Fetches mood data from `friend_widgets.config`
  - Returns: `{ current_mood, history }`
- `useSetMood()` - Mutation hook with optimistic update
  - Updates `current_mood` in config
  - Adds to history array
  - Optimistic update pattern (onMutate, onError revert, onSuccess invalidate)
- `useUpdateMoodNotes()` - Mutation hook with optimistic update
  - Updates notes in `current_mood`
  - Debounced auto-save
- Store data in `friend_widgets.config` JSONB:
  ```json
  {
    "current_mood": {
      "emoji": ":)",
      "timestamp": "2024-11-23T10:30:00Z",
      "notes": "had good coffee"
    },
    "history": [
      { "emoji": ":D", "timestamp": "...", "notes": "" }
    ]
  }
  ```

### 1.4 Integrate with Widget System

**File: `components/WidgetRenderer.tsx`**
- Add case for `widget_type === "mood"`
- Pass widget config, `themeColors`, and callbacks
- Handle modal opening/closing using Zustand store or context
- Wrap in ErrorBoundary

**File: `components/admin/WidgetLibrary.tsx`**
- Add "Mood Tracker" to widget library
- Icon and description
- Default size: 2x2

### 1.5 Testing

**File: `components/widgets/__tests__/Mood.test.tsx` (NEW)**
- Unit tests for Mood component (all sizes)
- Test rendering of current mood
- Test modal opening on tap
- Test mobile responsive behavior

**File: `components/widgets/__tests__/MoodModal.test.tsx` (NEW)**
- Unit tests for MoodModal component
- Test emoticon selection
- Test notes input auto-save
- Test keyboard navigation
- Test sound effects triggered

**File: `lib/__tests__/queries-mood.test.ts` (NEW)**
- Integration tests for mood setting flow
- Test optimistic updates
- Test error recovery (revert on failure)
- Test history management

**File: `e2e/mood-widget.spec.ts` (NEW)**
- E2E test: Complete mood setting flow
- E2E test: Notes auto-save
- E2E test: Mobile responsive behavior

---

## Phase 2: Event Countdown Widget

### 2.1 Create Event Widget Component

**File: `components/widgets/EventCountdown.tsx` (NEW)**
- 1x1: Days until next event
- 2x2: Next event details (name, emoji, date, days)
- 3x3: List of upcoming events (sorted by date)
- Real-time countdown updates (use `useEffect` with interval)
- Use theme colors only
- Memoize with `React.memo`

**File: `components/widgets/EventCountdown.module.css` (NEW)**
- Styles for all three tile sizes
- Mobile responsive styles
- Countdown animation styles

### 2.2 Create Event Modal Component

**File: `components/widgets/EventCountdownModal.tsx` (NEW)**
- Full-screen modal with X button
- Create/Edit event form:
  - Event name input (auto-saves as you type, debounced 300ms)
  - Date picker (opens DatePicker modal on tap)
  - Emoji selector (quick select: 🎸 🎬 🎤 🍕 ✈️ 🎭)
  - Description input (auto-saves as you type, optional)
- Event list at bottom (tap to edit)
- DELETE button (no confirmation, instant delete)
- Sound effects:
  - `playSound('ping')` on field focus
  - `playSound('whoosh')` on date selection
  - `playSound('delete')` on delete (descending tone)
  - `playSound('event_save')` on save (ascending tone)
- Mobile: Full-screen modal with scrollable event list

**File: `components/widgets/EventCountdownModal.module.css` (NEW)**
- Modal styles
- Form styles
- Event list styles
- Mobile responsive styles

### 2.3 Implement Data Layer

**File: `lib/queries-events.ts` (NEW)**
- `useEventCountdownWidget(friendId, widgetId)` - Query hook
  - Fetches events array from `friend_widgets.config`
  - Returns: `{ events: Event[] }`
- `useCreateEvent()` - Mutation with optimistic update
  - Adds new event to events array
  - Optimistic update pattern
- `useUpdateEvent()` - Mutation with optimistic update
  - Updates existing event in array
  - Optimistic update pattern
- `useDeleteEvent()` - Mutation with optimistic update + revert on error
  - Removes event from array
  - Optimistic update with revert on failure
- Store events array in `friend_widgets.config` JSONB:
  ```json
  {
    "events": [
      {
        "id": "event_1",
        "name": "concert",
        "date": "2025-03-15",
        "emoji": "🎸",
        "description": "we've been planning this forever!",
        "created_at": "2024-11-23"
      }
    ]
  }
  ```

### 2.4 Date Picker Component

**File: `components/DatePicker.tsx` (NEW)**
- Modal date picker component
- Opens when date input is tapped
- Calendar view OR native date input (mobile)
- Sound effect on selection: `playSound('whoosh')`
- Uses theme colors only
- Mobile-optimized touch targets

**File: `components/DatePicker.module.css` (NEW)**
- Calendar styles
- Mobile date input styles

### 2.5 Integrate with Widget System

**File: `components/WidgetRenderer.tsx`**
- Add case for `widget_type === "event_countdown"`
- Pass widget config, `themeColors`, and callbacks
- Handle modal opening/closing
- Wrap in ErrorBoundary

**File: `components/admin/WidgetLibrary.tsx`**
- Add "Event Countdown" to widget library
- Icon and description
- Default size: 2x2

### 2.6 Testing

**File: `components/widgets/__tests__/EventCountdown.test.tsx` (NEW)**
- Unit tests for EventCountdown component
- Test countdown calculations
- Test event display (1x1, 2x2, 3x3)
- Test mobile responsive behavior

**File: `components/widgets/__tests__/EventCountdownModal.test.tsx` (NEW)**
- Unit tests for EventCountdownModal component
- Test event creation/deletion (no confirmation)
- Test auto-save on input
- Test date picker integration
- Test keyboard navigation

**File: `lib/__tests__/queries-events.test.ts` (NEW)**
- Integration tests for event CRUD operations
- Test optimistic updates
- Test error recovery (revert on failure)
- Test event sorting by date

**File: `e2e/event-countdown.spec.ts` (NEW)**
- E2E test: Complete event creation flow
- E2E test: Event deletion (no confirmation)
- E2E test: Mobile date picker

---

## Phase 3: Personality Quiz Widget

### 3.1 Create Quiz Widget Component

**File: `components/widgets/PersonalityQuiz.tsx` (NEW)**
- 1x1: Your emoji / Their emoji (side by side)
- 2x2: Your vibe + Their vibe with titles
- 3x3: Both results + compatibility percentage + bar
- Show "Waiting for them..." if quiz not completed
- Use theme colors only
- Memoize with `React.memo`

**File: `components/widgets/PersonalityQuiz.module.css` (NEW)**
- Styles for all three tile sizes
- Mobile responsive styles
- Compatibility bar styles

### 3.2 Create Quiz Modal Component

**File: `components/widgets/PersonalityQuizModal.tsx` (NEW)**
- Two modes: Quiz taking mode, Results mode
- Quiz mode:
  - Progress indicator (Question X of 8)
  - Progress bar (visual indicator)
  - Question text
  - 3 option buttons (full-width on mobile)
  - Auto-advance on selection
  - Keyboard navigation:
    - Arrow keys to navigate options
    - Enter to select
    - Escape to close
- Results mode:
  - Your result display (emoji, title, description)
  - Compatibility section (their result, compatibility note)
  - RETAKE QUIZ button
- Sound effects:
  - `playSound('quiz_advance')` on question advance (soft "ding")
  - `playSound('quiz_results')` on results reveal (magical ascending tone)
  - `playSound('retake')` on retake (reset/restart sound)
- Mobile: Full-screen modal, questions adapt to width

**File: `components/widgets/PersonalityQuizModal.module.css` (NEW)**
- Quiz mode styles
- Results mode styles
- Progress bar styles
- Mobile responsive styles

### 3.3 Quiz Questions & Logic

**File: `lib/quiz-questions.ts` (NEW)**
- 8 custom questions (as specified in spec):
  1. When faced with a problem, do you... (Rush in / Think first / Ask for help)
  2. At parties, you're the person who... (Works the room / Finds deep conversation / Bounces around)
  3. When something breaks, you... (Fix it yourself / Research first / Call someone)
  4. Your ideal free evening is... (Out with friends / Alone with hobbies / Depends on mood)
  5. Trying something new, you... (Jump in / Research first / Need a friend)
  6. When you disagree with someone... (Speak up / Process first / Find middle ground)
  7. Your vibe is... (Bright & bold / Quiet & cozy / Whatever feels right)
  8. Next year, you want to... (Have adventures / Complete a project / Be happy)
- Result calculation logic:
  - Mostly A's → ☀️ THE SUN (bright, energetic, social)
  - Mostly B's → 🌙 THE MOON (introspective, creative, contemplative)
  - Mostly C's → ⭐ THE STAR (balanced, flexible, adaptable)
  - Mixed → Combinations (Sun+Moon = Eclipse, etc.)
- Compatibility notes (hardcoded or computed from answer combinations)

**File: `lib/quiz-logic.ts` (NEW)**
- `calculateResult(answers: string[]): QuizResult`
- `calculateCompatibility(yourResult: QuizResult, theirResult: QuizResult): CompatibilityNote`
- Unit test these functions (100% coverage)

### 3.4 Implement Data Layer

**File: `lib/queries-quiz.ts` (NEW)**
- `usePersonalityQuizWidget(friendId, widgetId)` - Query hook
  - Fetches quiz data from `friend_widgets.config`
  - Returns: `{ your_result, their_result, compatibility_note }`
- `useSubmitQuizAnswers()` - Mutation with optimistic update
  - Calculates result from answers
  - Updates `your_result` in config
  - Optimistic update pattern
- Store quiz data in `friend_widgets.config` JSONB:
  ```json
  {
    "your_result": {
      "emoji": "🌙",
      "title": "The Moon",
      "description": "Nocturnal & introspective...",
      "answers": ["a", "b", "b", "b", "c", "b", "b", "c"],
      "completed_at": "2024-11-23T10:30:00Z"
    },
    "their_result": {
      "emoji": "☀️",
      "title": "The Sun",
      "description": "Bright & energetic...",
      "answers": ["a", "a", "a", "a", "a", "a", "a", "a"],
      "completed_at": "2024-11-22T14:15:00Z"
    },
    "compatibility_note": "You balance each other perfectly..."
  }
  ```

### 3.5 Integrate with Widget System

**File: `components/WidgetRenderer.tsx`**
- Add case for `widget_type === "personality_quiz"`
- Handle quiz state (not started, in progress, completed)
- Pass widget config, `themeColors`, and callbacks
- Wrap in ErrorBoundary

**File: `components/admin/WidgetLibrary.tsx`**
- Add "Personality Quiz" to widget library
- Icon and description
- Default size: 3x3

### 3.6 Testing

**File: `lib/__tests__/quiz-logic.test.ts` (NEW)**
- Unit tests for quiz logic (result calculation)
- Test all result types (Sun, Moon, Star, Mixed)
- Test compatibility calculations
- 100% coverage required

**File: `components/widgets/__tests__/PersonalityQuiz.test.tsx` (NEW)**
- Unit tests for PersonalityQuiz component
- Test "waiting for them" state
- Test result display (all tile sizes)
- Test mobile responsive behavior

**File: `components/widgets/__tests__/PersonalityQuizModal.test.tsx` (NEW)**
- Unit tests for PersonalityQuizModal component
- Test quiz flow (8 questions → results)
- Test retake functionality
- Test keyboard navigation

**File: `e2e/personality-quiz.spec.ts` (NEW)**
- E2E test: Complete quiz flow
- E2E test: Results display
- E2E test: Retake functionality

---

## Phase 4: Connect Four Widget

### 4.1 Create Connect Four Widget Component

**File: `components/widgets/ConnectFour.tsx` (NEW)**
- 1x1: Your color / Their color + "YOUR TURN" or "THEIR TURN"
- 2x2: Mini board preview + turn indicator
- 3x3: Full board preview + turn indicator
- Use theme colors for pieces (⚫ ⚪)
- Memoize with `React.memo`

**File: `components/widgets/ConnectFour.module.css` (NEW)**
- Styles for all three tile sizes
- Mini board preview styles
- Mobile responsive styles

### 4.2 Create Game Board Modal

**File: `components/widgets/ConnectFourModal.tsx` (NEW)**
- Full-screen game board
- 7 columns × 6 rows board
- Column numbers (1-7) tappable
- Turn indicator (YOUR TURN / Waiting for [friend])
- Move history display
- Game states:
  - Your turn: Columns enabled, hover shows ghost piece
  - Their turn: Columns disabled, waiting message
  - Win/Loss/Draw: Celebration screen + PLAY AGAIN button
- Animations:
  - Piece drop (gravity/acceleration animation)
  - Winning row flash/glow
  - Win celebration: Pieces shake, small stars appear
- Sound effects:
  - `playSound('game_drop')` on piece drop (satisfying "plunk")
  - `playSound('game_hover')` on column hover (subtle "bloop")
  - `playSound('game_win')` on win (celebration fanfare, 8-bit style)
  - `playSound('game_lose')` on loss (sad trombone, 8-bit style)
  - `playSound('game_draw')` on draw (neutral tone)
- Mobile: Board fills screen, scrolls for status if needed

**File: `components/widgets/ConnectFourModal.module.css` (NEW)**
- Game board styles
- Piece styles and animations
- Win/loss/draw screen styles
- Mobile responsive styles

### 4.3 Game Logic

**File: `lib/connect-four-logic.ts` (NEW)**
- Board state management (7×6 array)
- `makeMove(board: Board, column: number, player: 'you' | 'them'): Board`
- `checkWin(board: Board, player: 'you' | 'them'): boolean`
  - Horizontal win detection
  - Vertical win detection
  - Diagonal win detection (both directions)
- `checkDraw(board: Board): boolean`
- `validateMove(board: Board, column: number): boolean` (column not full)
- `calculateDropRow(board: Board, column: number): number`
- Unit test these functions (100% coverage)

### 4.4 Real-time Game Sync

**File: `lib/queries-connect-four.ts` (NEW)**
- `useConnectFourGame(friendId, widgetId)` - Query hook
  - Fetches game state from `friend_widgets.config`
  - Returns: `{ board, current_turn, your_color, their_color, status, moves }`
- `useMakeMove()` - Mutation with optimistic update
  - Updates board state immediately
  - Validates move client-side
  - Checks for win/draw
  - Optimistic update pattern
- `useGameSubscription()` - Supabase Realtime subscription
  - Subscribe to `friend_widgets` table updates
  - Filter: `id=eq.${widgetId}`
  - Listen for UPDATE events
  - Update board when opponent makes move
  - Play sound on opponent move: `playSound('opponent_move')`
  - Update TanStack Query cache
- Store game state in `friend_widgets.config` JSONB:
  ```json
  {
    "board": [
      [null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null],
      [null, null, null, "you", null, null, null],
      [null, null, null, "them", null, null, null],
      [null, "you", "them", "them", null, null, null],
      ["you", "them", "them", "you", "you", null, null]
    ],
    "current_turn": "you",
    "your_color": "⚫",
    "their_color": "⚪",
    "status": "active",
    "moves": [
      { "player": "you", "column": 1, "timestamp": "..." },
      { "player": "them", "column": 4, "timestamp": "..." }
    ],
    "last_updated": "2024-11-23T10:30:00Z"
  }
  ```

### 4.5 Supabase Realtime Setup

**File: `supabase/migrations/010_enable_realtime.sql` (NEW)**
- Enable Realtime on `friend_widgets` table:
  ```sql
  ALTER PUBLICATION supabase_realtime ADD TABLE friend_widgets;
  ```
- Add necessary permissions for Realtime subscriptions

### 4.6 Integrate with Widget System

**File: `components/WidgetRenderer.tsx`**
- Add case for `widget_type === "connect_four"`
- Handle game state (active, won, lost, draw)
- Pass widget config, `themeColors`, and callbacks
- Wrap in ErrorBoundary

**File: `components/admin/WidgetLibrary.tsx`**
- Add "Connect Four" to widget library
- Icon and description
- Default size: 3x3

### 4.7 Testing

**File: `lib/__tests__/connect-four-logic.test.ts` (NEW)**
- Unit tests for game logic (win detection, move validation)
- Test all win conditions (horizontal, vertical, diagonal)
- Test draw detection
- Test move validation
- 100% coverage required

**File: `components/widgets/__tests__/ConnectFour.test.tsx` (NEW)**
- Unit tests for ConnectFour component
- Test turn indicator
- Test board preview (all tile sizes)
- Test mobile responsive behavior

**File: `components/widgets/__tests__/ConnectFourModal.test.tsx` (NEW)**
- Unit tests for ConnectFourModal component
- Test piece drop animation
- Test win/loss/draw states
- Test keyboard navigation
- Test real-time sync (mock Supabase Realtime)

**File: `lib/__tests__/queries-connect-four.test.ts` (NEW)**
- Integration tests for game moves
- Test optimistic updates (move appears instantly)
- Test error recovery (revert on sync failure)
- Test real-time subscription (mock)

**File: `e2e/connect-four.spec.ts` (NEW)**
- E2E test: Complete game flow
- E2E test: Win condition
- E2E test: Mobile board layout

---

## Phase 5: Mobile Responsiveness

### 5.1 Grid System Mobile Adaptation

**File: `components/Grid.tsx`**
- Detect viewport width (< 768px = mobile)
- Switch from grid to full-width stacked cards
- Each widget takes full width, one per row
- Maintain spacing and styling
- Use `useMediaQuery` hook or CSS media queries

### 5.2 Widget Mobile Adaptations

**All widget components:**
- Mood: Emoticon grid horizontal scroll if needed, min 44px touch targets
- Event: Date picker adapted for mobile date input, full-width form fields
- Quiz: Questions fill width, options are full-width buttons, min 44px touch targets
- Connect Four: Board fills screen width, scrolls for status if needed, column numbers min 44px

### 5.3 Modal Mobile Adaptations

**File: `components/Modal.tsx`**
- Full-screen on mobile (no background visible)
- Touch targets minimum 44px
- Scrollable content if > screen height
- Close button accessible (top-left, min 44px)

### 5.4 Testing

**File: `e2e/mobile-responsive.spec.ts` (NEW)**
- E2E test: All widgets on mobile viewport (< 768px)
- E2E test: Modals on mobile
- E2E test: Touch interactions
- E2E test: Grid → Stack transformation

---

## Phase 6: Polish & Optimization

### 6.1 Sound Effects Enhancement

**File: `lib/sounds.ts` (UPDATE existing)**
- Extend existing `playSound` function (already uses Web Audio API)
- Update function signature to include new types:
  ```typescript
  export function playSound(
    type: "click" | "success" | "error" | "pop" | "blip" | "move" | "select" | "cancel" | "open" | "close" | "hover" | "upload" | "delete" | "focus" | "navigate" | "mood_set" | "mood_change" | "event_save" | "quiz_advance" | "quiz_results" | "retake" | "game_drop" | "game_hover" | "game_win" | "game_lose" | "game_draw" | "opponent_move" | "whoosh" | "ping"
  )
  ```
- Add new sound types to the `sounds` Record:
  - `mood_set`: { frequency: 900, duration: 0.08, type: "square" } (cute beep, higher pitch)
  - `mood_change`: { frequency: 600, duration: 0.2, type: "sine" } (ascending tone for positive, descending for negative)
  - `event_save`: { frequency: 650, duration: 0.15, type: "sine" } (ascending tone)
  - `quiz_advance`: { frequency: 550, duration: 0.1, type: "sine" } (soft "ding")
  - `quiz_results`: { frequency: 800, duration: 0.3, type: "sine" } (magical ascending tone)
  - `retake`: { frequency: 400, duration: 0.1, type: "sawtooth" } (reset/restart sound)
  - `game_drop`: { frequency: 500, duration: 0.12, type: "square" } (satisfying "plunk")
  - `game_hover`: { frequency: 450, duration: 0.05, type: "square" } (subtle "bloop")
  - `game_win`: { frequency: 800, duration: 0.5, type: "square" } (celebration fanfare, 8-bit style)
  - `game_lose`: { frequency: 200, duration: 0.4, type: "sawtooth" } (sad trombone, 8-bit style)
  - `game_draw`: { frequency: 400, duration: 0.15, type: "sine" } (neutral tone)
  - `opponent_move`: { frequency: 600, duration: 0.1, type: "square" } (notification sound)
  - `whoosh`: { frequency: 700, duration: 0.15, type: "sine" } (date selection)
  - `ping`: { frequency: 500, duration: 0.05, type: "square" } (field focus - can reuse existing "focus" sound)
- Ensure all interactions have sounds

### 6.2 Animation Polish

**File: `styles/animations.css` (NEW)**
- Smooth transitions (< 300ms)
- Piece drop animation (Connect Four) - CSS keyframes
- Winning row flash animation
- Celebration animations (stars, shake)
- Modal open/close animations

### 6.3 Error Handling

**File: `components/ErrorBoundary.tsx` (UPDATE)**
- Error boundaries around each widget
- Graceful error recovery (revert optimistic updates)
- User-friendly error messages
- Sound on errors: `playSound('error')`
- Log errors to console (Sentry deferred)

**File: `lib/error-handling.ts` (NEW)**
- Centralized error handling utilities
- Error logging functions (console for now, Sentry deferred)
- Error recovery patterns

### 6.4 Performance Optimization

**File: `components/WidgetRenderer.tsx`**
- Memoize widget components (`React.memo`)
- Code split modals (dynamic imports):
  ```typescript
  const MoodModal = dynamic(() => import('./widgets/MoodModal'), {
    loading: () => <div>Loading...</div>,
  })
  ```
- Optimize re-renders (`useCallback`, `useMemo`)
- Bundle size analysis (run `npm run analyze`)

### 6.5 Accessibility

**File: `components/widgets/Mood.tsx` (and all widgets)**
- Keyboard navigation (all widgets)
- ARIA labels where needed
- Semantic HTML
- Focus management in modals
- Screen reader support

---

## Phase 7: Testing & Validation

### 7.1 Unit Tests

**Coverage Goals:**
- All widget components: 80%+ coverage
- Game logic functions: 100% coverage
- Quiz calculation logic: 100% coverage
- Utility functions: 100% coverage

**Test Files:**
- `components/widgets/__tests__/Mood.test.tsx`
- `components/widgets/__tests__/MoodModal.test.tsx`
- `components/widgets/__tests__/EventCountdown.test.tsx`
- `components/widgets/__tests__/EventCountdownModal.test.tsx`
- `components/widgets/__tests__/PersonalityQuiz.test.tsx`
- `components/widgets/__tests__/PersonalityQuizModal.test.tsx`
- `components/widgets/__tests__/ConnectFour.test.tsx`
- `components/widgets/__tests__/ConnectFourModal.test.tsx`
- `lib/__tests__/queries-mood.test.ts`
- `lib/__tests__/queries-events.test.ts`
- `lib/__tests__/queries-quiz.test.ts`
- `lib/__tests__/queries-connect-four.test.ts`
- `lib/__tests__/quiz-logic.test.ts`
- `lib/__tests__/connect-four-logic.test.ts`

### 7.2 Integration Tests

**Test Files:**
- Widget data flow (query → component → mutation)
- Optimistic updates (instant UI, background sync)
- Error recovery (revert on failure)
- Real-time sync (Connect Four)

### 7.3 E2E Tests (Playwright)

**Test Files:**
- `e2e/mood-widget.spec.ts`
- `e2e/event-countdown.spec.ts`
- `e2e/personality-quiz.spec.ts`
- `e2e/connect-four.spec.ts`
- `e2e/mobile-responsive.spec.ts`

**Test Coverage:**
- Complete user flows for each widget
- Mobile responsiveness
- Cross-browser testing (Chromium, Firefox, WebKit)

### 7.4 Manual Testing Checklist

**Before Shipping:**
- [ ] No confirmation dialogs anywhere
- [ ] No save buttons anywhere
- [ ] All interactions have sound effects
- [ ] Keyboard navigation works
- [ ] Mobile responsive (< 768px)
- [ ] Optimistic updates work
- [ ] Error recovery works
- [ ] Real-time sync works (Connect Four)
- [ ] All widgets use theme colors only
- [ ] Error boundaries catch errors gracefully
- [ ] Performance metrics meet targets (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- [ ] Bundle size < 250KB gzipped

---

## Implementation Notes

### Data Storage Pattern

All widget data stored in `friend_widgets.config` JSONB column:

```typescript
// Mood
config: {
  current_mood: { emoji: ":)", timestamp: "...", notes: "..." },
  history: [...]
}

// Event Countdown
config: {
  events: [
    { id: "...", name: "...", date: "...", emoji: "...", description: "..." }
  ]
}

// Personality Quiz
config: {
  your_result: { emoji: "...", title: "...", description: "...", answers: [...] },
  their_result: { ... },
  compatibility_note: "..."
}

// Connect Four
config: {
  board: [[...], [...]],
  current_turn: "you" | "them",
  your_color: "⚫",
  their_color: "⚪",
  status: "active" | "won" | "lost" | "draw",
  moves: [...]
}
```

### Optimistic Update Pattern (Required for All Mutations)

```typescript
const mutation = useMutation({
  mutationFn: async (data) => {
    // API call
  },
  onMutate: async (newData) => {
    // Cancel queries
    await queryClient.cancelQueries({ queryKey: [...] })
    
    // Snapshot old data
    const previousData = queryClient.getQueryData([...])
    
    // Optimistic update (instant UI)
    queryClient.setQueryData([...], newData)
    playSound('success')
    
    return { previousData }
  },
  onError: (err, variables, context) => {
    // Revert on failure
    if (context?.previousData) {
      queryClient.setQueryData([...], context.previousData)
    }
    playSound('error')
  },
  onSuccess: () => {
    // Invalidate to ensure sync
    queryClient.invalidateQueries({ queryKey: [...] })
  }
})
```

### Mobile Breakpoint

- Desktop: ≥ 768px (grid layout)
- Mobile: < 768px (stacked cards)

### Grid System Clarification

- Current codebase: 6 columns × 8 rows (matches spec)
- Tile size: 80px × 80px
- Gap: 8px
- Widget sizes: 1x1, 2x2, 3x3

### Widget Checklist (Before Shipping Each Widget)

- [ ] **TypeScript:** All types defined, strict mode passes
- [ ] **Testing:** Unit tests written (80%+ coverage)
- [ ] **Performance:** No unnecessary re-renders, memo'd if needed
- [ ] **Error Handling:** Try/catch, error boundaries, console logging (Sentry deferred)
- [ ] **Data Flow:** Uses TanStack Query for remote data
- [ ] **Optimistic Updates:** Mutations use onMutate pattern
- [ ] **Keyboard Navigation:** Escape, arrow keys, enter work
- [ ] **Mobile:** Responsive, touch targets > 44px
- [ ] **Accessibility:** Semantic HTML, ARIA labels where needed
- [ ] **Sound:** Every action has audio feedback
- [ ] **Animation:** Smooth, < 300ms, doesn't distract
- [ ] **Linting:** ESLint passes, no warnings
- [ ] **Bundle:** Widget doesn't increase main bundle (code split if large)

---

## Success Criteria

### Each Widget Must Have

- ✅ 1x1, 2x2, 3x3 tile versions
- ✅ Full-screen modal (or game view)
- ✅ Data persisted to Supabase
- ✅ Optimistic updates working
- ✅ Sync failures handled gracefully
- ✅ Keyboard navigation supported
- ✅ Mobile responsive
- ✅ Sound effects on interactions
- ✅ No confirmation dialogs
- ✅ No save buttons
- ✅ Uses only theme colors

### Overall App Must Have

- ✅ TanStack Query integrated
- ✅ All existing widgets refactored to use TanStack Query
- ✅ No confirmation dialogs anywhere
- ✅ Mobile responsiveness working
- ✅ Real-time sync working (Connect Four)
- ✅ Error boundaries in place
- ✅ Performance optimized
- ✅ Comprehensive testing (unit, integration, E2E)
- ✅ TypeScript strict mode enabled
- ✅ ESLint and Prettier configured
- ✅ Husky pre-commit hooks working
- ✅ Bundle size < 250KB gzipped
- ✅ Performance metrics meet targets

---

## Implementation Decisions (Confirmed)

1. **Sound Implementation:** ✅ Using existing Web Audio API solution (`lib/sounds.ts`)
   - Extend existing `playSound` function with new sound types
   - Retro 8-bit Game Boy style sounds

2. **Sentry Setup:** ⏭️ Deferred for now (can be added later if needed)

3. **Testing Priority:** ✅ Unit → Integration → E2E
   - Unit tests for logic functions first (100% coverage)
   - Integration tests for data flow
   - E2E tests for complete user flows

4. **Mobile Testing:** ✅ Playwright mobile emulation
   - Use Playwright's mobile device emulation
   - Test at 768px breakpoint

5. **Bundle Analyzer:** ⏭️ Set up later (after widgets are built)

---

## Next Steps

1. ✅ **Plan reviewed** - All requirements understood
2. ✅ **Clarification questions answered** - Decisions made
3. **Begin Phase 0** (Tooling & Infrastructure Setup)
4. **Iterate through phases** sequentially
5. **Test thoroughly** at each phase
6. **Deploy incrementally** if possible

---

**This plan encompasses EVERYTHING from both specification documents. All checkpoints have been answered. All clarification questions resolved. Ready to proceed with implementation.**

