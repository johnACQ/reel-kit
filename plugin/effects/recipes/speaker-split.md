# speaker-split (host recipe + the `split-card` component)

The code below is the tested Python function that writes this effect's host HTML, CSS and timeline lines.
Run it from a small build script (it only needs `json`), or have Claude port the same layers straight into your
reel's `index.html`. The numbers are tuned for a 1080 x 1920 talking-head reel.

The "let me show you" move.
The speaker's own footage shrinks into a white-bordered rounded card on the left (scale 0.38, 410 x 730 px at x 72,
y 310, 8 px white border, 28 px corners, soft shadow) over a blurred, slightly darkened copy of itself. A white
explainer card (`components/split-card.html`) slides in on the right and builds 2-3 short Bebas lines, each with a
cyan tick (or 01/02/03, or a dot) that lands on its spoken word. The card leaves, then the footage grows back to full
frame and the reel carries on with no cut. About 2.3-3 s. The same idea as the inset punch-out used with two-phones.

Why a recipe and not a component: the footage itself has to move, and a component cannot reach the host's video (a
`<video>` inside a component always plays from 0). The function mounts `split-card` with times converted to the
card's own clock and `dur` = the split length, so the card always leaves before the footage grows back.


## How to use it in an edit's build
1. Make the blurred backdrop from the SAME a-roll file the edit plays (same trim, same timing):
   `ffmpeg -i assets/aroll.mp4 -vf "scale=270:480,boxblur=18:2,eq=brightness=-0.06:saturation=0.85,scale=1080:1920,format=yuv420p" -an -c:v libx264 -crf 20 assets/aroll_blur.mp4`
   and put it first, full frame, with the a-roll's own `data-start` / `data-media-start` / `data-duration`.
2. Copy `components/split-card.html` (+ `components/assets/fx_screen/fonts/`) into the project's `compositions/`.
3. Copy the function below into your reel's build script (it only needs `json`) and call it with GLOBAL seconds locked to
   the words: `at` = the word that introduces the points, `line_times` = each point's word, `out_at` = the word you
   come back on (about 0.25 s after the last line has had a second on screen).
4. Host order, bottom to top: blurred copy video -> `html[0]` (the scrim div) -> ONE non-timed `#stage` wrapper
   (position:absolute; inset:0; overflow:hidden) holding every sharp footage layer -> `html[1]` (the card) -> captions.
   Put `css` in the host `<style>`; the `js` lines go in the host's main timeline script (the `gsap.set` line sits
   outside the timeline).
5. Snapshot the shrunk state and each line (`npx hyperframes snapshot --at ...`), then `npx hyperframes check`.

Placement: the speaker card ends at y 1040, so the caption band (y 1280-1470) stays clear and captions can keep
running. The explainer card defaults to x 506-920 (inside the 160 px IG rail), vertically centred on the speaker card.
All lines share one size: the longest line shrinks from `size` (76 px) to fit, down to 48 px, then lines wrap; keep each line to 2-3 words. The card arrives as an empty checklist (grey wells, dividers) and each line fills in on its word.
Waist-up footage with headroom (see the filming card) reads best: the shrunk card is itself a clean waist-up frame. On a tight
selfie the card is mostly face, which still works. Hold still and keep talking through the split; a big lean or a hand
across the lens reads as a mistake in a small card.

## split-card variables
`kicker` (blank = none), `line1`, `line2`, `line3` (blank = two lines), `line4`, `line5` (blank = none; for a 4-5 item list), `times` (s from the card's clip start; the recipe
converts), `marker` (tick / num / dot / none), `inAt` (card slides in; the recipe sets 0.72 x shrink), `dur` (exit in the
last 0.24 s), `left`, `top`, `width` (the recipe derives them from the speaker card), `size` (max line px).

