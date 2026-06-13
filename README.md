# GameFeed

A TikTok-style vertical feed where every swipe is a playable micro-game. Built to validate one hypothesis: *Will users consume games as scrolling content?*

## Quick Start

```bash
cd gamefeed
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the first game loads immediately. No landing page.

## Experience

- **Swipe up** (or scroll down / press ↓) for the next game
- **Swipe down** (or scroll up / press ↑) for the previous game
- After 4 games, the waitlist screen appears
- Developer analytics at [/analytics](http://localhost:3000/analytics)

## Games

| # | Game | Mechanic | Duration |
|---|------|----------|----------|
| 1 | Dodge | Move horizontally, avoid falling objects | 10–20s |
| 2 | Tap Rush | Tap targets before they disappear | 10s |
| 3 | Stack | Tap to place moving blocks | 10–15s |
| 4 | Reaction | Tap when screen changes color | 5–10s |

## Analytics

All events are tracked through a swappable provider layer (`lib/analytics/`). Default: localStorage.

Tracked events: `feed_opened`, `game_viewed`, `game_started`, `game_completed`, `swipe`, `games_reached`, `waitlist_reached`, `waitlist_submitted`.

To swap in PostHog or Mixpanel, implement `AnalyticsProvider` and call `setAnalyticsProvider()`.

## Adding a Game

1. Create `components/games/YourGame.tsx` implementing `GameComponentProps`
2. Add an entry to `lib/games/registry.ts`

That's it — the feed picks it up automatically.

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion

## Deploy on Vercel

This app lives in the `gamefeed/` subdirectory of the monorepo. When importing to Vercel:

1. Connect the GitHub repo (`contextplz/supymem_v0`)
2. Set **Root Directory** to `gamefeed`
3. Framework Preset: **Next.js** (auto-detected)
4. Build Command: `npm run build` (default)
5. Output Directory: `.next` (default)
6. Install Command: `npm install` (default)
7. Deploy

No environment variables are required for the MVP. Analytics use localStorage in the browser.

Alternatively, from the CLI:

```bash
cd gamefeed
npx vercel
```

Follow the prompts and confirm `gamefeed` as the project root when linking from the monorepo.
