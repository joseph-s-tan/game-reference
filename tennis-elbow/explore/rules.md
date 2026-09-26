# Rules and data: TE4 World Tour under the XKT profile

Mod layers, lowest to highest precedence: TE4-ModdingSDK → XKT → ScoreBoardsByStef → ATPWTA Patch → ATP Realistic Stats V2.



## Travel

Fares are priced zone to zone from `Money.ini [Plane]` (row = from, column = to). The matrix is not symmetric: Europe → North America is 800, the reverse 750. `[Hotel] BasePrice` = 50. How a trip is charged (return legs, staff fares, class multipliers) is not in any file.

| From \ to | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 North America | 300 | 500 | 750 | 1500 | 750 | 1000 | 1500 | 1800 |
| 2 Central America | 500 | 400 | 500 | 1800 | 1400 | 1300 | 1800 | 2000 |
| 3 South America | 750 | 500 | 400 | 2000 | 1800 | 1500 | 2000 | 2200 |
| 4 Africa | 1500 | 1800 | 2000 | 600 | 800 | 800 | 1500 | 2000 |
| 5 Europe | 800 | 1400 | 1800 | 800 | 300 | 600 | 1000 | 1500 |
| 6 Middle East | 1000 | 1300 | 1500 | 800 | 600 | 300 | 400 | 1400 |
| 7 Asia | 1500 | 2000 | 2500 | 1500 | 900 | 400 | 250 | 800 |
| 8 Oceania | 1800 | 2000 | 2200 | 2000 | 1500 | 1400 | 800 | 400 |

## Registration and ranking

- Registration opens a year ahead and closes 3–4 weeks before the event (TEM2 documentation). The planner uses a 4-week lockout.
- Ranking counts the best 18 singles results (junior: best 6) — `GameSys.ini [RankingATP] NbBestTrnS`.

## ATP categories

From ATP Realistic Stats V2. Points run winner first, then the loser of each round from the final back.

| Cat | Type | Tier | Events | Points (W, F, SF, QF, …) | Qualifying pts | Wildcards | TopPresence | Tax % |
|---:|---|---|---:|---|---|---:|---:|---:|
| 1 | GrandSlam | Grand Slam | 4 | 2000 1200 720 360 180 90 45 10 | 25 16 8 0 | 8 | 1.0 | 30 |
| 2 | MasterSeries | 1000 | 5 | 1000 600 360 180 90 45 25 10 | 16 8 0 | 5 | 1.0 | 30 |
| 3 | MasterSeries | 1000 | 5 | 1000 600 360 180 90 45 10 | 25 12 8 0 | 4 | 1.0 | 30 |
| 4 | TET500 | 500 | 4 | 500 300 180 90 45 20 0 | 10 4 0 | 4 | 0.6 | 30 |
| 5 | TET500 | 500 | 10 | 500 300 180 90 45 0 | 20 10 5 0 |  | 0.5 | 30 |
| 6 | TET250 | 250 | 2 | 250 150 90 45 20 5 0 | 5 2 0 | 4 | 0.4 | 25 |
| 7 | TET250 | 250 | 36 | 250 150 90 45 20 0 | 12 6 2 0 | 3 | 0.3 | 25 |
| 15 | MasterCup | Tour Finals | 1 | 900 400 0 200 0 |  |  |  | 30 |
| 16 | CountryCup | Team & Olympics | 3 |  |  |  | 0.9 | 0 |
| 17 | Challenger | Challenger / 125 | 22 | 125 75 45 25 10 0 | 6 4 2 0 |  | 0.55 | 20 |
| 18 | Challenger | Challenger / 125 | 91 | 90 55 33 17 8 0 | 5 3 2 0 |  | 0.5 | 20 |
| 19 | Challenger | Challenger / 125 | 37 | 75 45 27 13 6 0 | 4 3 2 0 |  | 0.45 | 20 |
| 20 | Future | Futures / ITF | 0 | 35 20 10 5 3 1 0 | 3 2 1 0 |  | 0.45 | 15 |
| 21 | Future | Futures / ITF | 66 | 33 19 9 4 1 0 | 3 2 1 0 |  | 0.45 | 15 |
| 22 | Satellite | Satellite / ITF low | 34 | 15 10 5 2 1 0 | 1 0 0 0 |  | 0.5 | 10 |
| 23 | UnitedCup | 500 | 0 | 750 450 340 270 135 70 35 5 | 5 0 0 0 | 4 | 0.4 | 25 |
| 25 | Exhibition | Team & Olympics | 0 | 0 0 0 0 0 0 |  |  | 0.93 | 25 |
| 30 | Olympics | Team & Olympics | 13 | 750 450 340 270 135 70 35 5 | 20 8 6 0 | 8 | 0.9 | 30 |
| 41 | GrandSlam | Junior | 4 | 5 2 1 0 0 0 0 | 25 20 5 0 | 8 | 0.95 | 0 |
| 42 | JuniorGradeAA | Junior | 2 | 4 2 1 0 0 0 0 | 10 5 1 0 | 5 | 0.92 | 0 |
| 43 | JuniorGradeA | Junior | 3 | 2 1 0 0 0 0 0 | 10 5 1 0 | 5 | 0.88 | 0 |
| 44 | JuniorGradeB | Junior | 39 | 1 0 0 0 0 0 | 2 1 0 | 3 | 0.55 | 0 |
| 45 | JuniorGradeB | Junior | 0 | 1 0 0 0 0 | 5 2 1 0 | 2 | 0.55 | 0 |
| 46 | JuniorGradeC | Junior | 0 | 0 0 0 0 0 0 | 4 2 1 0 | 3 | 0.5 | 0 |
| 47 | JuniorGradeC | Junior | 40 | 0 0 0 0 0 | 4 2 1 0 | 2 | 0.45 | 0 |
| 49 | JuniorGradeD | Junior | 0 | 0 0 0 0 0 0 | 3 2 1 0 | 3 | 0.35 | 0 |
| 50 | JuniorGradeD | Junior | 49 | 0 0 0 0 0 | 3 2 1 0 | 2 | 0.3 | 0 |

