# 🔥 EMBERCLASH — Duel of the Ember Court

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/tanglangbc/emberclash/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/tanglangbc/emberclash/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

An original turn-based card battler for the make.fun best-card-game bounty.
You are the Ember Duelist; the Ash Warden stands across the table. Both of
you have 30 HP, a 24-card deck and 3 Energy a turn. Reduce the Warden to
0 HP before he does the same to you.

## How to play

- **Each turn** you gain 3 Energy and draw 2 cards. Click a card (or press
  `1`–`7`) to play it if you can afford its Energy cost, then press
  **End Turn** (`Enter`) and the Warden answers.
- **Four suits**, told apart by colour and shape: 🔥 **Ember** (damage),
  🛡️ **Stone** (Block), ❀ **Bloom** (healing), 🌀 **Gale** (draw / energy).
- **SURGE:** play two cards of the same suit in one turn and the second one
  gains +2 damage, Block or healing (or +1 draw / burn / energy). Chain
  Ember to burn the Warden down; chain Stone to turtle; chain Bloom to
  outlast him.
- **Block** absorbs damage until your next turn, then fades. **Burn** deals
  2 damage per stack at the start of a turn, then one stack burns away.
- **Read the Warden:** he shows his intent before your turn — plan around
  it. He prefers lethal damage, and heals and blocks when hurt.
- **Win** by reducing the Warden to 0 HP. Your score rewards HP left, fast
  wins and damage dealt. `R` restarts; `?` opens the in-game help.

## The deck (24 cards)

| Suit | Cards |
| --- | --- |
| 🔥 Ember | Ember Strike (1⚡, 6 dmg), Ember Slash (2⚡, 10 dmg), Cinder Burst (3⚡, 14 dmg), Ignite (2⚡, 5 dmg + Burn 2) |
| 🛡️ Stone | Stone Wall (1⚡, 7 Block), Bulwark (2⚡, 11 Block), Riposte (2⚡, 6 Block + 5 dmg) |
| ❀ Bloom | Bloom Mend (1⚡, heal 6), Lifebloom (2⚡, heal 10), Thorn Gift (2⚡, heal 5 + 5 dmg) |
| 🌀 Gale | Gale Gust (1⚡, draw 2), Windfall (2⚡, draw 2 + 1⚡), Cyclone (2⚡, 4 dmg + draw 1) |

## Run it

Static files, no build step, no network at runtime:

```sh
# serve game/ with any static server, then open it in desktop Chrome
python3 -m http.server 8080 --directory game
# or: node serve.ts   (from the kit starter layout)
```

Screenshot scenes (real game states, staged through the engine):

```sh
# ?shot=title|play|win|loss — e.g. http://localhost:8080/index.html?shot=play&seed=7
```

## Entry

- Competition: [best-card-game-20261122-1826](https://make.fun/bounty/best-card-game-20261122-1826)
- License: MIT — see LICENSE
- Referral: https://make.fun/r/NVRADX
