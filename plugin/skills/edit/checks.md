# The checks

Every automatic check can pass and the reel can still be wrong. Each check below caught a real mistake on a real edit.

## 1. Read every caption against what they said
Transcription mishears small words, and a small word can flip the meaning: "nine to two" for "9 to 2", "not met" for "not missed". Compare every caption group with the transcript of the take. For every number and every "not", find the word in the transcript and confirm the caption shows the same thing.

## 2. Transcribe the finished video and read the words at every cut
`npx hyperframes transcribe renders/<file>.mp4 --model medium.en --json`. For each join on the cut timeline, read the words from one second before to one second after.
- A half-word ("I took it-", "So-") or a word that belongs to the neighbouring sentence means the edge is wrong. Move it into the silence, rebuild, check again.
- Three passes at most. If it still leaks, tell them which join and why.
- Transcripts vary a little from run to run, so a changed word is a pointer to look closer, not proof.

## 3. Look at a still at every cut and every caption change
`ffmpeg -ss <t> -i <render> -frames:v 1 still_<t>.jpg` at each cut and caption change, then tile them into one contact sheet and look at it. This is how you catch:
- text on the forehead or a caption over the chin;
- a card that says a word before they say it;
- a shot that pulled the wrong part of the footage;
- a card or caption left on screen after its moment.

## 4. Every number has a source
Any number on screen needs a source tag. If they can't say where it came from, cut it or show it as an estimate in words.

## 5. The file itself
- 1080 x 1920, the expected duration, an audio stream.
- Peaks under -1 dBFS (`ffmpeg -i <render> -af volumedetect -f null -`).
- The phone copy under 30 MB.

## 6. The one check Claude can't do
Claude can't hear the video. A stretch of "quiet" music can turn out to be loud, and a crossfade can sound like a hiccup. Tell them, every time: watch it once on your phone, sound on, start to finish, before you post it.
