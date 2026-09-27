# Entry cutoffs: estimated ranks for main draw and qualifying

A **model estimate** for the 2023 calendar. The game decides entry in compiled code; the files supply its inputs, and this model fills in who enters. Treat these as planning ranges, not guarantees. The ranges get tighter as observed values are added to `calibration.json`.

## How it works

- **Direct places** per event = singles draw − qualifiers − `NbWildcard`. Qualifiers = qualifying draw ÷ 2^`QualifNbRound`, where `QualifDraw` −1 means the main-draw size and −2 means half of it. These reproduce 104 direct places at Slams and 12 qualifiers at 96-draw 1000s.
- **Who enters:** each week, levels fill in `TypeRank` order (Slams, 1000s, 500s, 250s, Challengers, ITF). Tiers with `TopPresence` ≥ 0.9 (Slams, 1000s) take everyone who gets in. For other weeks, each rank enters with a weekly probability derived from the game's own ranking export: events played in 52 weeks, minus the Slams and 1000s that rank reaches, spread over the free weeks. Entrants go to the best level they can get into.
- **Rank → points** uses the ranking export (snapshot 2023-39, 1497 players). Points shift as a career world evolves; export a fresh ranking to refresh them.
- **Method by tour:** ATP: participation from ranking export; WTA: TopPresence. WTA has no ranking export yet, so its cutoffs have no points and use `TopPresence` as the weekly entry probability.

## ATP

| Level | Events | Main-draw cutoff rank (25th / median / 75th pct.) | ≈ Points at median | Qualifying cutoff rank (median) | ≈ Points |
|---|---:|---|---:|---:|---:|
| Grand Slam | 4 | 104 / **104** / 104 | 359 | 232 | 223 |
| 1000 | 9 | 49 / **79** / 79 | 464 | 127 | 315 |
| 500 | 14 | 77 / **131** / 140 | 310 | 233 | 222 |
| 250 | 38 | 109 / **155** / 239 | 288 | 354 | 93 |
| Challenger / 125 | 150 | 257 / **356** / 526 | 93 | 610 | 25 |
| Futures / ITF | 66 | 487 / **645** / 832 | 22 | 779 | 12 |
| Satellite / ITF low | 34 | 495 / **767** / 1110 | 13 | 880 | 7 |

## WTA

| Level | Events | Main-draw cutoff rank (25th / median / 75th pct.) | ≈ Points at median | Qualifying cutoff rank (median) | ≈ Points |
|---|---:|---|---:|---:|---:|
| Grand Slam | 4 | 110 / **110** / 110 | — | 245 | — |
| 1000 | 10 | 51 / **88** / 88 | — | 142 | — |
| 500 | 15 | 56 / **56** / 56 | — | 128 | — |
| 250 | 23 | 152 / **165** / 165 | — | 293 | — |
| Challenger / 125 | 91 | 158 / **227** / 304 | — | 391 | — |
| Futures / ITF | 119 | 358 / **438** / 555 | — | 652 | — |
| Satellite / ITF low | 117 | 540 / **623** / 755 | — | 781 | — |

Cutoffs vary by week: a Challenger in a Slam's second week, or in a week with five Challengers, is easier to enter. Each event page shows its own estimate.

## Calibration

Record observed values from the game in `calibration.json`. After registration closes, open a tournament's draw or entry list and read **Last direct acceptance**. With two or more observations at a level, that level is rescaled by the median observed ÷ model ratio.

No observations yet: the model is uncalibrated.
