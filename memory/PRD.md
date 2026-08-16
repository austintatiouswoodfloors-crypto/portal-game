# CLOBA Arcade — PRD

## Original Problem Statement
Combine the user's three existing arcade games into ONE app with a single home screen
to choose which to play. The rebuilt-from-observation versions weren't faithful, so the
user provided the real GitHub repos to import the actual games.

Source repos (user-owned):
- Nailing Master  -> github.com/austintatiouswoodfloors-crypto/Hammerexp  (React web / CRA)
- Plum Peach      -> github.com/austintatiouswoodfloors-crypto/PeachPlum  (Expo/React Native)
- TinyNinja Jumper-> github.com/austintatiouswoodfloors-crypto/Tiny-Ninja-Jumper (Expo/RN)

## Architecture (current)
- CLOBA Arcade hub = Expo Router app. Bottom tabs: Arcade (launcher) + Ranking.
  - Hub: `app/(tabs)/index.tsx` — 3 cards. nailing -> /game/nailing, plum -> /plum, ninja -> /ninja.
- Plum Peach (native import): real source in `src/games/plum/*`; screens in `app/plum/*`
  (index/game/howto/ranking). api rewired to hub backend (`src/games/plum/api.ts` -> /api/scores game:'plum').
- TinyNinja Jumper (native import): real source in `src/games/ninja/*` (game engine, components, theme);
  screens in `app/ninja/*` (index/game). Uses expo-audio, expo-screen-orientation, react-native-svg.
  Assets copied to `assets/fonts/*` and `assets/audio/*`.
- Nailing Master (web app): runs the real build in a WebView.
  - Native: `app/game/nailing.tsx` (react-native-webview) -> live URL.
  - Web preview: `app/game/nailing.web.tsx` (raw <iframe>).
- Root `app/_layout.tsx`: loads Fredoka/Fredoka-Medium/Fredoka-SemiBold/Nunito/Nunito-Bold,
  GestureHandlerRootView + SafeAreaProvider.
- Backend `server.py`: POST /api/scores {game,player,score}; GET /api/leaderboard/{game}.

## Implemented (2026-06)
- [x] Hub launches all 3 games; player name editable on device.
- [x] Plum Peach — genuine imported game (falling fruit stream, Peach/Plum buttons, catch line, TURBO).
- [x] TinyNinja Jumper — genuine imported game (platform gaps, hop/hold jump, coins, enemies, lives, powerups, audio).
- [x] Nailing Master — genuine web game embedded via WebView/iframe.
- [x] Plum scores feed the hub Ranking tab.

## Known notes / Backlog
- Nailing Master loads its LIVE preview URL. For a fully self-contained/offline build, bundle its
  CRA build into the app (or point to the user's deployed URL after they publish it). (P1)
- Unify leaderboard: also submit Nailing & Ninja scores to the hub backend so the Ranking tab
  covers all three (currently Plum only). (P1)
- Old rebuilt native games removed (app/game/plum.tsx, app/game/ninja.tsx).
