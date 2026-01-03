# Friendship Dashboard - Context for Feature Brainstorming

## What Is This App?

**Friendship Dashboard** is a personalized, widget-based social dashboard where you create custom landing pages for each of your friends. Each friend gets their own URL (e.g., `yoursite.com/daniel`) with a unique color theme, layout, and set of interactive widgets.

Think of it as a **personalized homepage** you design for each friend - a curated space where you share music, notes, links, events, pixel art, and other content that's meaningful to your friendship.

### Core Concept

- **One page per friend**: Each person has a dedicated dashboard you've designed
- **Widget-based layout**: 8×6 grid system (48 tiles total) where widgets snap to grid positions
- **Retro aesthetic**: Chunky pixel borders, Dogica font, limited color palettes (4-5 colors per friend), Gameboy/Tamagotchi vibe
- **Desktop-first**: Optimized for computer viewing (intentionally not mobile-responsive)
- **Admin-driven**: You (the creator) design and manage all content; friends view their personalized dashboards

## Current Features

### Widget System

The app uses a flexible widget architecture where each widget can be sized 1×1, 2×2, or 3×3 grid tiles. Widgets are positioned on an 8×6 grid (80px tiles with 8px gaps).

#### Available Widgets

1. **Music Player** 🎵
   - Plays top 10 songs via YouTube IFrame API
   - Persistent player that continues across page navigations
   - Three sizes: compact (1×1), playlist view (2×2), full player (3×3)
   - Auto-play next song functionality

2. **Pixel Art** 👾
   - Display pixelated images with cascading flip animation
   - Image upload with HEIC support (auto-converts to PNG)
   - Automatic color quantization to match friend's theme palette
   - Images are cropped and pixelated based on widget size

3. **Calendar** 📅
   - Mini date display (1×1)
   - Monthly grid view (2×2, 3×3)
   - Event indicators and month navigation
   - Today highlighting

4. **Notes** 📝
   - Quick note counter (1×1)
   - Note list with inline editing (2×2)
   - Full editor with textarea (3×3)
   - Add/delete notes functionality

5. **Links** 🔗
   - Link counter (1×1)
   - Link list (2×2)
   - Grid layout (3×3)
   - External link indicators and icon support

6. **Media Recommendations** 🎬
   - Share and track movies, shows, books, music, games
   - Status tracking (watched/unwatched)
   - Rating system

7. **Mood Tracker** 😊
   - Track mood with emojis
   - Time-based mood logging

8. **Event Countdown** ⏰
   - Countdown to upcoming events
   - Visual countdown display

9. **Personality Quiz** ✨
   - Interactive quizzes to discover compatibility
   - Multiple choice questions

10. **Connect Four** 🎮
    - Playable Connect Four game
    - Turn-based gameplay

### Admin Features

- **Widget Management**: Drag-and-drop widget repositioning, add/delete widgets, size selection
- **Color Theme Editor**: Customize each friend's color palette (primary, secondary, accent, background, text)
- **Content Management**: Upload pixel art, manage songs, add notes/links/events
- **Inbox System**: Friends can submit recommendations and hangout proposals that you approve/reject
- **Layout Persistence**: Widget positions and configurations saved to database

### Design System

- **Retro Aesthetic**: Chunky 4px borders, pixel-perfect alignment, Dogica font
- **Color Themes**: Each friend has a 5-color palette (primary, secondary, accent, background, text)
- **Sound Effects**: Optional 8-bit retro sounds for interactions (click, success, error, pop, blip)
- **Animations**: Slide-in widgets, pulse effects, shake feedback, cascading pixel flips
- **Gamepad Navigation**: Controller/keyboard navigation with "magnetic" focus system

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **State Management**: Zustand, TanStack Query
- **Styling**: CSS Modules, Tailwind CSS 4
- **Testing**: Jest, Playwright (E2E)
- **Font**: Dogica (pixel font)
- **APIs**: YouTube IFrame API, Supabase REST/Realtime

## Architecture

### Data Model

**Core Tables:**

- `friends`: Friend profiles with color themes and metadata
- `widgets`: Widget type definitions
- `friend_widgets`: Junction table storing widget positions, sizes, and configs per friend
- `pixel_art_images`: Uploaded pixel art images (can be friend-specific or global)
- `inbox_items`: Recommendations and hangout proposals from friends
- `global_content`: Shared content across all friends
- `personal_content`: Friend-specific content

