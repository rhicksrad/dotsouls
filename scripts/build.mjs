import { cp, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";

const dist = new URL("../dist/", import.meta.url);
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

await cp(new URL("../index.html", import.meta.url), new URL("index.html", dist));
await cp(new URL("../src", import.meta.url), new URL("src", dist), { recursive: true });
await cp(new URL("../assets", import.meta.url), new URL("assets", dist), { recursive: true });

if (!existsSync(new URL("assets/kenney_tiny-dungeon/Tilemap/tilemap_packed.png", dist))) {
  throw new Error("Build did not include the Kenney tilesheet.");
}
