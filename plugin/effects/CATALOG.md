# Effects catalog

38 ready-made HyperFrames effects for a vertical (1080 x 1920) talking-head reel, plus 5 recipes for the moves
that have to change the footage itself. Which one to use on which line is in `PICKER.md`.

## Getting them into a reel

1. Copy them into the reel project in your colours and fonts (never a symlink; the renderer reads a symlinked
   folder as empty):

   ```
   node <reel-kit>/scripts/rebrand.mjs --brand brand.json --out compositions
   ```

   It also embeds your fonts and re-measures your letters, so words that are sized to fit still fit.
2. Mount an effect as a clip in the reel's `index.html`. Per-use text goes in `data-variable-values`:

   ```html
   <div id="step-1" class="clip" data-composition-id="step-card" data-composition-src="compositions/step-card.html"
     data-start="3.6" data-duration="1.8" data-track-index="3" data-width="1080" data-height="1920"
     data-variable-values='{"step":"01","total":"04","title":"FILM","label":"One take on your phone"}'></div>
   ```

3. Lock every time to the spoken word, from the word timings in your transcript.
4. Look at a still of every effect before you render (`npx hyperframes snapshot --at <seconds>`), then run
   `npx hyperframes check`.

## Rules that apply to every effect

- **Give every clip its own `id`.** The same effect can be mounted many times in one reel.
- **Paths start with `compositions/`**: images and icons resolve from the reel's root folder.
- **Placement is per shot.** Most effects take `top`, `centerX` and `scale`. Defaults assume waist-up framing
  with room above the head. On a tight selfie, drop the effect lower or shrink it, and check the still so it never
  sits over the eyes.
- **Safe zone:** cards in the top half (y 220 to 1150), captions in the bottom third (y 1280 to 1470), and keep
  the right 160 px clear for the app's buttons.
- **The accent is a fill, with dark type on it.** Never accent-coloured text on a white card.
- **Real or nothing.** Screenshots, quotes, times and numbers on screen must be real. Several effects refuse fake
  ones on purpose (see "Watch for").
- **A comment word** (comment-drop, comment-reply, comment-cta) only goes in a reel once that word's automatic
  reply is set up and tested on a second account. Until then, use "follow for the next one".

## The effects

### Titles and hooks
| Effect | What it shows | Use it for | Main variables | Watch for |
|---|---|---|---|---|
| `cover-title` | The hook in a big accent box at the top, with a small white tag under it. | The opening line, on screen from 0:00. | title, tag, titleFont, titleCase, titleSize | Keep it to one short line of thought. |
| `kinetic-hook-behind` | One huge word that sits behind your head while you stay in front of it. | A hook that has to look expensive. | word, kicker, wordSize, wordY, wordAt, outAt, style | Needs a cut-out of you (`npx hyperframes remove-background`) and the host layering in `recipes/kinetic-hook-behind.md`. Most of every letter must still show. |
| `title-card-shrink` | A full-screen chapter card with a running timecode, then your footage pops back as a phone and grows to full screen. | A chapter opener in a longer reel. | title, kicker, timecodeStart, bg, font, phoneAt | The footage half is the recipe `recipes/title-card-shrink.md`. Costs about 2 s, so skip it in short reels. |

### Lists and steps
| Effect | What it shows | Use it for | Main variables | Watch for |
|---|---|---|---|---|
| `step-card` | A white card: STEP 01 / 04, one big word, an icon, a short label. | Each step of a numbered list. | step, total, title, label, icon, titleAt | One word per title. `titleAt` keeps the word hidden until you say it. Icons: phone, calendar, list, chart, search, star, message, shield, mic, film, folder. |
| `step-stack` | 2 to 6 words pop in one at a time in accent boxes, with number chips. | A quick run of steps. | words (split with \|), times, layout, numbers, size | With 4 words on auto size it may stack 2 x 2. Pass `size` to force one row. |
| `redact-list` | Blank bars that fill in with each word as you say it. | "Five things" when you want them waiting for the reveal. | words, times, kicker, size | Say the count first so the blanks make sense. |
| `chapter-tracker` | A small side list with the current item lit and a 01 / 05 counter. | A long list, so people stay for the last item. | title, items, times, top, width | Keep the side of the frame it sits on clear when you film. |
| `storyboard-deck` | Five thumbnails fan out with labels (HOOK, PROBLEM, STEP...). | "Here's the whole plan" moments. | title, img1 to img5, label1 to label5 | Ships with grey sample frames. Swap in stills from your own footage. |
| `split-card` | A card beside you that builds 2 to 5 short lines with ticks. | "Three things: tripod, waist up, good light." | kicker, line1 to line5, times, marker | Used with the recipe `recipes/speaker-split.md`, which shrinks your footage into a card beside it. |

