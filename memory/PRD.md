# CLOBA Arcade — PRD

## Original Problem Statement
Combine the user's three existing arcade games into ONE app with a single home screen.
The user provided their real GitHub repos so the actual games are used (not rebuilds).

Source repos (user-owned):
- Nailing Master  -> Hammerexp            (React web / CRA)
- Plum Peach      -> PeachPlum             (Expo/React Native)
- TinyNinja Jumper-> Tiny-Ninja-Jumper     (Expo/React Native)

## Architecture (current)
- CLOBA Arcade hub = Expo Router app. Bottom tabs: Arcade (launcher) + Ranking.
  - Hub `app/(tabs)/index.tsx`: nailing -> /game/nailing, plum -> /plum, ninja -> /ninja.
- Plum Peach (native import): `src/games/plum/*`, screens `app/plum/*`. api -> hub backend (game:'plum').
- TinyNinja Jumper (native import): `src/games/ninja/*`, screens `app/ninja/*`. Submits coins to hub (game:'ninja').
- Nailing Master (real web build, SELF-CONTAINED):
  - Built from Hammerexp; the build is shipped in `frontend/public/nailing/` and served at
    `${EXPO_PUBLIC_BACKEND_URL}/nailing/index.html` (no external live link).
  - Native: `app/game/nailing.tsx` (react-native-webview, source uri). Web: `app/game/nailing.web.tsx` (iframe).
  - Its App.js was patched to postMessage {taps,stars} on finish -> the hub submits (game:'nailing').
- Backend `server.py`: POST /api/scores {game,player,score}; GET /api/leaderboard/{game}.

## One Leaderboard
All three games feed the hub Ranking tab (per-game boards):
- plum: points (Save button); ninja: coins (auto on death); nailing: derived from taps+stars (bridge).

## Implemented (2026-06)
- [x] Hub launches all 3 genuine games; player name editable on device.
- [x] Nailing Master bundled in and self-contained (offline, served from app origin).
- [x] Plum Peach & TinyNinja Jumper imported as real Expo source.
- [x] Unified per-game Ranking populated by all three games.

## Notes / Backlog
- If Nailing Master is updated upstream, re-run: build Hammerexp -> copy build to public/nailing/.
- Optional: single cross-game "overall" ranking (currently 3 per-game boards).
