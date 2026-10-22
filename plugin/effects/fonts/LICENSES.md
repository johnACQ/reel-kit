# Font licences

Licences checked against the google/fonts repository (METADATA.pb and the licence file in each family's folder)
on 2026-10-22.

| Font | Designer / copyright | Licence | How the kit uses it |
|---|---|---|---|
| Bebas Neue | Ryoichi Tsunekawa, Dharma Type (Copyright 2010) | SIL Open Font License 1.1 | Bundled as `BebasNeue-400.woff2` in `components/assets/fx_*/fonts/`. Full text: `OFL-BebasNeue.txt`. |
| Instrument Serif | Rodrigo Fuenzalida, Jordan Egstad (Copyright 2022 The Instrument Serif Project Authors) | SIL Open Font License 1.1 | Bundled as `InstrumentSerif-400.woff2` in `components/assets/fx_footage/fonts/`. Full text: `OFL-InstrumentSerif.txt`. |
| Roboto | Christian Robertson, ParaType, Font Bureau (Copyright 2011 The Roboto Project Authors) | SIL Open Font License 1.1 | Not bundled. Loaded from Google Fonts at render time. |
| Roboto Mono | Christian Robertson (Copyright 2015 The Roboto Mono Project Authors) | SIL Open Font License 1.1 | Not bundled. Loaded from Google Fonts at render time. |

Each bundled font folder carries an `OFL.txt` with both full licence texts, as the OFL asks.

**Your own fonts:** `scripts/rebrand.mjs` downloads the Google Fonts family you name and embeds it in your reel
project. Google Fonts families are open licensed. If you point it at your own font file instead, check that
your licence lets you use that font in video.
