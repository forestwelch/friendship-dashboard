# Performance Optimization & Widget Consolidation Plan

## Goals

1. **Fix abysmally slow fetches** - Investigate and optimize database queries (songs, friends, widgets)
2. **Consolidate image and pixel_art widgets** - Remove redundant "image" widget type
3. **Implement programmatic pixel rendering** - Store images as 64x64 intensity arrays, render with theme colors
4. Fix stack overflow issues in PixelArt component
5. Optimize image fetching (return thumbnails, lazy load full images)
6. Implement on-display pixelation (process when widget renders)
7. Simplify slideshow logic to prevent render loops

## Phase 1: Investigate & Fix Slow Database Queries

**Problem:** Songs, friends, and other data fetches are extremely slow

**Potential Issues:**

1. Missing indexes on frequently queried columns (`friends.slug`, `global_content.content_type`)
2. Sequential queries instead of parallel/batched queries
3. Large base64 payloads in `pixel_art_images` table
4. No connection pooling or query optimization
5. Network latency from multiple round trips

**Files to update:**

**`supabase/migrations/005_add_performance_indexes.sql`** (new file):

- Add `CREATE INDEX idx_friends_slug ON friends(slug);` (for `getFriendPage`)
- Add `CREATE INDEX idx_global_content_type ON global_content(content_type);` (for `getGlobalContent`)

**`lib/queries.ts`**:

- Add query timing logs to `getGlobalContent`, `getFriendPage`, `getAllFriends`
- Consider parallelizing queries in `getFriendPage` (friend + widgets + pixel art in parallel)
- Add performance logging: `console.time()` / `console.timeEnd()`

**`app/[friend]/page.tsx`**:

- Consider lazy loading pixel art images (fetch separately, not blocking page load)
- Add loading states for better UX

**Actions:**

1. Add missing database indexes
2. Add query timing logs to identify bottlenecks
3. Optimize `getFriendPage` to use parallel queries where possible
4. Consider fetching pixel art images separately (lazy load) or only when needed
5. Add database query logging to measure actual query times

## Phase 2: Consolidate Image and Pixel_Art Widgets

**Goal:** Remove redundant "image" widget type, use only "pixel_art"

**Files to update:**

**`components/WidgetRenderer.tsx`**:

- Remove "image" case (line 118-123)
- Route "image" widgets to PixelArt component for backward compatibility

**`components/widgets/Image.tsx`**:

- Delete this file (functionality merged into PixelArt)

**`components/widgets/PixelArt.tsx`**:

- Add support for single image (no slideshow) - already handles this
- Add upload functionality from Image widget (optional - may not be needed)

**`components/admin/WidgetConfigModal.tsx`**:

- Remove any "image" widget type handling (if exists)

**`supabase/migrations/006_migrate_image_to_pixel_art.sql`** (new file):

- `UPDATE friend_widgets SET widget_id = (SELECT id FROM widgets WHERE type = 'pixel_art') WHERE widget_id = (SELECT id FROM widgets WHERE type = 'image');`
- `DELETE FROM widgets WHERE type = 'image';`

**`supabase/migrations/002_seed_data.sql`**:

- Remove "image" widget type from seed data

**`app/[friend]/FriendPageClient.tsx`**:

- Remove any image widget handling (if exists)

**Changes:**

- PixelArt component should handle single images (no slideshow) gracefully
- Keep backward compatibility - existing "image" widgets should still work via migration

## Phase 3: Implement Programmatic Pixel Rendering

**New Approach:** Store images as 64x64 grayscale intensity arrays, render programmatically with theme colors

**Concept:**

- Upload image → crop to square → resize to 64x64 → extract grayscale intensities (0-255)
- Quantize to 8 levels (0-7)
- Store as base64-encoded Uint8Array (4096 bytes = 64×64)
- When rendering: decode pixel data → map intensity levels to theme colors → render as SVG

**Files to create/update:**

**`lib/pixel-data-processing.ts`** (new file):

- `processImageToPixelData(imageFile: File): Promise<Uint8Array>` - Upload image → crop to square → resize to 64x64 → extract grayscale intensities (0-255) → quantize to 8 levels → return as Uint8Array
- `quantizeIntensity(intensity: number, levels: number): number` - Quantize 0-255 to 0-7 (8 levels)
- `mapIntensityToThemeColor(intensityLevel: number, themeColors: {primary, secondary, accent}): string` - Map quantized level to theme color:
  - Levels 0-2 → Primary color (darkest)
  - Levels 3-4 → Secondary color (medium)
  - Levels 5-7 → Accent color (lightest)
