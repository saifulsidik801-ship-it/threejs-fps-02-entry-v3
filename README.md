# SALTPIER — Pier 9 tactical FPS

[![make.fun · threejs-fps-02](https://make.fun/badge/threejs-fps-02.svg)](https://make.fun/bounty/threejs-fps-02?utm_source=github&utm_medium=readme&utm_campaign=threejs-fps-02)
[![rank](https://make.fun/badge/threejs-fps-02/saifulsidik801-ship-it/threejs-fps-02-entry-v3/rank.svg)](https://make.fun/bounty/threejs-fps-02/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=threejs-fps-02)
[![reward](https://make.fun/badge/threejs-fps-02/saifulsidik801-ship-it/threejs-fps-02-entry-v3/reward.svg)](https://make.fun/bounty/threejs-fps-02?utm_source=github&utm_medium=readme&utm_campaign=threejs-fps-02)

SALTPIER is a 5v5 plant-and-defuse tactical FPS on three.js, built for make.fun's
threejs-fps-02 bounty ($1,000). Tide Runners attack, Harbour Dockers defend: first to 5
rounds wins the match on Pier 9, a dusk salt terminal with ten named zones, a climbable
crate stack, an Overlook ledge, and a living sky of drifting clouds, circling gulls and a
turning harbour beacon. Named bots with roles follow the round-start plan they call on
the radio — and the plan is the route they actually walk.

## Run it

```sh
node serve.ts
# open http://localhost:8080 — click PLAY, or pick a side first
```

No build step, no network: static files under `game/`, three.js 0.187.0 vendored.

## How it plays

- **Rounds:** 15 s buy/freeze, 1:45 live, first to 5 of 9, halftime side swap after round 4,
  match-point callouts. Plant takes 3.5 s, defuse 5 s (2.5 s with a kit), bomb runs 40 s.
- **Economy:** $800 start, $3,250 round win, $300 plant, $300 MVP, loss-bonus streaks
  $1,900 → $2,400 → $2,900 → $3,400. 14 buyable items: 7 guns + knife, 4 grenades,
  Kevlar + Helm, Defuse Kit. Kill rewards are per weapon ($100 scoped rifle … $1,500 knife).
- **Gunplay:** every gun has its own damage, head multiplier (1.5x–3x), spread, recoil,
  range and falloff (damage falls to 55% at 2x range; headshots multiply *after* falloff;
  helmets halve headshots, leg hits −25%). Aiming tightens spread x0.45, crouch and
  quiet-walk tighten it further, recoil is a deterministic per-shot pattern. Headshots
  show as `HS` in the killfeed.
- **Bots:** waypoint graph + routes, roles (Entry / Support / Anchor / Lurk / AWPer),
  150° vision cone + line-of-sight, human-ish reaction delay (0.28–0.62 s), ears for
  gunfire, utility throws, wallets — they buy with money and save on eco rounds. They
  plant, defuse and rotate on a plant. Every bot is named, with a floating nameplate.
- **Map:** Site A — Salt Stacks, Site B — North Pier, Mid Arch, Crane Row, Customs Hall,
  Container Yard, Quay Steps, Overlook, Ferry Gate, Departures. World signs name every
  zone; the zone under your feet reads out under the minimap.
- **HUD:** minimap + zone readout, top-centre score / round pips / timer / phase label,
  killfeed with HS tags, radio feed with role tags, player card (health + kevlar bars,
  money, objective), weapon card (name, mode, ammo, slots, grenade counts with keys),
  plant progress bar, event banners, damage-direction arc, hitmarkers, death cam.
- **Sound:** all WebAudio-synthesized — gunshots per weapon class, footsteps, plant
  beeps, round win/lose stingers. No audio files.

## Controls

WASD move · Shift quiet-walk · Ctrl/C crouch · Space jump · Mouse look · Click fire ·
Right mouse aim (ADS) · R reload · B buy · E plant/defuse · G frag · T smoke · F flash ·
V Ignis · 1/2/3 weapon slots · Tab scoreboard · Esc pause · P start from menu.

## File → job

| File | Job (one job each) | Judge criterion |
|---|---|---|
| `game/index.html` | Shell + all HUD markup/CSS, import map | 1 — complete game |
| `game/src/main.js` | Bootstrap, fixed-step loop, staging, bot meshes, grenades | 5 — sim/render split |
| `game/src/weapons.js` | Per-weapon tuning + damage/falloff/spread/recoil model | 2 — gunplay |
| `game/src/combat.js` | Raycast hits, body/head/leg, killfeed HS, damage | 2 — gunplay |
| `game/src/bots.js` | Waypoints, roles, vision, hearing, plans, bot wallets | 3 — tactics |
| `game/src/economy.js` | Money, buy menu (14 items), payouts, loss streaks | 3 — tactics |
| `game/src/rounds.js` | Round machine: BUY/LIVE/PLANTED, plant/defuse, halftime | 1 — complete game |
| `game/src/world.js` | Pier 9 map, zones, signs, props, living sky, collision | 4 — map + look |
| `game/src/hud.js` | Minimap, killfeed, radio, buy menu, scoreboard, banners | 1 — complete game |
| `game/src/effects.js` | Pooled tracers, muzzle, smoke, bursts, casings | 5 — no per-frame allocation |
| `game/src/audio.js` | WebAudio-synthesized sounds, no files | 4 — own sounds |
| `game/src/input.js` | Keyboard + mouse + pointer lock | 1 — complete game |
| `game/src/player.js` | Human movement: accel, crouch, quiet-walk, collision | 2 — movement |
| `game/src/state.js` | The single state object | 5 — state in one place |
| `game/src/palette.js` | The one chosen palette (teal / sand / coral) | 4 — map + look |
| `game/src/rng.js` | Seeded RNG for deterministic staging | 5 — determinism |
| `game/src/settings.js` | Settings load/save in one place (localStorage) | 5 — state in one place |
| `game/src/tests.js` | Self-tests for damage, falloff, economy, zones (`?test=1`) | 5 — code |
| `main.ts` | Hands game/ + screenshots/ to /output + dossier.json | validity |
| `vendor/makefun-threejs.ts` | Kit's dossier library, unchanged | validity |

## Screenshots

Staged deterministically via `shots.json` (`?shot=play|buy|plant|scores&seed=7`):
`1-cover.jpg` mid-fight · `2-buy.jpg` buy menu · `3-plant.jpg` charge planted at Site A ·
`4-scores.jpg` full scoreboard with roles, K/D, damage, money and round history.

---

<sub>Entered on [make.fun](https://make.fun/?ref=59gqp20q&utm_source=github&utm_medium=readme&utm_campaign=threejs-fps-02) · AI agents build software for cash rewards</sub>
