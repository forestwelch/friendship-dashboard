# Friendship Dashboard

A personalized social dashboard where you curate custom widget-based pages for each of your friends. Each friend gets their own URL (e.g., `mysite.com/daniel`) with a unique layout, color scheme, and set of interactive widgets.

## Features

- **One screen per friend**: Each person has a personalized landing page you've designed for them
- **Widget-based layout**: 8x6 grid of tiles, widgets snap to grid (1x1, 2x2, 3x3 sizes)
- **Retro aesthetic**: Chunky pixel borders, Dogica font, limited color palettes (4-5 colors), Gameboy/Tamagotchi vibe
- **Desktop-first**: Optimized for computer viewing, not mobile responsive (this is intentional)
- **Music Player Widget**: Play your top 10 songs via YouTube with three different widget sizes

## Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. **Download Dogica Font**:
   - Download the Dogica font from [dafont.com](https://www.dafont.com/dogica.font)
   - Extract the font files
   - Place `dogica.ttf` (or `dogica.woff`/`dogica.woff2`) in the `/public/fonts/` directory
   - If the font is not available, the app will fall back to `Courier New` monospace font

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

- Visit `/daniel` to see Daniel's personalized dashboard with blue theme
- Visit `/max` to see Max's personalized dashboard with red theme
- Click the play button on any music widget to start playing your top 10 songs
- Music continues playing across all widget interactions

## Project Structure

```
friendship-dashboard/
├── app/
│   ├── [friend]/
│   │   └── page.tsx           # Dynamic friend page
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Home/landing page
├── components/
│   ├── Grid.tsx               # 8×6 grid layout
│   ├── Widget.tsx             # Base widget wrapper
│   ├── YouTubePlayer.tsx      # YouTube player provider
│   └── widgets/
│       ├── MusicPlayer.tsx    # Music player widget
│       └── index.ts
├── lib/
│   ├── types.ts               # TypeScript types
│   └── youtube.ts             # YouTube API helpers
└── styles/
    ├── themes.css             # Color themes
    └── widgets.css            # Widget-specific styles
```

## Phase 1 Status

✅ Next.js project setup  
✅ Dogica font configuration (requires font file download)  
✅ Color theme system  
✅ 8x6 grid layout component  
✅ Music Player widget (1x1, 2x2, 3x3 sizes)  
✅ YouTube IFrame API integration  
✅ Static Daniel page with blue theme  
✅ Visual polish: chunky borders, pressed button effects  

## Next Steps (Phase 2)

- Set up Supabase database
- Make content dynamic
- Add admin mode for editing layouts
- Add authentication

## Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint
npm run lint
```

## Notes

- The app is desktop-first and not optimized for mobile
- Music playback uses YouTube IFrame API
- Widget layouts are currently hardcoded but will be database-driven in Phase 2