**Key Relationships:**

- Friends → Friend Widgets (one-to-many)
- Widgets → Friend Widgets (one-to-many)
- Friends → Pixel Art Images (one-to-many, nullable)
- Friends → Inbox Items (one-to-many)

### Component Structure

```
app/
├── [friend]/              # Dynamic friend pages
│   ├── page.tsx           # Server component (data fetching)
│   └── FriendPageClient.tsx  # Client component (interactivity)
├── admin/                 # Admin routes
│   ├── [friend]/          # Friend-specific admin
│   ├── friends/           # Friend management
│   └── content/           # Content management
components/
├── widgets/               # Widget implementations
├── admin/                 # Admin UI components
└── Grid.tsx               # Grid layout system
lib/
├── queries.ts             # Database queries
├── types.ts               # TypeScript types
├── widget-utils.ts        # Widget positioning logic
└── theme-context.tsx      # Theme provider
```

### Widget Rendering Flow

1. Server fetches friend data and widgets from Supabase
2. `FriendPageClient` renders `Grid` component with widget positions
3. `WidgetRenderer` dynamically renders widgets based on `widget_type`
4. Each widget receives its `config` (JSONB) and `size` props
5. Widgets can update their config via admin interface

## Current State & Limitations

### What Works Well

✅ Full CRUD for friends and widgets  
✅ Drag-and-drop widget repositioning  
✅ Persistent YouTube music player  
✅ Pixel art upload and display  
✅ Theme customization  
✅ Multiple widget types with responsive sizing  
✅ Admin overlay system  
✅ Inbox/approval workflow

### Known Limitations

- Widget save functionality uses optimistic updates (UI updates immediately, DB sync happens async)
- Some widgets need better configuration UIs
- Keyboard shortcuts framework exists but needs implementation
- Sound effects need user preference toggle
- No widget templates/gallery yet
- No export/import layouts
- No undo/redo for widget moves
- No widget duplication feature

## Design Philosophy

1. **Retro First**: Everything should feel like a Gameboy/Tamagotchi interface
2. **Desktop-Focused**: Optimized for computer viewing, not mobile
3. **Admin-Driven**: You control all content; friends are viewers
4. **Widget-Centric**: Everything is a widget on a grid
5. **Theme-Aware**: Widgets adapt to each friend's color palette
6. **Playful**: Sound effects, animations, and interactive elements make it fun

## Use Cases

- **Music Sharing**: Create playlists for friends via Music Player widget
- **Memory Keeping**: Upload pixel art photos, add notes about shared experiences
- **Event Planning**: Use Calendar and Event Countdown widgets
- **Content Curation**: Share links, media recommendations
- **Gaming**: Play Connect Four together
- **Relationship Building**: Personality quizzes, mood tracking

## Future Feature Ideas (For Brainstorming)

The app is ready for expansion. Consider:

- **New Widget Types**: Weather, countdown timers, photo galleries, chat/messaging, shared playlists, collaborative notes
- **Social Features**: Friend-to-friend interactions, comments, reactions
- **Templates**: Pre-built widget layouts, theme templates
- **Analytics**: Track which widgets friends interact with most
- **Export/Import**: Share layouts between friends, backup/restore
- **Widget Marketplace**: Community-created widgets
- **Multiplayer**: Real-time collaborative widgets
- **Notifications**: Alert friends when you update their dashboard
- **Widget Animations**: Custom animations per widget
- **Widget Nesting**: Widgets within widgets
- **Custom Widget Builder**: Visual widget creation tool

## Technical Notes

- Grid is 8 columns × 6 rows (48 total tiles)
- Each tile is 80px × 80px with 8px gaps
- Widgets can be 1×1, 2×2, or 3×3 (occupying 1, 4, or 9 tiles)
- Position validation ensures widgets don't overlap
- Widget configs are stored as JSONB in database
- Theme colors use CSS custom properties for dynamic theming
- YouTube player uses singleton pattern to persist across navigations
- Admin mode is detected via URL path (`/admin/[friend]` vs `/[friend]`)

---

**This document provides context for brainstorming future features. The app has a solid foundation and is ready for creative expansion!**
