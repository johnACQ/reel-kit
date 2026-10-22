# kinetic-hook-behind (host side of the component)

The code below is the tested Python function that writes this effect's host HTML, CSS and timeline lines.
Run it from a small build script (it only needs `json`), or have Claude port the same layers straight into your
reel's `index.html`. The numbers are tuned for a 1080 x 1920 talking-head reel.

The word itself is the COMPONENT `components/kinetic-hook-behind.html` (kicker + huge Bebas word, all text and timings are variables). Behind-the-head needs the HOST to stack three layers in one parent, in DOM order: base video wrapper, the component's host div, the cutout video wrapper (subject.webm cut from the SAME a-roll file, same data-start / data-media-start). This file covers that stacking plus the headroom drop that a tight selfie needs.

Why the drop exists: in tight selfie footage the head fills the frame (in the tested footage: top of head at y 0-250, eyes about y 350-600, chin about y 1080-1260). No word in the safe zone (y >= 220) can sit behind that head with 70% of each letter showing. So for the hook, the footage drops 430 px, the gap is filled with the wall's own colour and the base video's top edge is feathered into it; then the footage rises back as the word leaves. With real headroom (shoot wider: head top at y >= ~480) skip the drop.

## How to use it in an edit's build
1. Copy the function below into your reel's build script (it only needs `json`), or port it into `index.html`.
2. Call it with the beat times (GLOBAL seconds of the edit, locked to the spoken words).
3. Put `css` in the host `<style>`, the html where the docstring says, and the `js` lines into the host's main
   timeline script (they use the host's `tl`; the `gsap.set` lines are initial states and sit outside it).
4. Snapshot the beats (`npx hyperframes snapshot --at ...`), then `npx hyperframes check`.

Mount (sample reel):
```html
<div id="stage">
  <div id="hook-fill" class="clip" ...></div>        <!-- this recipe -->
  <div id="basewrap" class="vwrap" data-layout-allow-overflow><video id="aroll" ...></video></div>
  <div id="hook-1" class="clip" data-composition-id="kinetic-hook-behind" data-composition-src="compositions/kinetic-hook-behind.html"
       data-start="0" data-duration="2.25" data-track-index="3" data-width="1080" data-height="1920"
       data-variable-values='{"kicker":"SAMPLE · 18 effects. 20 seconds.","word":"HOOK","wordAt":0.42,"outAt":1.38}'></div>
  <div id="cutwrap" class="vwrap" data-layout-allow-overflow><video id="cutout" src="assets/subject.webm" data-start="0" data-media-start="0" data-duration="2.37" ...></video></div>
</div>
```
No z-index on these: DOM order is the stacking. Make the cutout with `npx hyperframes remove-background assets/aroll.mp4 -o assets/subject.webm --quality best` on the FINAL a-roll (a cutout from an older assemble does not line up). Keep `outAt` (component) before `rise_at` (recipe) so the word sinks behind the head before the footage moves. Check placement with snapshots at the word's first and last frames: wordY + 0.7 x letter height must stay above the head's top edge.

## The function
```python
def hook_headroom(start, rise_at, drop=430, rise_dur=0.45, feather=170, fill=("#E4DFD6", "#DCD6CC"),
                  base_wrap="#basewrap", cut_wrap="#cutwrap", fill_id="hook-fill", track=0):
    """Host side of kinetic-hook-behind for a TIGHT selfie (head touching the top of frame, no headroom).
    Drops the base video AND the cutout by `drop` px for the hook, fills the new headroom with a wall-coloured
    gradient (`fill` = top, bottom; sample them from the wall right above the head) and feathers the base video's
    top edge into it, then raises both back to 0 at `rise_at` over `rise_dur`. The word component sits between
    the two wrappers, so it reads behind the head the whole time.
    With real headroom (head top at y >= ~480) skip this recipe: mount the component between base and cutout only.
    HOST CONTRACT: base <video> inside `base_wrap`, cutout <video> inside `cut_wrap`, both non-timed wrappers with
    class "vwrap"; html (the fill clip) goes BEFORE base_wrap in the same parent.
    """
    end = rise_at + rise_dur
    html = f'<div id="{fill_id}" class="clip" data-start="{start:.3f}" data-duration="{end - start + .05:.3f}" data-track-index="{track}"></div>'
    css = (f"#{fill_id}{{position:absolute;inset:0;background:linear-gradient(180deg,{fill[0]} 0%,{fill[1]} {drop + feather}px,{fill[1]} 100%);}}"
           f".vwrap{{position:absolute;inset:0;}}"
           f"{base_wrap}{{-webkit-mask-image:linear-gradient(180deg,rgba(0,0,0,0) 0px,#000 calc(var(--feather) * 1px));"
           f"mask-image:linear-gradient(180deg,rgba(0,0,0,0) 0px,#000 calc(var(--feather) * 1px));}}")
    js = [f"gsap.set(['{base_wrap}','{cut_wrap}'],{{y:{drop}}});gsap.set('{base_wrap}',{{'--feather':{feather}}});",
          f"tl.fromTo(['{base_wrap}','{cut_wrap}'],{{y:{drop}}},{{y:0,duration:{rise_dur},ease:'power3.inOut',immediateRender:false}},{rise_at:.3f});",
          f"tl.fromTo('{base_wrap}',{{'--feather':{feather}}},{{'--feather':0,duration:{rise_dur},ease:'power2.in',immediateRender:false}},{rise_at:.3f});",
          f"tl.set('{base_wrap}',{{webkitMaskImage:'none',maskImage:'none'}},{end:.3f});"]
    return css, html, js
```

## Output for the sample reel
`hook_headroom(0.0, 1.72)`

CSS:
```css
#hook-fill{position:absolute;inset:0;background:linear-gradient(180deg,#E4DFD6 0%,#DCD6CC 600px,#DCD6CC 100%);}.vwrap{position:absolute;inset:0;}#basewrap{-webkit-mask-image:linear-gradient(180deg,rgba(0,0,0,0) 0px,#000 calc(var(--feather) * 1px));mask-image:linear-gradient(180deg,rgba(0,0,0,0) 0px,#000 calc(var(--feather) * 1px));}
```
HTML:
```html
<div id="hook-fill" class="clip" data-start="0.000" data-duration="2.220" data-track-index="0"></div>
```
JS:
```js
gsap.set(['#basewrap','#cutwrap'],{y:430});gsap.set('#basewrap',{'--feather':170});
tl.fromTo(['#basewrap','#cutwrap'],{y:430},{y:0,duration:0.45,ease:'power3.inOut',immediateRender:false},1.720);
tl.fromTo('#basewrap',{'--feather':170},{'--feather':0,duration:0.45,ease:'power2.in',immediateRender:false},1.720);
tl.set('#basewrap',{webkitMaskImage:'none',maskImage:'none'},2.170);
```
