---
name: edit
description: Edit a talking-head reel with HyperFrames. Transcribes the take, cuts the pauses and bad takes, writes a beat sheet for the user's OK, then builds captions, cards and effects in their colours, checks every cut and exports. Use when the user asks to edit, cut, caption or add effects to a video in their Reels folder ("edit take.mov"), gives notes on a cut ("at 0:12 hold that longer"), asks to check a test shot ("check my test shot, test.mov") or a finished reel, or wants a note saved as a default ("make that the default").
---

# Reel kit: edit

## Before anything

1. Read `CLAUDE.md`, `EDITING-STYLE.md`, `frame.md` and `brand.json` in the Reels folder. No `brand.json`? Run the reel-kit `setup` skill first.
2. Load the HyperFrames skills before you write any composition HTML: the `hyperframes` entry skill (it carries the composition rules and their references), then `hyperframes-cli` for commands. If they aren't installed, stop and run `setup`.
3. The effects library is in `${CLAUDE_PLUGIN_ROOT}/effects/`:
   - `CATALOG.md`: what each effect shows, its variables, how to mount it.
   - `PICKER.md`: which effect fits which kind of line, and why.
   - `recipes/`: effects that move the footage itself (zooms, word behind the head, raw-to-edited wipe).
4. Checks in detail: `${CLAUDE_SKILL_DIR}/checks.md`.
5. If the reel's folder has a `BRIEF.md`, read it first. It answers the usual questions (names, what goes on screen, lines to keep or cut).
6. Write any helper scripts in Node, which is already installed for HyperFrames. Don't assume Python is there. Keep every working file inside the reel's `edit/` folder, never in a temp folder elsewhere.

Tell them up front: the first full run takes half an hour to an hour (a 3.5-minute raw take took about 50 minutes on a fresh install). Notes after that rebuild in a couple of minutes.

## Rules that never bend

- Real footage of real people. No AI faces, no cloned voice, no stock footage passed off as theirs.
- No fake screenshots, texts, reviews or dashboards. On a real screenshot, blur names and numbers unless the owner says it's OK.
- Every number on screen gets a small source tag. Don't know the source? Ask. Never make one up.
- Captions say what they said. Never smooth the words, and never change a number or a "not".
- Music only if they have the rights to it.
- Never cut inside a word.
- Nothing renders until they OK the beat sheet.
- Never change or delete their original footage. Work on copies.

## Stage 1: Look at the footage

- `ffprobe` every file: duration, size, rotation, frame rate, streams. Phone .MOV files carry extra data tracks, so always map `0:v:0` and `0:a:0`.
- Pull three stills with ffmpeg and look at them. Check whether the picture is mirrored (text in the background reads backwards means `hflip`), plus framing, headroom, light on the face, and anything private on a screen behind them.
- A 5-second test shot? Review it against `FILMING-CARD.md`, tell them exactly what to move, and stop there.
- Working files go in `edit/` inside the reel's folder.

## Stage 2: Transcribe

- `npx hyperframes transcribe <take> --model medium.en --json`. The default small model mishears numbers and "not", so use medium.
- Ask once for names to get right (their name, business, town, product), then check them in the transcript.
- List every effect they asked for out loud ("zoom in on my hand", "put the three steps up here") with the time of the exact word.

## Stage 3: Cut plan

- A line said more than once: keep the cleanest complete read (often the last one). Say which you kept and why.
- Cut false starts, bad takes and dead air. Keep a breath of air, about 0.15 s, at each edge. Don't strip every pause.
- Every edge sits in the silence between words. Word times from transcription drift by up to a tenth of a second, so find the real gap in the audio (`silencedetect`, or the audio level around the word) before you place a cut.
- 30 ms audio crossfade at every join.
- Write `edit/CUTS.md`: one row per kept piece with the line, source in and out, and why.
- Build the cut a-roll: `edit/aroll.mp4`, 1080 x 1920, H.264 + AAC, flipped if it was mirrored.

## Stage 4: Beat sheet (stop here)

