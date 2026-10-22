# title-card-shrink (host side of the component)

The code below is the tested Python function that writes this effect's host HTML, CSS and timeline lines.
Run it from a small build script (it only needs `json`), or have Claude port the same layers straight into your
reel's `index.html`. The numbers are tuned for a 1080 x 1920 talking-head reel.

Section opener (~2.3 s). The CARD is the component `components/title-card-shrink.html`: a full-screen card (ink #0B0F12 or white) wipes up, a Roboto Mono timecode runs one frame per frame at the top, a small mono kicker and a Bebas (or Instrument Serif) title rise out of masks, a cyan rule draws under it, and at `phoneAt` the type lifts away. THIS recipe is the host half: at the same moment the speaker's own footage pops into a phone frame in the centre (rounded corners, light bezel, island + home bar) and the phone grows back to full screen while radius and bezel ease to 0, so the reel carries on with no cut.

Why split: the footage itself has to scale into the phone, and a component cannot reach the host's video (nor be given a media offset for a copy of it). The function mounts the card with the matching `phoneAt`, so the two halves cannot drift apart.

## How to use it in an edit's build
1. Copy the function below into your reel's build script (it only needs `json`), or port it into `index.html`.
2. Call it with the beat times (GLOBAL seconds of the edit, locked to the spoken words).
3. Put `css` in the host `<style>`, the html where the docstring says, and the `js` lines into the host's main
   timeline script (they use the host's `tl`; the `gsap.set` lines are initial states and sit outside it).
4. Snapshot the beats (`npx hyperframes snapshot --at ...`), then `npx hyperframes check`.

Host contract: all footage layers inside ONE non-timed `#stage` wrapper (`position:absolute; inset:0; overflow:hidden`). Put `card_html` after the stage and `island_html` inside the stage, last. Variables: `at` (global s), `phone_at`, `grow_at`, `grow_dur` (s after `at`), `phone_scale`, and `card_vars` = the card component's variables (`title` with | between lines, `kicker`, `timecodeStart`, `fps`, `bg`, `font`, `titleSize`). Captions mounted after the card stay readable over it (white on ink); drop them for the card if they fight the title. While it is a phone the stage gets z-index track+5 (35), so an overlay that must show over the phone (captions) needs a higher z-index; overlays mounted after the card show over the card itself.

## The function
```python
def title_card_shrink(at, phone_at=1.05, grow_at=1.75, grow_dur=0.55, phone_scale=0.46, stage="#stage",
                      card_vars=None, hid="title-card-1", track=30):
    """Host side of the title-card-shrink COMPONENT: mounts the card, then turns the host's own footage into a phone
    in the centre and grows it back to full screen (radius and bezel ease to 0) so the reel carries on with no cut.

    HOST CONTRACT: every footage layer (base video, cutout, zoom wrappers) lives inside ONE non-timed wrapper
    `stage` (position:absolute; inset:0; overflow:hidden). Mount html[0] (the card) after the stage; html[1] (phone
    island + home bar) goes INSIDE the stage, last. The stage is lifted above the card while it is a phone.
      at          global seconds the card cuts in (lock to a spoken word)
      phone_at    seconds after `at`: title lifts away, footage pops into the phone (passed to the card as phoneAt)
      grow_at     seconds after `at`: the phone starts growing;  grow_dur  seconds the grow takes
      phone_scale phone size as a fraction of the frame (0.46 = 497 x 883 px)
      card_vars   the card's own variables: title ("THE|TABLE", | = new line), kicker, timecodeStart, fps,
                  bg ("#0B0F12" or "#FFFFFF"), font ("Bebas Neue" locked look / "Instrument Serif"), titleSize
    """
    end = at + grow_at + grow_dur
    vals = dict(card_vars or {}); vals["phoneAt"] = phone_at
    card = (f'<div id="{hid}" class="clip" data-composition-id="title-card-shrink" data-composition-src="compositions/title-card-shrink.html" '
            f'data-start="{at:.3f}" data-duration="{end - at:.3f}" data-track-index="{track}" data-width="1080" data-height="1920" '
            f"data-variable-values='{json.dumps(vals)}'></div>")
    island = '<div id="tc-island"></div><div id="tc-home"></div>'
    css = (f"{stage}{{transform-origin:50% 50%;}}"
           "#tc-island{position:absolute;left:50%;top:40px;width:210px;height:60px;margin-left:-105px;border-radius:99px;background:#0B0F12;opacity:0;}"
           "#tc-home{position:absolute;left:50%;bottom:30px;width:300px;height:12px;margin-left:-150px;border-radius:99px;background:rgba(255,255,255,.85);opacity:0;}")
    bez, sh = "#F4F6F8", "0 50px 120px rgba(0,0,0,.55)"
    phone = f"scale:{phone_scale},borderRadius:130,boxShadow:'0 0 0 30px {bez}, {sh}'"
    js = [f"gsap.set('{stage}',{{scale:1,borderRadius:0,boxShadow:'0 0 0 0px {bez}, 0 0px 0px rgba(0,0,0,0)'}});",
          f"tl.set('{stage}',{{zIndex:{track + 5}}},{at + phone_at:.3f});",
          f"tl.fromTo('{stage}',{{scale:{phone_scale * .86:.3f},opacity:0,borderRadius:130,boxShadow:'0 0 0 30px {bez}, {sh}'}},"
          f"{{{phone},opacity:1,duration:.36,ease:'back.out(1.7)',immediateRender:false}},{at + phone_at:.3f});",
          f"tl.fromTo(['#tc-island','#tc-home'],{{opacity:0}},{{opacity:1,duration:.2,immediateRender:false}},{at + phone_at + .04:.3f});",
          f"tl.fromTo(['#tc-island','#tc-home'],{{opacity:1}},{{opacity:0,duration:.2,immediateRender:false}},{at + grow_at:.3f});",
          f"tl.fromTo('{stage}',{{{phone}}},{{scale:1,borderRadius:0,boxShadow:'0 0 0 0px {bez}, 0 0px 0px rgba(0,0,0,0)',"
          f"duration:{grow_dur},ease:'power3.inOut',immediateRender:false}},{at + grow_at:.3f});",
          f"tl.set('{stage}',{{zIndex:'auto'}},{end:.3f});"]
    return css, (card, island), js
```

## Output for the sample reel
`title_card_shrink(BEATS["title"], card_vars={"title": "THE|TABLE", "kicker": "CHAPTER 02 · SAMPLE"})`

CSS:
```css
#stage{transform-origin:50% 50%;}#tc-island{position:absolute;left:50%;top:40px;width:210px;height:60px;margin-left:-105px;border-radius:99px;background:#0B0F12;opacity:0;}#tc-home{position:absolute;left:50%;bottom:30px;width:300px;height:12px;margin-left:-150px;border-radius:99px;background:rgba(255,255,255,.85);opacity:0;}
```
HTML:
```html
<div id="title-card-1" class="clip" data-composition-id="title-card-shrink" data-composition-src="compositions/title-card-shrink.html" data-start="9.100" data-duration="2.300" data-track-index="30" data-width="1080" data-height="1920" data-variable-values='{"title": "THE|TABLE", "kicker": "CHAPTER 02 \u00b7 SAMPLE", "phoneAt": 1.05}'></div>
<div id="tc-island"></div><div id="tc-home"></div>
```
JS:
```js
gsap.set('#stage',{scale:1,borderRadius:0,boxShadow:'0 0 0 0px #F4F6F8, 0 0px 0px rgba(0,0,0,0)'});
tl.set('#stage',{zIndex:35},10.150);
tl.fromTo('#stage',{scale:0.396,opacity:0,borderRadius:130,boxShadow:'0 0 0 30px #F4F6F8, 0 50px 120px rgba(0,0,0,.55)'},{scale:0.46,borderRadius:130,boxShadow:'0 0 0 30px #F4F6F8, 0 50px 120px rgba(0,0,0,.55)',opacity:1,duration:.36,ease:'back.out(1.7)',immediateRender:false},10.150);
tl.fromTo(['#tc-island','#tc-home'],{opacity:0},{opacity:1,duration:.2,immediateRender:false},10.190);
tl.fromTo(['#tc-island','#tc-home'],{opacity:1},{opacity:0,duration:.2,immediateRender:false},10.850);
tl.fromTo('#stage',{scale:0.46,borderRadius:130,boxShadow:'0 0 0 30px #F4F6F8, 0 50px 120px rgba(0,0,0,.55)'},{scale:1,borderRadius:0,boxShadow:'0 0 0 0px #F4F6F8, 0 0px 0px rgba(0,0,0,0)',duration:0.55,ease:'power3.inOut',immediateRender:false},10.850);
tl.set('#stage',{zIndex:'auto'},11.400);
```
