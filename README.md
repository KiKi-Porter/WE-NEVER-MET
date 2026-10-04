# 我们从未相遇 · WE NEVER MET

A 3-minute explainer on the Fermi paradox, told as a 76-year story. Every frame is drawn in code (Canvas 2D + a WebGL
film grade), the score is synthesized in Python, and the two share one bar timeline (80 BPM, 1 bar = 3 s).
Structure and style follow [Neo-Flash/AIDD-VIDEO](https://github.com/Neo-Flash/AIDD-VIDEO).

## Files
| file | what |
|---|---|
| `index.html` | the film: open it through `serve.mjs` and press play |
| `lib.js` | canvas, easing, palette, drawing helpers, image assets, WebGL post (bloom, CA, vignette, grain), stars, galaxy, reply tally |
| `s_*.js` | one file per chapter: `open` `silence` `drake` `called` `wow` `ears` `echo` `first` `end` |
| `main.js` | timeline, motion blur, subtitles, chapter cards, player, export hooks (`__frame`, `__cues`, `__srt`) |
| `data.js` | the 1679 Arecibo bits (73 × 23) |
| `tex.js` | formulas typeset by `gen_tex.mjs` (MathJax → SVG) |
| `assets/` | image-2 pictures, cleaned by `prep_assets.py` (edges faded to black); a missing one falls back to a placeholder |
| `music.py` | the score and every sound effect, placed from `cues.json` |
| `export.mjs` | headless Chrome workers render exact frame times → ffmpeg |
| `storyboard.md` / `prompts.md` | the story, scene by scene, with fact checks / the image prompts |

## Commands
```sh
npm install                              # mathjax-full (only needed for gen_tex.mjs)
pip install numpy scipy pillow imageio-ffmpeg

node gen_tex.mjs                         # formulas → tex.js
python prep_assets.py                    # picked renders → assets/
node export.mjs --cues cues.json         # the picture's sound cues
python music.py                          # → music.wav, music.mp3

node serve.mjs                           # live preview at http://127.0.0.1:8017/   (?t=60 starts at 60 s)
node export.mjs --shots 20,66,150 --px 1 # check single frames → shots/
node export.mjs --px 1 --out renders/preview.mp4    # 1080p preview
node export.mjs                          # 4K master → 我们从未相遇_4K.mp4
```
After changing a scene's timing or its `sfx`, re-run `--cues` and `music.py` so the sound follows the picture.
