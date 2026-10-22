# raw-wipe (host side of grade-wipe raw-take mode)

The code below is the tested Python function that writes this effect's host HTML, CSS and timeline lines.
Run it from a small build script (it only needs `json`), or have Claude port the same layers straight into your
reel's `index.html`. The numbers are tuned for a 1080 x 1920 talking-head reel.

Before / after wipe where BEFORE is a RAW TAKE (for example a fumbled first take, filmed from the same tripod spot) shown with no filter and none of the edit's layers, and AFTER is the finished edit, untouched (captions and cards included). Labels RAW (white) / EDITED (cyan). Same motion as grade-wipe: the frame cuts to the raw take, the divider slides in to the middle, a small scrub, then the final sweep reveals the edit.

Why a recipe and not just the component's `beforeSrc`: hyperframes applies a mount's `data-var-src` to a component `<video>` in preview and snapshots but NOT in render (frame extraction reads only the authored src; checked on 0.8.67 and 0.8.169: a fallback src renders instead, and with no fallback the pane renders empty). A clip inside the component would therefore look right in Studio and vanish from the export. So the raw clip is a host `<video>` (it can take `media_start`, so it no longer has to be pre-trimmed), clipped by a wrapper that replays the component's divider curve on the host timeline; the function mounts the component with the same timings and `beforeSrc` set, which turns its filters off and shows RAW / EDITED.

