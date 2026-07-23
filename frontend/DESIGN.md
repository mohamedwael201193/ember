# EMBER DESIGN.md

## Brand Identity
- **Personality**: precise, cinematic, protective, autonomous
- **Voice**: calm operator language; no crypto jargon in the hero
- **Inspiration**: contentarchitecture.dev split storytelling + Linear density + Vercel clarity
- **Not**: admin Carbon dashboard, AI-purple mesh, beige/brass craft palette

## Color System
- **Ink (dark bg)**: `#09090b`
- **Paper (light bg)**: `#f4f4f5`
- **Surface dark**: `#111113`
- **Surface light**: `#ffffff`
- **Border dark**: `rgba(255,255,255,0.08)`
- **Border light**: `rgba(9,9,11,0.08)`
- **Accent Ember**: `#ff5c1a`
- **Accent Ember glow**: `rgba(255,92,26,0.35)`
- **Text dark**: `#fafafa`
- **Text muted dark**: `#a1a1aa`
- **Text light**: `#18181b`
- **Text muted light**: `#52525b`
- **OK**: `#22c55e` · **Warn**: `#eab308` · **Down**: `#ef4444`

## Typography
- **Display**: `"Syne"`, weight 700–800, tracking `-0.04em`
- **Body**: `"DM Sans"`, weight 400–500, line-height 1.6
- **Mono**: `"JetBrains Mono"`, weight 400–500
- No Inter as display. No Fraunces / Instrument Serif.

## Spacing
- Base 8px. Section vertical `py-24` to `py-32` on marketing; app shell denser.
- Hero top padding max `pt-24`.

## Motion
- Ease out: `cubic-bezier(0.16, 1, 0.3, 1)`
- GSAP ScrollTrigger for landing chapters; Motion for micro-interactions
- Honor `prefers-reduced-motion`

## Components
- Buttons: sharp radius `4px`, solid ink/ember, magnetic hover on marketing
- Cards: used only for interactive containers; otherwise spacing + hairlines
- Nav: thin floating bar, single line, max height 72px

## Layout
- Landing: light/dark split hero, scroll-pinned chapters, one marquee max
- App: product shell with left rail, not a dense ops cockpit
