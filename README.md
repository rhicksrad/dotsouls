# Dot Souls

An 8-bit, static-browser dungeon crawler rebuilt as a small ES module app.

The current prototype is a tactical action-roguelike: enemies telegraph attacks, the player can slash, heavy thrust, dodge, guard/parry, collect relics, open the brass gate, and defeat the Chapel Warden.

## Run Locally

```powershell
npm run preview
```

Then open <http://127.0.0.1:5173/>.

## Build

```powershell
npm run check
npm run build
```

The static site is written to `dist/`.

## Controls

- `WASD` / arrows: move and face
- `Space`: quick slash arc
- `F`: heavy thrust
- `Q` or Shift+move: dodge
- `E`: guard/parry
- `H`: heal
- `.`: wait
- `R`: reset

## Deploy

Push to `main` and the GitHub Pages workflow in `.github/workflows/pages.yml` will build and deploy `dist/`.

## Assets

Pixel art comes from Kenney Tiny Dungeon, licensed CC0. The runtime build includes the tilemap and license file only.