## WTA categories

From ATPWTA Patch. Points run winner first, then the loser of each round from the final back.

| Cat | Type | Tier | Events | Points (W, F, SF, QF, …) | Qualifying pts | Wildcards | TopPresence | Tax % |
|---:|---|---|---:|---|---|---:|---:|---:|
| 1 | GrandSlam | Grand Slam | 4 | 2000 1400 900 500 280 160 100 5 | 60 50 40 2 | 8 | 0.95 | 30 |
| 2 | PremierM | 1000 | 4 | 1000 700 450 250 140 80 50 5 | 30 20 1 | 5 | 0.9 | 30 |
| 3 | PremierM | 1000 | 6 | 1000 700 450 250 140 80 5 | 30 20 1 | 4 | 0.9 | 30 |
| 4 | Premier5 | 1000 | 1 | 900 620 395 225 125 70 1 | 30 20 12 1 | 4 | 0.8 | 30 |
| 5 | Premier5 | 1000 | 0 | 900 620 395 225 125 1 | 30 20 12 1 | 3 | 0.8 | 30 |
| 6 | Premier | 500 | 1 | 470 320 200 120 60 40 1 | 12 8 1 | 4 | 0.5 | 25 |
| 7 | Premier | 500 | 14 | 470 320 200 120 60 1 | 20 12 8 1 | 3 | 0.45 | 25 |
| 8 | IntlWTA | 250 | 0 | 280 200 130 70 30 15 1 | 10 6 1 | 4 | 0.4 | 25 |
| 9 | IntlWTA | 250 | 23 | 280 200 130 70 30 1 | 16 10 6 1 | 3 | 0.33 | 25 |
| 14 | MasterCup | Tour Finals | 0 | 195 75 0 35 75 |  |  |  | 30 |
| 15 | MasterCup | Tour Finals | 1 | 810 360 0 230 70 |  |  |  | 30 |
| 16 | CountryCup | Team & Olympics | 3 |  |  |  | 0.9 | 0 |
| 17 | Challenger | Challenger / 125 | 33 | 150 110 80 40 20 1 | 6 4 2 0 |  | 0.55 | 20 |
| 18 | Challenger | Challenger / 125 | 19 | 90 64 40 24 12 1 | 5 3 2 0 |  | 0.5 | 20 |
| 19 | Challenger | Challenger / 125 | 39 | 50 34 24 14 8 1 | 4 3 2 0 |  | 0.45 | 20 |
| 20 | Future | Futures / ITF | 31 | 15 12 8 6 3 1 0 | 3 2 1 0 |  | 0.45 | 15 |
| 21 | Future | Futures / ITF | 88 | 12 8 6 4 1 0 | 3 2 1 0 |  | 0.45 | 15 |
| 22 | Satellite | Satellite / ITF low | 117 | 10 7 3 1 0 0 | 1 0 0 0 |  | 0.5 | 10 |
| 23 | Satellite | Satellite / ITF low | 0 | 7 3 1 0 0 | 1 0 0 0 |  | 0.5 | 10 |
| 30 | Olympics | Team & Olympics | 13 | 750 450 240 120 75 35 5 | 20 8 6 0 | 8 | 0.9 | 30 |
| 40 | MasterCup | Tour Finals | 0 | 2 1 0 1 0 |  |  |  | 0 |
| 41 | GrandSlam | Junior | 4 | 5 2 1 0 0 0 0 | 25 20 5 0 | 8 | 0.95 | 0 |
| 42 | JuniorGradeAA | Junior | 2 | 4 2 1 0 0 0 0 | 10 5 1 0 | 5 | 0.92 | 0 |
| 43 | JuniorGradeA | Junior | 3 | 2 1 0 0 0 0 0 | 10 5 1 0 | 5 | 0.88 | 0 |
| 44 | JuniorGradeB | Junior | 39 | 1 0 0 0 0 0 | 2 1 0 | 3 | 0.55 | 0 |
| 45 | JuniorGradeB | Junior | 0 | 1 0 0 0 0 | 5 2 1 0 | 2 | 0.55 | 0 |
| 46 | JuniorGradeC | Junior | 0 | 0 0 0 0 0 0 | 4 2 1 0 | 3 | 0.5 | 0 |
| 47 | JuniorGradeC | Junior | 40 | 0 0 0 0 0 | 4 2 1 0 | 2 | 0.45 | 0 |
| 49 | JuniorGradeD | Junior | 0 | 0 0 0 0 0 0 | 3 2 1 0 | 3 | 0.35 | 0 |
| 50 | JuniorGradeD | Junior | 49 | 0 0 0 0 0 | 3 2 1 0 | 2 | 0.3 | 0 |