## How to use it in an edit's build
1. Copy the function below into your reel's build script (it only needs `json`), or port it into `index.html`.
2. Call it with the beat times (GLOBAL seconds of the edit, locked to the spoken words).
3. Put `css` in the host `<style>`, the html where the docstring says, and the `js` lines into the host's main
   timeline script (they use the host's `tl`; the `gsap.set` lines are initial states and sit outside it).
4. Snapshot the beats (`npx hyperframes snapshot --at ...`), then `npx hyperframes check`.

Host contract: mount `html[0]` (raw video wrapper) then `html[1]` (component) after every layer the RAW side must hide (base footage, captions, cards); no z-index, DOM order is the stacking. Variables: `at` (global s), `src`, `media_start`, `dur`, `in_at` / `sweep_at` / `sweep_dur` (s after `at`), `handle_y` (px; keep it off the face and out of the caption band, e.g. ~250-300 over a cap), `wipe_vars` (beforeLabel, afterLabel, rawLabel, editedLabel). Lock the end of the final sweep (`at + sweep_at + sweep_dur`) to the spoken word. The raw clip must run at least `dur` from `media_start`. Never mount grade-wipe with `beforeSrc` by hand: without this function's host video the RAW side would show the edit itself.

## The function
```python
def raw_wipe(at, src, dur=2.2, media_start=0.0, in_at=0.0, sweep_at=1.05, sweep_dur=0.5, handle_y=1340,
             wipe_vars=None, hid="raw-wipe-1", track=40):
    """Raw-take wipe = grade-wipe in raw-take mode. BEFORE = a raw take (the fumbled first take, same tripod spot),
    unfiltered and with none of the edit's layers; AFTER = the finished edit under it, untouched; labels RAW / EDITED.

    Why a recipe: hyperframes applies a mount's data-var-src to a component <video> in preview and snapshots but NOT
    in render (frame extraction reads only the authored src; checked on 0.8.67 and 0.8.169), so a clip inside the
    component would vanish from the final file without an error. Here the clip is a HOST <video> in a wrapper that
    replays the component's own divider curve on the host timeline (same times, same eases), so its edge sits exactly
    under the white divider. The function mounts the component with the matching timings (and beforeSrc = src, which
    switches the component to raw-take mode: filters off, RAW / EDITED), so the two halves cannot drift apart.
      at          global seconds the wipe starts (lock the final sweep to the spoken word with sweep_at)
      src         the raw clip, project-relative;  media_start = its source second at `at` (0 = a pre-trimmed clip)
      dur         seconds both halves run (the raw clip must cover them)
      in_at, sweep_at, sweep_dur, handle_y   the component's inAt / sweepAt / sweepDur (s after `at`) and handleY (px)
      wipe_vars   any other grade-wipe variables (beforeLabel / afterLabel / rawLabel / editedLabel)
    HOST CONTRACT: put html[0] (the clipped raw video) and then html[1] (the component) AFTER every layer the RAW side
    must hide (base footage, captions, cards), so RAW shows the bare take and EDITED keeps them. No z-index.
    """
    sweep_at = max(sweep_at, in_at + 0.6)
    vals = dict(wipe_vars or {})
    vals.update({"beforeSrc": src, "inAt": in_at, "sweepAt": sweep_at, "sweepDur": sweep_dur, "handleY": handle_y})
    clip = f"{hid}-clip"
    v_html = (f'<div id="{clip}" class="rw-clip"><video id="{hid}-raw" class="rw-raw" src="{src}" muted playsinline '
              f'data-start="{at:.3f}" data-media-start="{media_start:.3f}" data-duration="{dur:.3f}" data-track-index="{track}"></video></div>')
    c_html = (f'<div id="{hid}" class="clip" data-composition-id="grade-wipe" data-composition-src="compositions/grade-wipe.html" '
              f'data-start="{at:.3f}" data-duration="{dur:.3f}" data-track-index="{track + 1}" data-width="1080" data-height="1920" '
              f"data-variable-values='{json.dumps(vals)}'></div>")
    css = (".rw-clip{position:absolute;inset:0;clip-path:inset(0 calc((100 - var(--gx)) * 1%) 0 0);}"
           ".rw-raw{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}")
    g = lambda x: f"{at + x:.3f}"  # noqa: E731  (component-local seconds -> global)
    # the component's own divider curve (GW_JS), replayed at global time on the clip wrapper
    js = [f"gsap.set('#{clip}',{{'--gx':100,opacity:0}});",
          f"tl.fromTo('#{clip}',{{opacity:0}},{{opacity:1,duration:.14,ease:'power1.out',immediateRender:false}},{g(in_at)});",
          f"tl.fromTo('#{clip}',{{'--gx':100}},{{'--gx':50,duration:.55,ease:'power3.out',immediateRender:false}},{g(in_at + .02)});"]
    gx = 50
    if sweep_at - in_at >= 1.02:
        js += [f"tl.fromTo('#{clip}',{{'--gx':50}},{{'--gx':57,duration:.22,ease:'sine.inOut',immediateRender:false}},{g(in_at + .6)});",
               f"tl.fromTo('#{clip}',{{'--gx':57}},{{'--gx':46,duration:.24,ease:'sine.inOut',immediateRender:false}},{g(in_at + .82)});"]
        gx = 46
    js.append(f"tl.fromTo('#{clip}',{{'--gx':{gx}}},{{'--gx':0,duration:{sweep_dur},ease:'power2.inOut',immediateRender:false}},{g(sweep_at)});")
    return css, (v_html, c_html), js
```

## Output for the sample reel
`raw_wipe(4.25, "assets/raw_take.mp4", sweep_at=1.1, handle_y=290)`

CSS:
```css
.rw-clip{position:absolute;inset:0;clip-path:inset(0 calc((100 - var(--gx)) * 1%) 0 0);}.rw-raw{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
```
HTML:
```html
<div id="raw-wipe-1-clip" class="rw-clip"><video id="raw-wipe-1-raw" class="rw-raw" src="assets/raw_take.mp4" muted playsinline data-start="4.250" data-media-start="0.000" data-duration="2.200" data-track-index="40"></video></div>
<div id="raw-wipe-1" class="clip" data-composition-id="grade-wipe" data-composition-src="compositions/grade-wipe.html" data-start="4.250" data-duration="2.200" data-track-index="41" data-width="1080" data-height="1920" data-variable-values='{"beforeSrc": "assets/raw_take.mp4", "inAt": 0.0, "sweepAt": 1.1, "sweepDur": 0.5, "handleY": 290}'></div>
```
JS:
```js
gsap.set('#raw-wipe-1-clip',{'--gx':100,opacity:0});
tl.fromTo('#raw-wipe-1-clip',{opacity:0},{opacity:1,duration:.14,ease:'power1.out',immediateRender:false},4.250);
tl.fromTo('#raw-wipe-1-clip',{'--gx':100},{'--gx':50,duration:.55,ease:'power3.out',immediateRender:false},4.270);
tl.fromTo('#raw-wipe-1-clip',{'--gx':50},{'--gx':57,duration:.22,ease:'sine.inOut',immediateRender:false},4.850);
tl.fromTo('#raw-wipe-1-clip',{'--gx':57},{'--gx':46,duration:.24,ease:'sine.inOut',immediateRender:false},5.070);
tl.fromTo('#raw-wipe-1-clip',{'--gx':46},{'--gx':0,duration:0.5,ease:'power2.inOut',immediateRender:false},5.350);
```
