import { access, readFile } from "node:fs/promises";
import "./validate-map.mjs";
import "./test.mjs";

const required = [
  "index.html",
  "src/main.js",
  "src/styles.css",
  "src/game/assets.js",
  "src/game/constants.js",
  "src/game/map.js",
  "src/game/render.js",
  "src/game/sound.js",
  "src/game/state.js",
  "src/game/save.js",
  "src/game/ui.js",
  "assets/kenney_tiny-dungeon/Tilemap/tilemap_packed.png",
  "assets/kenney_tiny-dungeon/Tiles/tile_0048.png",
  "assets/kenney_tiny-dungeon/Tiles/tile_0097.png",
  "assets/kenney_tiny-dungeon/License.txt",
  "assets/weapon-rpg-icons/SOURCE.txt",
  "assets/weapon-rpg-icons/source/16x16 Weapons RPG Icons/all-assets-preview.png",
  "assets/music-codeman-8bit/SOURCE.txt",
  "assets/music-codeman-8bit/bgm_menu.mp3",
  "assets/music-codeman-8bit/bgm_action_1.mp3",
];

await Promise.all(required.map((path) => access(path)));

const html = await readFile("index.html", "utf8");
for (const ref of ["./src/styles.css", "./src/main.js"]) {
  if (!html.includes(ref)) throw new Error(`index.html is missing ${ref}`);
}