### Showing how it works
| Effect | What it shows | Use it for | Main variables | Watch for |
|---|---|---|---|---|
| `prompt-bar` | A chat bar that types your line and presses send. | "I just told Claude to..." | text, label, typeStart, sendAt | Short prompts only. Lock `sendAt` to the word. |
| `prompt-flash` | A dark card with a real prompt, shown for under a second. | A long prompt you'll give away elsewhere. | label, prompt | Host clip 0.5 to 0.8 s, hard cut in. The prompt must be the real one. |
| `prompt-card` | A dark card where a real prompt reveals line by line, with an optional chip. | A prompt you want people to actually read. | label, prompt, chip, lines, size, reveal | 40 to 44 px reads on a phone. |
| `file-drop` | A file falls into a drop zone, a counter ticks up, a tick lands. | "I just drop the clips in." | zoneLabel, fileName, fileMeta, count, thumb, playBadge | Turn `playBadge` off for a document. |
| `editing-timeline` | A video editor timeline with clips snapping in and a playhead. | "No editing software." | title, timecodeStart, tracks, clipName | Video topics only. |
| `filmstrip` | A tilted strip of frames sliding past, with a count chip. | "It's only as good as your footage." | img1 to img6, count, chip, kicker, direction | Use real stills from your raw takes, and a real count. |

### Proof
| Effect | What it shows | Use it for | Main variables | Watch for |
|---|---|---|---|---|
| `proof-card` | A real headline screenshot on a card with a source chip. | Backing up a claim with where it came from. | screenshot, source | A real screenshot only, source always on. |
| `path-ring` | A ring that hops between parts of a screen recording, landing on each as you say it. | Walking through a real screen. | boxes, times, press, dim, mapX, mapY, mapScale | Record the screen still (no scrolling) or the boxes drift. Blur names and numbers you can't show. |
| `stat-card` | One to three big numbers or label lines with a slam and a source chip. | A number you want remembered. | line1 to line3, unit1 to unit3, source, slamAt | Refuses currency signs. A blank source shows SOURCE NEEDED. Real, sourced numbers only. |
| `clock-counter` | A digital clock that runs from one time to another and stamps DONE. | "Start to finish in..." | from, to, label, source, runAt, runDur | Use real recorded times. It never runs past the end time. |
| `quote-card` | A quote in a serif card with big quote marks and who said it. | Someone else's words, word for word. | quote, attribution, font, width | Real quotes only, with who said it and where. |
| `claim-bars` | A long accent bar (the claim) next to a short grey bar (the proof), and the long one shrinks. | "They say a lot more than they can back up." | labelA, labelB, ratio, shrinkAt | No numbers by design: a label with a digit falls back to its default. |
| `ab-split` | A red "wrong" card cracks and falls away, a green "right" card slides in. | Before and after, old way and new way. | beforeLabel, beforeLine, afterLabel, afterLine, beforeImg, afterImg, crackAt | Screenshots must arrive already blurred where names show. |
| `tool-card` | A card naming a tool, its category, and what it replaces. | Tool recommendations. | kicker, category1, category2, tool, replaces, saves | Only put a saving or a price in `saves` if you checked it on the vendor's own page that day. Otherwise leave it out. |

### A change on screen
| Effect | What it shows | Use it for | Main variables | Watch for |
|---|---|---|---|---|
| `grade-wipe` | A divider slides across the live shot: before on one side, after on the other. | A look, a grade, a raw take vs the edit. | beforeFilter, afterFilter, labels, handleY, sweepAt | Hold still for 2 s. For raw take vs edit use `recipes/raw-wipe.md`: a video inside an effect does not render. |
| `eyedropper-grade` | An eyedropper picks colours off the frame, a palette pops up, the shot regrades. | "Match my brand colours." | hex1 to hex4, label, targetFilter, pickX, pickY | A grading demo, not a general effect. |

### Punch words
| Effect | What it shows | Use it for | Main variables | Watch for |
|---|---|---|---|---|
| `punch-word` | One word, full frame, hard cut. | The one word you want remembered. | word, bg, color, size | At most one every 5 s. |
| `highlighter` | A phrase with a highlighter wipe behind it. | A line worth a second read. | text, font, holdFor, size | Use it rarely, or it stops meaning anything. |
| `gravity-drop` | A word in an accent box that falls apart letter by letter. | Loss words: gone, dead, lost, dropped. | word, kicker, holdFor, size | Wrong feeling on positive words. |

