# Tier One

A single-file browser game: an MSP (Managed Service Provider) CEO simulation. You start in a spare room with two telephony clients and grow the business, from first hires and a serviced office up to a floated group running a national campus, taking over listed rivals through the share market.

Play it: https://super-gill.github.io/tierone/

## How it's built

The game ships as one self-contained `index.html` with no external dependencies. That file is generated from the fragments in `src/`, concatenated in a fixed order by `build.sh`.

```bash
./build.sh      # writes index.html from src/, then syntax-checks the bundle
```

`src/a.html` is the page shell (markup and CSS); every other `src/*.js` is a slice of the game, loaded in the order listed in `build.sh`. The order matters: later files intentionally extend or override earlier ones.

## Playing locally

Open `index.html` in any modern browser. Saves are kept in that browser's local storage.

## Structure

- `src/` source fragments (one page shell plus the JavaScript slices)
- `build.sh` concatenates `src/` into `index.html` in the correct order
- `index.html` the built, playable game (committed so GitHub Pages can serve it)
