# film-look (host recipe)

The code below is the tested Python function that writes this effect's host HTML, CSS and timeline lines.
Run it from a small build script (it only needs `json`), or have Claude port the same layers straight into your
reel's `index.html`. The numbers are tuned for a 1080 x 1920 talking-head reel.

Warm film look that switches on over ~0.3 s: lifted blacks (master curve 0 -> 0.07), warm highlights (highlight wheel hue 40), slight halation (the shader's thresholded Bloom), soft vignette, and NO grain (grain reads as noise on faces). It is HyperFrames' canonical grading shader (`data-color-grading`, media-use 'Film Memory' family, tuned warmer with bloom), not a CSS filter stack, so the look is real per-pixel grading. Optional tiny mono label.

Why a recipe and not a component: the shader has to sit on a real `<video>` with the right source offset, and a component cannot be told a media offset. The recipe adds a timed COPY of the a-roll right above the base video for the window only; at intensity 0 it matches the base, so the switch in and out is seamless and the rest of the reel never runs the shader.

## How to use it in an edit's build
1. Copy the function below into your reel's build script (it only needs `json`), or port it into `index.html`.
2. Call it with the beat times (GLOBAL seconds of the edit, locked to the spoken words).
3. Put `css` in the host `<style>`, the html where the docstring says, and the `js` lines into the host's main
   timeline script (they use the host's `tl`; the `gsap.set` lines are initial states and sit outside it).
4. Snapshot the beats (`npx hyperframes snapshot --at ...`), then `npx hyperframes check`.

Variables: `on`, `off` (global s), `strength` (0-1), `bloom` (0-3), `ramp` (s), `label` ('' = none), `media_offset` (if the base video has a data-media-start). If the edit cuts the a-roll into several `<video>` clips, call it once per clip the window touches (each with that clip's offset). A cutout layer on screen in the same window sits ABOVE the copy and stays ungraded: give it the same `data-color-grading` + tweens, or keep film-look and words-behind-head apart (the sample does).

## The function
```python
def film_look(on, off, src="assets/aroll.mp4", media_offset=0.0, strength=1.0, bloom=0.22, ramp=0.3,
              label="FILM LOOK · SAMPLE", label_y=236, payload=None, vid="film-look", track=2):
    """Warm film look: lifted blacks, warm highlights, soft halation (bloom), soft vignette, NO grain.

    Uses HyperFrames' own grading shader (data-color-grading) on a TIMED COPY of the a-roll that sits directly
    above the base video, so nothing else in the reel is touched and the shader only runs inside the window.
      on, off       global seconds: the look eases in at `on` and out at `off`, each over `ramp` s
      src           the a-roll file the base video plays
      media_offset  source seconds at global 0 (the base video's data-media-start minus its data-start)
      strength      0-1 grading intensity at full on;  bloom  0-3 halation glow at full on
      label         tiny mono pill top-left ('' = none)
    html[0] goes right above the base <video> (same parent, so it moves with any stage zoom);
    html[1] (the label) goes with the overlays. The copy's start/end are padded by 0.1 s around the ramps.
    """
    p = dict(payload or FILM_PAYLOAD)
    p["effects"] = dict(p["effects"], bloom=bloom)
    a, b = max(0.0, on - 0.1), off + ramp + 0.1
    grade = json.dumps(p, separators=(",", ":"))
    v_html = (f'<video id="{vid}" class="full" src="{src}" muted playsinline data-start="{a:.3f}" '
              f'data-media-start="{a + media_offset:.3f}" data-duration="{b - a:.3f}" data-track-index="{track}" '
              f"data-color-grading='{grade}' "
              f'style="--hf-color-grading-intensity:0;--hf-color-grading-bloom:0"></video>')
    l_html = (f'<div id="{vid}-label" class="clip fl-label" data-start="{a:.3f}" data-duration="{b - a:.3f}" '
              f'data-track-index="{track + 10}"><span id="{vid}-pill">{label}</span></div>') if label else ''
    css = (".fl-label{position:absolute;inset:0;pointer-events:none;}"
           f".fl-label span{{position:absolute;left:72px;top:{label_y}px;padding:9px 16px;border-radius:10px;background:rgba(11,15,18,.78);"
           "color:#FFFFFF;font:500 21px 'Roboto Mono',monospace;letter-spacing:3px;white-space:nowrap;}")
    js = [f"tl.to('#{vid}',{{'--hf-color-grading-intensity':{strength},'--hf-color-grading-bloom':{bloom},duration:{ramp},ease:'power2.out'}},{on:.3f});",
          f"tl.to('#{vid}',{{'--hf-color-grading-intensity':0,'--hf-color-grading-bloom':0,duration:{ramp},ease:'power2.inOut'}},{off:.3f});"]
    if label:
        js += [f"gsap.set('#{vid}-pill',{{opacity:0,x:-14}});",
               f"tl.fromTo('#{vid}-pill',{{opacity:0,x:-14}},{{opacity:1,x:0,duration:.26,ease:'power3.out',immediateRender:false}},{on + .08:.3f});",
               f"tl.fromTo('#{vid}-pill',{{opacity:1,x:0}},{{opacity:0,x:-10,duration:.2,ease:'power2.in',immediateRender:false}},{off:.3f});"]
    return css, (v_html, l_html), js
```

## Output for the sample reel
`film_look(*BEATS["film"])`

CSS:
```css
.fl-label{position:absolute;inset:0;pointer-events:none;}.fl-label span{position:absolute;left:72px;top:236px;padding:9px 16px;border-radius:10px;background:rgba(11,15,18,.78);color:#FFFFFF;font:500 21px 'Roboto Mono',monospace;letter-spacing:3px;white-space:nowrap;}
```
HTML:
```html
<video id="film-look" class="full" src="assets/aroll.mp4" muted playsinline data-start="7.320" data-media-start="7.320" data-duration="2.060" data-track-index="2" data-color-grading='{"intensity":1,"adjust":{"temperature":0.18,"tint":0.02,"contrast":-0.04,"highlights":-0.18,"shadows":0.04,"saturation":-0.08},"wheels":{"shadows":{"hue":28,"amount":0.07,"level":0},"highlights":{"hue":40,"amount":0.15,"level":0}},"curves":{"master":[[0,0.065],[0.5,0.5],[1,0.96]]},"details":{"vignette":0.22,"vignetteFeather":0.7,"grain":0},"effects":{"bloom":0.22,"bloomRadius":16}}' style="--hf-color-grading-intensity:0;--hf-color-grading-bloom:0"></video>
<div id="film-look-label" class="clip fl-label" data-start="7.320" data-duration="2.060" data-track-index="12"><span id="film-look-pill">FILM LOOK · SAMPLE</span></div>
```
JS:
```js
tl.to('#film-look',{'--hf-color-grading-intensity':1.0,'--hf-color-grading-bloom':0.22,duration:0.3,ease:'power2.out'},7.420);
tl.to('#film-look',{'--hf-color-grading-intensity':0,'--hf-color-grading-bloom':0,duration:0.3,ease:'power2.inOut'},8.980);
gsap.set('#film-look-pill',{opacity:0,x:-14});
tl.fromTo('#film-look-pill',{opacity:0,x:-14},{opacity:1,x:0,duration:.26,ease:'power3.out',immediateRender:false},7.500);
tl.fromTo('#film-look-pill',{opacity:1,x:0},{opacity:0,x:-10,duration:.2,ease:'power2.in',immediateRender:false},8.980);
```