## Home-zone travel cost (2023 calendar, ATP)

Sum of one-way fares from each Coach Center zone to every event in the tier set (the career guide §7 comparison, regenerated). “Local” counts Futures, Satellites, and Challengers inside the zone.

| Home zone | Fut + Chall | + 250 | All senior | Local events |
|---|---:|---:|---:|---:|
| 5 Europe | 169,800 | 196,600 | 214,400 | 141 |
| 6 Middle East | 193,800 | 223,800 | 244,300 | 18 |
| 1 North America | 208,200 | 240,400 | 260,800 | 19 |
| 4 Africa | 268,500 | 313,200 | 345,200 | 19 |
| 7 Asia | 295,600 | 336,650 | 365,300 | 8 |
| 2 Central America | 308,600 | 355,900 | 387,200 | 3 |
| 3 South America | 376,350 | 434,350 | 473,600 | 37 |
| 8 Oceania | 404,700 | 461,000 | 501,500 | 5 |

## Surface mix by tier (2023, ATP)

| Tier | Clay % | Hard % | Synth % | Grass % | n |
|---|---:|---:|---:|---:|---:|
| Grand Slam | 25 | 25 | 25 | 25 | 4 |
| 1000 | 33 | 67 | 0 | 0 | 9 |
| 500 | 21 | 57 | 7 | 14 | 14 |
| 250 | 37 | 34 | 16 | 13 | 38 |
| Challenger / 125 | 61 | 35 | 3 | 1 | 150 |
| Futures / ITF | 59 | 41 | 0 | 0 | 66 |
| Satellite / ITF low | 32 | 59 | 9 | 0 | 34 |
| All senior | 52 | 40 | 5 | 3 | 315 |

## Local fixes to the mod files

Typos corrected in place in the installed ATPWTA Patch files by `fix_mod_files.py`, from `corrections.json`. The game and this site both read the corrected values. A Patch update from mod.io overwrites them: re-run `py fix_mod_files.py --apply`.

