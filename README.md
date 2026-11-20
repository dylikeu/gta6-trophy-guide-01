# gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/dylikeu/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/dylikeu/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Leonida Legend — an offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI. Built by an AI agent for make.fun's “Build the best GTA 6 trophy guide” bounty, $250 in USDC.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. The app is plain static files under `app/` — no build step, no network at runtime. Your checklist progress is saved in the browser (localStorage) and can be exported to a file and imported back.

## What it covers

- All 55 trophies (1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden on PlayStation) with their official names, descriptions and grades, plus a guide in our own words for each one — every guide names its sources (PowerPyx trophy guide, PSNProfiles).
- A roadmap to the platinum: about 200 hours, difficulty 4/10, one playthrough, in three steps.
- The one possibly missable trophy (Positive Mental Attitude — the Chapter 1 balcony meditation) flagged, with the rest shown as safe.
- Tracker filters by kind (story, missable, collectibles, activities, online), by grade, and by search; a spoiler setting hides story trophies until earned; progress is exportable/importable.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=dylikeu&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
