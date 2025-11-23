# Friendship Dashboard - Design System

## Overview

A comprehensive, game-inspired design system that ensures consistency, beauty, and seamless interactions across the entire application.

## Core Principles

1. **Consistency**: All components use the same color palette, spacing, and typography
2. **No Layout Shifts**: Fixed dimensions and proper spacing prevent CLS
3. **Game-Like Aesthetic**: Pixel-perfect rendering with chunky, blocky UI elements
4. **Scannable**: Clear visual hierarchy and consistent spacing
5. **Smooth Interactions**: Fast transitions and visual feedback

## Color Palette

### Dark Background System
- `--game-bg-primary`: `#0a0a0f` - Main background
- `--game-bg-secondary`: `#141420` - Secondary background
- `--game-bg-tertiary`: `#1e1e2e` - Tertiary background

### Surface Colors
- `--game-surface`: `#252538` - Card/container background
- `--game-surface-hover`: `#2d2d45` - Hover state
- `--game-surface-active`: `#353550` - Active state

### Border System
- `--game-border`: `#3a3a5a` - Standard border
- `--game-border-light`: `#4a4a6a` - Light border
- `--game-border-dark`: `#2a2a3a` - Dark border

### Text Colors
- `--game-text-primary`: `#e8e8f0` - Primary text
- `--game-text-secondary`: `#b8b8c8` - Secondary text
- `--game-text-muted`: `#787888` - Muted text

### Accent Colors
- `--game-accent-blue`: `#4a9eff` - Primary actions
- `--game-accent-green`: `#4ade80` - Success actions
- `--game-accent-red`: `#f87171` - Danger actions
- `--game-accent-yellow`: `#fbbf24` - Warning actions

## Spacing System

Based on 4px base unit:
- `--space-xs`: `4px`
- `--space-sm`: `8px`
- `--space-md`: `12px`
- `--space-lg`: `16px`
- `--space-xl`: `24px`
- `--space-2xl`: `32px`
- `--space-3xl`: `48px`

## Typography

- **Font Family**: `"Dogica", "PixelFallback", "Courier New", monospace`
- **Base Font Size**: `14px`
- **Line Height**: `1.4`

### Heading Sizes
- `.game-heading-1`: `24px`, bold, uppercase
- `.game-heading-2`: `18px`, bold, uppercase
- `.game-heading-3`: `14px`, bold, uppercase

## Components

### Buttons
- `.game-button` - Base button style
- `.game-button-primary` - Primary action (blue)
- `.game-button-success` - Success action (green)
- `.game-button-danger` - Danger action (red)
- `.game-button-icon` - Icon-only button

### Cards
- `.game-card` - Standard card container
- `.game-card-hover` - Card with hover effect

### Inputs
- `.game-input` - Text input field

### Links
- `.game-link` - Styled link

### Navigation
- `.game-nav` - Navigation bar
- `.game-nav-link` - Navigation link
- `.game-nav-link.active` - Active navigation link

## Layout Helpers

- `.game-container` - Max-width container with padding
- `.game-section` - Section spacing
- `.game-flex` - Flexbox container
- `.game-flex-center` - Centered flexbox
- `.game-flex-between` - Space-between flexbox
- `.game-flex-gap-sm/md/lg` - Flexbox gap utilities

## Transitions

- `--transition-fast`: `0.1s ease-out`
- `--transition-normal`: `0.2s ease-out`
- `--transition-slow`: `0.3s ease-out`

## Shadows & Effects

- `--game-shadow-sm`: Small shadow
- `--game-shadow-md`: Medium shadow
- `--game-shadow-lg`: Large shadow
- `--game-glow-blue`: Blue glow effect
- `--game-glow-green`: Green glow effect

## Usage Examples

### Button
```tsx
<button className="game-button game-button-primary">
  Click Me
</button>
```

### Card
```tsx
<div className="game-card game-card-hover">
  Card content
</div>
```

### Container
```tsx
<div className="game-container">
  <h1 className="game-heading-1">Title</h1>
  <section className="game-section">
    Content here
  </section>
</div>
```

## Integration Status

✅ **Completed:**
- Design system CSS file created
- Navigation component updated
- Admin pages updated
- Widget Manager updated
- Widget Library updated
- Home page updated
- Friend pages updated
- Widget components updated (spacing)
- Widget styles updated

## Notes

- Friend pages maintain their theme colors (blue for Daniel, etc.)
- Widgets use friend theme colors dynamically
- Admin pages use dark game UI theme
- All spacing uses design system variables
- Consistent button styles throughout
- Smooth transitions and hover effects