### "You don't need these"
| Effect | What it shows | Use it for | Main variables | Watch for |
|---|---|---|---|---|
| `jiggle-delete` | App tiles jiggle like edit mode on a phone, then delete one by one. | "Delete these apps." | label1 to label4, glyph1 to glyph4, icon1 to icon4, header | Ships with plain tiles. Only add a real app's icon (`icon1`...) if you're happy naming that app on screen. |
| `icon-strike` | 2 to 4 tiles get struck through and drop, then a word stamps in. | A quick "you don't need X or Y." | count, label1 to label4, glyph1 to glyph4, word | Same icon note as jiggle-delete. |

### Phones and people
| Effect | What it shows | Use it for | Main variables | Watch for |
|---|---|---|---|---|
| `two-phones` | Your phone gets the plan while the other guy's phone rings unanswered. | Speed: who gets there first. | leftLabel, rightLabel, docTitle, callerName, landAt | Tall: use `scale` 0.85 if your head sits high in frame. |
| `phone-race` | One customer's phone, with several businesses' tiles crashing into it at once. | "Everyone's racing for the same customer." | phoneLabel, youLabel, count, jamAt | Plain tiles only, never real business names. |
| `share-card` | A share sheet: a paper plane flies to a contact and the button flips to Sent. | "Send this to someone who..." | chipLabel, sendText, sentText, flyAt | The contact is a role, never a real person. |
| `price-bounce` | An AI cursor tries to type a price and gets bounced; you type it instead. | "AI can't price your job." | label, aiNote, youText, aiTry | Never shows a figure: any digit or currency sign falls back to the default. |

### Calls to action
| Effect | What it shows | Use it for | Main variables | Watch for |
|---|---|---|---|---|
| `comment-drop` | Your keyword slams in, gets typed into a comment bar and posted. | Mid-reel, so people see what to type. | word, user, typeStart, postAt | Only once that word's auto-reply is live and tested. |
| `comment-reply` | A reply drops under the comment: "Sent. Check your DMs." | Shows what happens after they comment. | word, handle, initials, reply, chain | Same rule. Set `handle` and `initials` to yours. |
| `comment-cta` | The closing card: comment WORD for the guide, plus a share line. | The end card. | word, guide, share | Same rule. Without a working auto-reply, show the share line alone. |

### Captions
| Effect | What it shows | Use it for | Main variables | Watch for |
|---|---|---|---|---|
| `captions` | Three or four words at a time in the bottom third, the spoken word highlighted. | Every reel. | text, times, dur, per | One clip across the whole talk, with `data-track-kind="captions"`. `times` = each word's start time from the transcript. |

## Recipes (`recipes/`)

These moves change your footage, so they live in the reel's own `index.html`, not inside an effect. Each file has
the tested code plus where each piece goes.

| Recipe | What it does | Why it's a recipe |
|---|---|---|
| `film-look.md` | Warm film grade on a story section, easing in and back out. | The grade has to sit on your real video. |
| `kinetic-hook-behind.md` | Layers your footage, the word and your cut-out so the word sits behind your head; drops the shot if there's no headroom. | Only the reel itself can stack your footage. |
| `title-card-shrink.md` | Turns your footage into a phone after the chapter card, then grows it back. | The footage itself moves. |
| `speaker-split.md` | Shrinks you into a card on the left while `split-card` builds on the right, then grows you back. | The footage itself moves. |
| `raw-wipe.md` | Before/after where "before" is a raw take and "after" is the finished edit. | A video inside an effect drops out of the final render. |

## Known traps

- A `<video>` inside an effect always plays from 0 and is dropped from the final render. Anything that moves or
  plays footage is a recipe.
- Effects find their own parts by class, so mounting one twice is fine. If you edit an effect, keep it that way:
  a selector built on `data-composition-id` finds nothing the second time.
- Text that the renderer measures (step-stack, highlighter, punch-word, quote-card, redact-list) uses tables of
  real letter widths. `rebrand.mjs` rebuilds them for your fonts. If it says "widths estimated", check every one of
  those words in a still.
- Small labels (source chips, kickers) sit near the 28 px phone-reading floor. Don't shrink an effect below about
  0.8 scale.
