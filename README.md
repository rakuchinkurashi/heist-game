# One Frame Heist

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/rakuchinkurashi/heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/rakuchinkurashi/heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

An entry for [make.fun's "Make the best heist game" bounty](https://make.fun/bounty/best-heist-game-20261122-0559).

One Frame Heist is a top-down stealth game: slip through a guarded vault room, lift $1000 of loot, and reach the exit before the alarm hits 100%.

## How to play

- **Move:** WASD or arrow keys.
- **Toss a coin:** click anywhere — the nearest guard walks over to look (3 coins).
- **Smoke bomb:** Space or F — a cloud at your feet that hides you from guards and cameras (2 bombs).
- **Steal loot:** stand still beside a gem, painting, safe or gold pile until its ring fills. Safes take longest.
- **Win:** carry $1000 or more, then reach the green EXIT door at the bottom-right.
- **Lose:** the alarm reaches 100%, or a guard grabs you.
- **Restart:** R. **Start:** Enter or click. **Mute:** M.

Guards patrol fixed routes with vision cones and chase you when they see you; wall cameras sweep their cones back and forth. Walls and furniture block sight, so plan your route from one piece of cover to the next. Being seen raises the alarm; hiding lets it calm down.

## Play it locally

No build step, no network: the game is plain static files under `game/`.

```sh
node serve.ts
```

Then open <http://localhost:8080> in a desktop browser.

Screenshot scenes (the same game, staged): `?shot=start` for the title screen, `?shot=play` for a mid-heist frame, `?shot=end` for the getaway screen.

## Hand in

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/` to `/output` and writes `/output/dossier.json` with the vendored make.fun library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see [LICENSE](LICENSE).