- `pixelDataToBase64(data: Uint8Array): string` - Encode Uint8Array to base64 for storage
- `base64ToPixelData(base64: string): Uint8Array` - Decode base64 back to Uint8Array

**Database Schema (`supabase/migrations/007_pixel_data_schema.sql`)**:

- Change `pixel_art_images.base_image_data` to `pixel_data` (TEXT, base64 encoded Uint8Array)
- Remove old `base_image_data` column
- Add `width` and `height` columns (default 64x64) for future flexibility
- Note: User will reset DB, so no migration needed for existing data

**`components/widgets/PixelArt.tsx`**:

- Replace image rendering with SVG-based pixel rendering
- Decode `pixel_data` base64 → Uint8Array
- Create SVG with `<rect>` elements for each pixel (64x64 grid)
- Map each pixel's intensity level to theme color using `mapIntensityToThemeColor`
- Render SVG with proper sizing and pixelated look
- Support slideshow by rendering multiple SVG grids
- Use friend's theme colors from props/context

**`app/api/images/route.ts`**:

- Update POST endpoint to process images using `processImageToPixelData`
- Store `pixel_data` instead of `base_image_data`
- Return pixel data in GET (much smaller payload - 4KB vs MB)

**`components/admin/WidgetConfigModal.tsx`**:

- Update image upload to use new processing pipeline
- Show preview of pixelated version before saving
- Store `pixel_data` in widget config

**Benefits:**

- Much smaller storage (4096 bytes vs potentially MB)
- One image can be rendered in any theme color scheme
- Faster loading (just pixel data, not full images)
- Programmatic rendering allows for cool effects
- No need to store multiple versions for different themes

## Phase 4: Fix Stack Overflow in PixelArt Component

**File: `components/widgets/PixelArt.tsx`**

- Remove circular useEffect dependencies:
- Remove `currentImageKey` effect that resets `currentImageIndex` (causes loops)
- Consolidate image loading state management
- Use refs to track previous values instead of effects
- Simplify slideshow:
- Single effect that manages the cycle
- Use `useRef` to track if component is mounted
- Debounce state updates
- Add guards to prevent infinite loops:
- Check if state actually changed before updating
- Use `useRef` to track processing state

## Phase 5: Optimize Image Fetching

**File: `app/api/images/route.ts`**

- With new pixel_data approach, payloads are already small (4KB)
- Add caching headers
- Consider pagination if needed

**File: `components/admin/WidgetConfigModal.tsx`**

- Fetch pixel data for selection UI (already fast with 4KB payloads)
- Show preview thumbnails

## Phase 6: Implement On-Display Pixelation

**Note:** With programmatic rendering, pixelation happens at upload time, not display time. This phase may not be needed, or we can add real-time theme color switching.

**File: `components/widgets/PixelArt.tsx`**

- If we want to allow theme color changes without re-uploading:
- Cache decoded pixel data
- Re-render SVG when theme colors change
- Show loading state while processing (if needed)

## Phase 7: Simplify Widget Config Modal

**File: `components/admin/WidgetConfigModal.tsx`**

- With programmatic rendering, processing happens at upload
- Just store pixel_data in config
- Show preview of pixelated version
- Allow selecting multiple images for slideshow

## Implementation Order

1. **Fix slow database queries (critical)** - Add indexes, optimize query patterns, add logging
2. **Implement programmatic pixel rendering** - Core new feature
3. Consolidate image and pixel_art widgets
4. Fix stack overflow issues in PixelArt component
5. Optimize image fetching (already optimized with pixel_data approach)
6. Update config modal for new pixel_data workflow

## Key Changes Summary

**Performance:**

- Add indexes on `friends.slug` and `global_content.content_type`
- Add query timing logs to identify bottlenecks
- Consider parallel queries in `getFriendPage`

**Programmatic Pixel Rendering:**

- Store images as 64x64 intensity arrays (4KB vs MB)
- Render as SVG with theme colors
- One image works with any theme color scheme

**Widget Consolidation:**

- Delete `components/widgets/Image.tsx`
- Update `WidgetRenderer.tsx` to route "image" to PixelArt
- Create migration to convert existing "image" widgets to "pixel_art"

**PixelArt.tsx:**

- Replace image rendering with SVG pixel grid
- Map intensity levels to theme colors
- Support slideshow with multiple SVG grids
- Remove circular useEffect dependencies

**WidgetConfigModal.tsx:**

- Update to use new pixel_data processing pipeline
- Show preview before saving