Write `BEAT-SHEET.md` in the reel folder. Put the cut's total runtime at the top, against the target length (from `BRIEF.md`, or ask; 45 to 60 seconds if they don't say). More than 10 percent over? List the lines you'd cut to hit it, so they can pick before anything is built. Then one row per moment:

| Time (cut timeline) | Their words | On screen (effect from CATALOG, real footage or graphic) | Where the text sits | Sound | Why this effect |

- The hook lands in the first 2 seconds.
- A new visual about every 4 seconds. Never the same kind twice in a row. At most one zoom every 5 seconds.
- Effects they asked for out loud land on that exact word.
- Leave their best line clean, with nothing on screen but them.
- Every "why" comes from `PICKER.md`, one line each.
- Where you can, add stills of the key beats (`npx hyperframes snapshot` on a rough build).

Show it and ask one question: "OK to build, or changes?" Do not render until they say OK.

## Stage 5: Build

1. Project: `HYPERFRAMES_SKIP_SKILLS=1 npx hyperframes init build --example blank --resolution portrait --non-interactive` inside the reel folder, then copy `edit/aroll.mp4` into `build/assets/`. The switch stops init copying the HyperFrames skills into their personal skills folder on every reel (the plugin already has them). Init also writes its own `CLAUDE.md` into `build/`: that's HyperFrames' file, leave it.
2. Effects: `node "${CLAUDE_PLUGIN_ROOT}/scripts/rebrand.mjs" --brand ../brand.json --out build/compositions`. That copies the effects in their colours. Never symlink them: the bundler reads a symlinked folder as empty.
3. Mount each beat as a clip exactly as `CATALOG.md` shows (`data-composition-src`, `data-start`, `data-duration`, `data-track-index`, `data-variable-values`). Give every clip a stable `id`.
4. Captions: one captions clip across the talk, with the words and their times moved onto the cut timeline. Three or four words at a time, bottom third (y 1280 to 1470 at 1080 x 1920), the word being said highlighted. Never move the text up over the face.
   - If the mouth or chin sits in that band (common on a tight selfie), lift the face instead: punch in on the a-roll anchored at the bottom (`transform-origin: 50% 100%`). Each point rises by (1920 minus its y) times (scale minus 1), so a mouth at y 1300 needs about `scale(1.12)` to clear 1230. Check a still.
   - If that crops too much off the top of the head, move the sharp shot up instead and fill the gap underneath with a blurred, darkened copy of the same footage on the track below.
   - Note the reframe in the beat sheet. Never break the caption rule without asking.
5. Effects that move the footage are host recipes in `recipes/`, not components. For a word behind the head, cut them out of the FINAL a-roll: `npx hyperframes remove-background assets/aroll.mp4 -o assets/subject.webm --quality best`.
6. Text cards never say a word before they say it. Use the reveal timing each card offers.
7. `npx hyperframes check` must pass before you render.

## Stage 6: Check before they watch

Follow `checks.md`. In short:
1. Render: `npx hyperframes render`.
2. Transcribe the render and read the words within a second of every join. A half-word or a stray word from the next sentence means you move that edge, rebuild and check again (three passes at most).
3. Contact sheet with a still at every cut and every caption change. Look for text over the face, captions that don't match the words (every number, every "not"), numbers with no source, and effects that arrive early.
4. Duration, 1080 x 1920, audio present, peaks under -1 dBFS.
5. Say what you checked and what you couldn't. You can't hear it, so tell them to watch it once with the sound on, start to finish, before they post it.

## Stage 7: Notes, defaults, export

- Notes come as time + change + scope. If the scope isn't clear, ask: "this reel, or every reel?"
  - This reel only: save it to the reel's `FEEDBACK.md` and fix it.
  - Every reel: add it to `EDITING-STYLE.md` with today's date, and make sure `CLAUDE.md` says to read that file before every edit.
- A revision of an approved cut skips the beat-sheet stop unless it adds new beats. Show a still of each changed spot.
- Export: the final at 1080 x 1920, plus a phone copy under 30 MB (H.264, fast start). Name versions v1, v2, v3. Never overwrite an older version.
