---
name: v3-features
description: Daily Pokémon with streaks/badges, Battle Simulator tab, EvolutionTree component, TeamShare with QR + URL import, global keyboard shortcuts (/, ?, S, F, ←/→, Esc), Detail modal prev/next navigation
type: feature
---
- **Daily Pokémon** (`useDailyPokemon`, `DailyPokemon`): deterministic ID per YYYYMMDD, streak/longest/totalDays, badges (rookie/3d/7d/14d/30d/100d) in `pokedex-daily-streak-v1`. Card lives on Homepage above nav.
- **Battle Simulator** (`BattleTab`, `lib/battle.ts`): turn-based 1v1, picks attacker's most-effective STAB type, damage formula approximating Gen-style (L50, base 60 power), 6.25% crit. HP bars color-shift green→yellow→red. Pulls from team or random legendary.
- **EvolutionTree** (`EvolutionTree.tsx`): replaces flat evolution row in PokemonDetail. Builds rows from chain, shows Eevee-style branching, evolution triggers (Lv, item, trade, happiness, time). Each node clickable.
- **TeamShare** (`TeamShare.tsx`): QR code + copy-link + native share. URL format `?team=id,id,...`. Auto-import on mount via `useTeam.setTeamFromIds` → switches to Team tab and strips `?team` from URL.
- **Keyboard shortcuts** (`useKeyboardShortcuts`, `ShortcutsHelp`): `/` opens Dex, `?` toggles help panel, `Esc` closes; in detail modal: `S` shiny, `F` favorite, `←/→` prev/next Pokémon (1-1025 bounds). Skips when typing.
- **Detail nav**: `PokemonDetail` accepts optional `onNavigate(next: Pokemon)` — when provided shows ChevronLeft/Right around sprite and enables arrow-key nav. Wired into all detail consumers.
- **Tab bar**: now 7 tabs + Home (added Battle with Swords icon). Padding reduced to `px-1.5` to fit on mobile.
