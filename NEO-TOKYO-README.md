# STADA Neo-Tokyo Grand Prix 2026

Self-contained Next.js deliverable (Russian UI + EN/JP HUD). No external ChatGPT Sites proxy required for scores.

## Run

```bash
npm i
npm run build
npm run start
```

Dev mode: `npm run dev` → http://localhost:3000

## Race Control demo login

Open `/admin`:

- **Password:** `stada2026`
- Or 1-click **«Войти как Главный Директор Гонки (Демо)»**
- Sector judge demo: `judge2026` / button **«Войти как Судья Сектора (Демо)»**

## What changed

1. **Theme** — Neo-Tokyo night circuit, STADA 26 emblem, MALUK hero, ScoreTrack, renamed 14 scuderias + 9 sectors, April Race Weekend agenda
2. **Public features** — H2H duel, achievements, fan boost, briefing checklist + pit-lane pass, `/tv` paddock projector
3. **Race Control** — self-contained JSON score store, matrix 14×9, sector judge presets, bonuses, freeze Top-3 + broadcast banner, audit/undo/CSV/JSON, Load Demo / Reset
4. **MALUK GP** — floating race engineer (offline keyword + live telemetry Q&A, no OpenAI key)

## Notes

- Scores live in `data/race-state.json` (created on first run / Load Demo).
- Robot assets: `public/maluk-robot-nobg.png`, `public/maluk-avatar.png`, `public/maluk-robot.png`.
- Exclude from sharing rebuilds: `node_modules`, `.next` (reinstall with `npm i`).