## The function
```python
def speaker_split(at, out_at, line_times, card_vars=None, scale=0.38, cam_x=72, cam_y=310, border=8, radius=28,
                  shrink_dur=0.42, grow_dur=0.40, stage="#stage", scrim="#split-scrim", scrim_alpha=0.30,
                  hid="split-card-1", track=30):
    """Host side of the speaker-split move: the host's own footage shrinks into a white-bordered rounded card on the
    left, the split-card COMPONENT builds 2-3 lines on the right, then the footage grows back to full frame.

    HOST CONTRACT (same idea as the inset punch-out used with two-phones):
      - a full-frame BLURRED COPY of the a-roll (timed like the a-roll) sits under everything; it is what shows
        around the card. Make it with ffmpeg (see the recipe doc). A solid fill also works.
      - `scrim` (an empty div, position:absolute; inset:0) sits right above the blurred copy; it darkens it.
      - every sharp footage layer lives inside ONE non-timed wrapper `stage` (position:absolute; inset:0;
        overflow:hidden), above the scrim. Captions and other overlays go after the stage.
      - mount html[1] (the card) after the stage.
      at          global s the shrink starts (lock to the word that introduces the points)
      out_at      global s the footage starts growing back (the card has left by then)
      line_times  global s each line lands (one per line; lock to the spoken words)
      card_vars   split-card variables: line1..line5, kicker, marker (tick/num/dot/none), size (left/top/width
                  are set here from the speaker card unless you pass them)
      scale, cam_x, cam_y   speaker card size and top-left (0.38 = 410 x 730 px at 72, 310 -> ends x 482, y 1040)
      border, radius        white border and corner radius in final px (divided by scale for the scaled wrapper)
    """
    s = scale
    full = "x:0,y:0,scale:1,borderRadius:0,boxShadow:'0 0 0 0px rgba(255,255,255,0), 0 0px 0px rgba(11,15,18,0)'"
    card = (f"x:{cam_x},y:{cam_y},scale:{s},borderRadius:{radius / s:.1f},"
            f"boxShadow:'0 0 0 {border / s:.1f}px rgba(255,255,255,1), 0 {26 / s:.0f}px {70 / s:.0f}px rgba(11,15,18,.45)'")
    gap = 24
    vals = {"left": round(cam_x + 1080 * s + gap), "width": round(920 - (cam_x + 1080 * s + gap)),
            "top": round(cam_y + 1920 * s * 0.5 - 205), "inAt": round(shrink_dur * 0.72, 3),
            "dur": round(out_at - at, 3), "times": ",".join(f"{t - at:.2f}" for t in line_times)}
    vals.update(card_vars or {})
    css = f"{stage}{{transform-origin:0 0;}}{scrim}{{position:absolute;inset:0;background:#0B0F12;opacity:0;}}"
    html_card = (f'<div id="{hid}" class="clip" data-composition-id="split-card" data-composition-src="compositions/split-card.html" '
                 f'data-start="{at:.3f}" data-duration="{out_at - at:.3f}" data-track-index="{track}" data-width="1080" data-height="1920" '
                 f"data-variable-values='{json.dumps(vals)}'></div>")
    html_scrim = f'<div id="{scrim.lstrip("#")}"></div>'
    js = [f"gsap.set('{stage}',{{{full}}});",
          f"tl.fromTo('{stage}',{{{full}}},{{{card},duration:{shrink_dur},ease:'power3.inOut',immediateRender:false}},{at:.3f});",
          f"tl.fromTo('{scrim}',{{opacity:0}},{{opacity:{scrim_alpha},duration:{shrink_dur},ease:'power1.out',immediateRender:false}},{at:.3f});",
          f"tl.fromTo('{stage}',{{{card}}},{{{full},duration:{grow_dur},ease:'power3.inOut',immediateRender:false}},{out_at:.3f});",
          f"tl.fromTo('{scrim}',{{opacity:{scrim_alpha}}},{{opacity:0,duration:{grow_dur},ease:'power1.in',immediateRender:false}},{out_at:.3f});"]
    return css, (html_scrim, html_card), js
```

## Output for the sample reel
`speaker_split(4.84, 7.18, [5.4, 5.88, 6.44], card_vars={"kicker": "SAMPLE · THE SETUP"})`

CSS:
```css
#stage{transform-origin:0 0;}#split-scrim{position:absolute;inset:0;background:#0B0F12;opacity:0;}
```
HTML:
```html
<div id="split-scrim"></div>
<div id="split-card-1" class="clip" data-composition-id="split-card" data-composition-src="compositions/split-card.html" data-start="4.840" data-duration="2.340" data-track-index="30" data-width="1080" data-height="1920" data-variable-values='{"left": 506, "width": 414, "top": 470, "inAt": 0.302, "dur": 2.34, "times": "0.56,1.04,1.60", "kicker": "SAMPLE \u00b7 THE SETUP"}'></div>
```
JS:
```js
gsap.set('#stage',{x:0,y:0,scale:1,borderRadius:0,boxShadow:'0 0 0 0px rgba(255,255,255,0), 0 0px 0px rgba(11,15,18,0)'});
tl.fromTo('#stage',{x:0,y:0,scale:1,borderRadius:0,boxShadow:'0 0 0 0px rgba(255,255,255,0), 0 0px 0px rgba(11,15,18,0)'},{x:72,y:310,scale:0.38,borderRadius:73.7,boxShadow:'0 0 0 21.1px rgba(255,255,255,1), 0 68px 184px rgba(11,15,18,.45)',duration:0.42,ease:'power3.inOut',immediateRender:false},4.840);
tl.fromTo('#split-scrim',{opacity:0},{opacity:0.3,duration:0.42,ease:'power1.out',immediateRender:false},4.840);
tl.fromTo('#stage',{x:72,y:310,scale:0.38,borderRadius:73.7,boxShadow:'0 0 0 21.1px rgba(255,255,255,1), 0 68px 184px rgba(11,15,18,.45)'},{x:0,y:0,scale:1,borderRadius:0,boxShadow:'0 0 0 0px rgba(255,255,255,0), 0 0px 0px rgba(11,15,18,0)',duration:0.4,ease:'power3.inOut',immediateRender:false},7.180);
tl.fromTo('#split-scrim',{opacity:0.3},{opacity:0,duration:0.4,ease:'power1.in',immediateRender:false},7.180);
```
