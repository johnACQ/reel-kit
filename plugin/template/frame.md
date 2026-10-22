---
version: 1
name: My reels · frame
description: >
  The look for my talking-head reels. HyperFrames reads this before it builds anything.
  Frame = 1080 x 1920. My real footage fills the frame, clean white cards float in the top half,
  captions sit in the bottom third. One accent colour, always used as a fill with dark text on it.
  Setup fills the {{placeholders}} from brand.json. Change brand.json, not this file, then ask Claude to refresh it.
unit: the frame, 1080 x 1920
principle: real footage leads · each card teaches one thing · the accent is a fill, never text on white

colors:
  ink: "{{ink}}"            # all type on cards and inside accent fills
  card: "#FFFFFF"           # card panels
  card-soft: "#F4F6F8"      # inner rows, icon wells
  muted: "#5B6670"          # secondary text on white
  accent: "{{accent}}"      # THE accent, as a fill only, with ink type on it
  caption: "#FFFFFF"        # caption words, with a shadow over footage
  red: "#FF4D4D"            # strike-throughs and "before" only

typography:
  display: { fontFamily: "{{displayFont}}", note: "titles and one-word step names, uppercase" }
  body: { fontFamily: "{{bodyFont}}", note: "labels, captions, everything else" }
  mono: { fontFamily: "Roboto Mono", note: "prompts and small kickers" }
  caption: { fontFamily: "{{bodyFont}}", px: 58, weight: 900, note: "3 or 4 words a group, the spoken word in an accent box" }

logo: "{{logo}}"

spacing:
  safe-top: "220px"
  safe-bottom: "440px"
  safe-right: "160px (the Instagram buttons sit there)"
  card-zone: "y 220 to 1150, the top half, beside or above the face"
  caption-band: "y 1280 to 1470"

elevation:
  card: "0 24px 60px rgba(11,15,18,.28)"
---

## Overview
A reel reads like a whiteboard held up next to me: my real footage, and one clean card per point.
The card teaches; the caption carries my voice. The accent marks the one thing to look at.

## The frame
Cards live in the top half and never cover my eyes for longer than a step. Captions live in the bottom third.
Keep 160 px clear on the right for the app's buttons.

## Effects
Every effect comes from the reel-kit library, already in these colours. Which effect fits which line is in the
kit's PICKER.md. Each beat on the beat sheet names its effect and why.