| Tour | Event | Field | Was | Now | Status | Why |
|---|---|---|---|---|---|---|
| ATP | ASB CLASSIC | Country | AU | NZ | applied | ASB Classic is in Auckland. XKT had NZ; the Patch changed it. |
| ATP | Dallas Open | Country | AU | US | applied | Dallas, Texas. XKT had US. |
| ATP | Plava Laguna Croatia Open Umag | Country | AT | HR | applied | Umag, Croatia. XKT had HR. |
| ATP | Canberra | Country | TR | AU | applied | Canberra, Australia. XKT had AU. |
| ATP | Nouméa | Country | TR | NC | applied | Nouméa, New Caledonia. XKT had NC. |
| ATP | Koblenz | Country | FR | DE | applied | Koblenz, Germany. XKT had DE. |
| ATP | Austria M15 | Country | AU | AT | applied | Named Austria M15. XKT had AT. |
| ATP | Baréin M15 | Country | BR | BH | applied | Baréin = Bahrain. XKT had BH. |
| ATP | Austria M15 | Country | AU | AT | applied | Named Austria M15. XKT had AT. |
| ATP | Australia M15 | Country | SE | AU | applied | Named Australia M15. XKT had AU. |
| ATP | Irvine | Country | RS | US | applied | Irvine, California. XKT had US. |
| ATP | Arad | Country | IL | RO | applied | The Arad Challenger is in Arad, Romania. XKT had RO. (A smaller Arad exists in Israel, but it hosts no tour event.) |
| WTA | Arad | Country | IL | RO | applied | ITF Arad, Romania. XKT had RO. |
| WTA | W15 Lakewood, CA | Country | TN | US | applied | Lakewood, California (the name says CA). Wrong in XKT too; found by the city audit. |
| WTA | Makarska 125K | Category | 24 | 17 | applied | Category 24 is not defined in TourCategory.WTA. The six other WTA 125K events (32 draw, $125,000 purse) are all category 17. Wrong in XKT too. |
| WTA | Irvine | Country | RS | US | applied | Irvine, California (same event as ATP Tournament370). Wrong in XKT too; found by the city audit. |

## Calendar values that differ from XKT

After local fixes. Rows marked “local fix” are corrections of errors that XKT also had.

| Tour | Event | Change | Note |
|---|---|---|---|
| WTA | Makarska 125K | Category 24 (XKT) → 17 (ATPWTA Patch) | local fix |
| WTA | W15 Lakewood, CA | Country TN (XKT) → US (ATPWTA Patch) | local fix |
| WTA | Irvine | Country RS (XKT) → US (ATPWTA Patch) | local fix |

## Open audit leads

Possible Country typos from `audit.py` that no one has reviewed yet. Reviewed false alarms are listed under `dismissed` in `corrections.json`.

- None

## Inferences

- **ground_codes:** Events without a Surface asset use the Ground code; CL/GR/HD/HD_BG/HR/IH map to their obvious types, RA and PC to Synthetic (the AO Plexicushion asset is Type 3), IN to Synthetic (Carpet). WTA ITF codes map by name: ITFCL Clay, ITFGR/ITFGRC Grass, ITFCAR Synthetic (Carpet), ITFHD/ITFHDD/ITFIN/ITFIH/ITFRE Hard (ITFRE is the least certain).
- **mod_precedence:** Layers apply in ascending Mods.ini [Priority]; a full file in a later layer replaces earlier ones, and <file>_Mod.ini merges key by key. Agrees with DependOn = XKT and the Player.log load list.
- **points_order:** EntryPoints lists winner first, then the loser of each round from the final backwards.
- **prize_order:** PrizeMoney lists the total purse ($-prefixed), then winner, finalist, and each earlier round.
- **two_week_events:** Singles draws of 96 or more span two weeks. Evidence: no ATP/WTA main-tour event is scheduled in the week after a 128-draw Slam or a 96-draw 1000 (only junior events fill it).
- **year_modulo:** YearModulo m with YearModulo+ offset o: included when (year + o) mod |m| == 0 for m > 0, and != 0 for m < 0. Reproduces the 52-year Olympic host cycle and the Montreal/Toronto alternation.

## Data issues found

- ATP Tournament006_DavisCupQualifiers: surface unresolved (Ground='', Surface=None)

## Source files

| File | Base layer | Patches | SHA-256 (base) |
|---|---|---|---|
| Ini/Tour.ATP.ini | ATPWTA Patch | — | `1af2149b08c5` |
| Ini/TourCategory.ATP.ini | ATP Realistic Stats V2 | — | `f72b1a124ee2` |
| Ini/Tour.WTA.ini | ATPWTA Patch | — | `db756bb788e2` |
| Ini/TourCategory.WTA.ini | ATPWTA Patch | — | `236bc1b45592` |
| Ini/Money.ini | TE4-ModdingSDK | — | `7c7323c66dc9` |
| Text/Countries_English.txt | TE4-ModdingSDK | — | `3a550960fb14` |
| Specifics/Ini/GameSys.ini | TE4-ModdingSDK | TE4-ModdingSDK, XKT, ATPWTA Patch | `351a7a3677a7` |
