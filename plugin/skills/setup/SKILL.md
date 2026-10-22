---
name: setup
description: One-time setup for reel-kit. Checks the computer has what it needs, installs HyperFrames, makes the Reels folder and sets up the user's look (colours, fonts, logo), then offers a practice clip. Use when the user runs /reel-kit:setup, says "set up reel-kit" or "set up my reels", or asks to edit a reel when there is no brand.json in their Reels folder yet.
---

# Reel kit: setup

The person may never have used a terminal. Talk in plain English, one step at a time. Ask before every install and say in one line what it's for. Never install anything they haven't said yes to.

Files for this kit live in `${CLAUDE_PLUGIN_ROOT}`: `template/` (starter files), `scripts/rebrand.mjs` (puts the effects in their colours), `effects/` (the effects library).

## 1. Check the computer

Run `node -v` and `ffmpeg -version`.

- Node.js must be 22 or newer. FFmpeg must be installed.
- If something is missing, say what it is, why it's needed, and the command you'd run. Wait for a yes.
  - Mac with Homebrew (`brew -v` works): `brew install node ffmpeg`.
  - Mac without Homebrew: offer to install Homebrew from brew.sh first, or point them to the Node.js LTS installer on nodejs.org.
  - Windows: `winget install OpenJS.NodeJS.LTS` and `winget install Gyan.FFmpeg`.
  - Linux: their package manager.
- After installing, run the checks again and show the versions.

## 2. Install HyperFrames

HyperFrames is the free, open-source engine that turns the edit into a video. Claude writes the edit as a web page and HyperFrames renders it to an MP4.

1. `claude plugin marketplace add heygen-com/hyperframes`
2. `claude plugin install hyperframes@hyperframes`
3. `npx hyperframes doctor`. Explain the result in plain English: what's ready, what isn't, and the fix for anything that isn't.
4. HyperFrames sends anonymous usage data by default. Tell them, and offer to turn it off with `npx hyperframes telemetry disable`.
5. Tell them to type `/reload-plugins` (or close and reopen Claude Code in this folder) so the HyperFrames skills load. Setup carries on after that.

## 3. Make the Reels folder

- If this folder is empty or is already called Reels, use it. If not, ask whether to make a `Reels` folder here.
- Copy every file from `${CLAUDE_PLUGIN_ROOT}/template/` into it: `CLAUDE.md`, `EDITING-STYLE.md`, `FILMING-CARD.md`, `frame.md`, `brand.json`.
- Never overwrite a file that's already there. If one exists, show the difference and ask.

## 4. Their look

Ask three things, one message:
- Brand colours (hex codes), or their website so you can pull them.
- Fonts, or keep the defaults (Bebas Neue for titles, Roboto for everything else).
- A logo file (optional).

If they give a website, fetch it and pull the main brand colour and fonts. Show what you found and ask them to confirm.

Then:
1. Write `brand.json`: `accent` (the one accent colour), `ink` (dark text colour, default `#0B0F12`), `displayFont`, `bodyFont`, `logo` (file name or blank). Use Google Fonts names so renders can load them.
2. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/rebrand.mjs" --brand brand.json --check`. Dark text always sits on the accent colour, so the accent has to be light enough to read. If the script lightens it, show old and new in one line and say why.
3. Fill the placeholders in `frame.md` from `brand.json`.
4. Show them their look: make a sample project `_look/` (`HYPERFRAMES_SKIP_SKILLS=1 npx hyperframes init _look --example blank --resolution portrait --non-interactive`), copy the effects in with `node "${CLAUDE_PLUGIN_ROOT}/scripts/rebrand.mjs" --brand brand.json --out _look/compositions`, and mount a cover title (0 to 2 s), a step card (2 to 4 s) and a line of captions across the 5 s over a plain dark background. Mounting rules are in `${CLAUDE_PLUGIN_ROOT}/effects/CATALOG.md`. Run `npx hyperframes check`, render it, pull a still from the middle, look at it yourself, then tell them where the MP4 is. If they want changes, change `brand.json` and run it again.

## 5. Practice clip (offer it)

Ask: "Want to practise on a raw take before you film your own?"

If yes, download it into `practice/take.mp4`:

```
curl -L --fail -o practice/take.mp4 https://github.com/johnACQ/reel-kit/releases/download/v1.0.0/practice-take.mp4
```

What it is: a 3.5-minute raw selfie take from John Milne, five steps for setting up your AI so it stops giving you junk. The pauses, the repeated lines and three false starts are all still in. That's the point: the edit has to find the best read of each line and cut the rest. The finished reel it became is in the guide. Tell them to say: "edit practice/take.mp4".

## 6. Done

Say in four lines:
- One folder per reel. Drop the take in it.
- Say "edit take.mov" (or whatever the file is called).
- You'll get a beat sheet to OK before anything renders.
- Read `FILMING-CARD.md` before filming. The first full run takes about half an hour; rebuilds after notes take a couple of minutes.
