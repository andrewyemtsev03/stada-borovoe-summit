# STADA Neo Tokyo Grand Prix — reference redesign

Run with Node.js >=22.13.0:

    npm.cmd ci
    npm.cmd run build
    npm.cmd run start -- --hostname 127.0.0.1

The public frontend is rebuilt from the supplied white/red circuit reference. The Hero uses a rendered circuit asset restored from the reference with the built-in imagegen tool. Text, navigation, markers and controls are HTML/CSS. This is a raster 3D illustration, not WebGL.

Home and /leaderboard are now separate. Team cards show number/name and expand to reveal nicknames. Agenda uses a day rail and personal event timeline. Rules uses a newly authored four-page participant guide and an updated persistent checklist. The new PDF opens in a separate tab and downloads directly; no PDF viewer is embedded. Paddock TV is linked from the footer.

The original MP4 is public/intro.mp4. The real blank opening frame is public/intro-first-frame.webp. Entry plays the full supplied video once per session, regardless of site readiness, then fades the final frame to white before softly revealing the site. No custom logo or caption is overlaid. A skip button and failed/stalled playback safeguards remain. Participant selection opens only by an explicit button click.

API, data, scoring models and AI-agent sources remain unchanged. Race Control now has a separate black login and operations workspace. Public credential hints and demo-role entry buttons are removed; server authentication and access rules are preserved. New public CSS is isolated from admin and AI. Original dates remain April 13–16, 2026 in Asia/Tokyo.

Production build and TypeScript pass. Full lint retains three original effect-rule errors in admin/race-control.tsx, board.tsx and maluk-engineer.tsx; no new lint errors.

Browser checks cover responsive layouts, roster search/expansion, personal agenda, score polling/retry, tied and frozen scores, boost payloads, checklist persistence, documents, keyboard handling and all intro fallback/readiness/session paths. Mutating score and boost tests use intercepted responses.

Install dependencies and build after extracting the archive. node_modules and .next are excluded.

Live tv is linked in the shared public header, footer and Race Control header. Completed-agenda messages are no longer rendered in the bottom dock. Agenda omits lead labels from events and nested details. The favicon is a plain white S on red.
