# CLOBA Arcade — PRD

## Original Problem Statement
User had three separate arcade games (their own apps) and wanted them combined into ONE app
with a single home screen to choose which game to play.

Source games:
1. Nailing Master — drag a hammer, swing down onto standing nails to drive them flush.
2. Plum Peach — falling fruit stream; tap the Peach/Plum button matching the lowest fruit.
3. TinyNinja Jumper — sky/green-platform runner; tap to hop, hold to jump, dodge enemies, grab coins.

## Architecture
- Frontend: Expo Router (SDK 54), bottom tabs (Arcade hub + Ranking).
  - Hub: `app/(tabs)/index.tsx` — 3 game cards + editable player name.
  - Leaderboard: `app/(tabs)/leaderboard.tsx` — per-game global ranking.
  - Games: `app/game/nailing.tsx`, `plum.tsx`, `ninja.tsx` (each: unified start screen → play → game-over).
  - Shared: `src/components/{ChunkyButton,StatPill,GameStart,GameOverOverlay,HowToPlayModal}`,
    `src/hooks/{useGameLoop,useGameSession}`, `src/theme.ts`, `src/api.ts`, `src/player.ts`.
  - Custom fonts: Fredoka (display), Nunito (text) via expo-font.
  - Game loop: requestAnimationFrame (`useGameLoop`) with ref-based state + tick re-render.
- Backend: FastAPI + MongoDB (`server.py`).
  - POST /api/scores {game, player, score} → {best, rank, is_new_best} (best-per-player upsert).
  - GET /api/leaderboard/{game}?limit=50 → sorted rows.
- Storage: best scores + player name on-device via `@/src/utils/storage`.

## User Personas
- Casual mobile gamer who wants quick pick-up-and-play arcade sessions and to compete on rankings.

## Core Requirements (static)
- One hub to launch all 3 games.
- Faithful gameplay for each of the 3 games.
- On-device best scores + global leaderboard per game.
- Playful, tactile arcade UI; haptics.

## Implemented (2026-06)
- [x] Arcade hub with 3 themed game cards + editable player name.
- [x] Nailing Master: drag-hammer mechanic, 4 nails, TAPS counter, timer, endless boards, perfect-hit combo.
- [x] Plum Peach: falling fruit stream, Peach/Plum buttons, catch line, speed ramp + TURBO at 200, wrong/miss = game over.
- [x] TinyNinja Jumper: platform gaps, tap-hop/hold-jump physics, coins, red enemies, 3 hearts, stars.
- [x] Global leaderboard (per game) + on-device best; end-to-end score submission.
- [x] Backend API (14/14 backend tests pass); full frontend flows verified.

## Backlog / Next
- P1: Sound effects (tap/hit/coin) toggle.
- P2: Daily challenge / game-of-the-day on the hub.
- P2: Per-game achievements / medals.
- P3: Migrate shadow* props to boxShadow to silence RN-Web warnings.
