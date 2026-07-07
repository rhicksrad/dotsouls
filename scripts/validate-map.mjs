import { createMap, isPassable } from "../src/game/map.js";

const world = createMap();
const targets = {
  captain: { x: 63, y: 27 },
  gate: world.bossGate,
  warden: { x: 74, y: 28 },
  stairs: { x: 74, y: 27 },
};

function reachable(target, hasKey = false) {
  const start = world.start;
  const queue = [start];
  const seen = new Set([`${start.x},${start.y}`]);

  for (let i = 0; i < queue.length; i += 1) {
    const cell = queue[i];
    if (cell.x === target.x && cell.y === target.y) return true;

    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = cell.x + dx;
      const y = cell.y + dy;
      const key = `${x},${y}`;
      if (seen.has(key) || !isPassable(world, x, y, hasKey)) continue;
      seen.add(key);
      queue.push({ x, y });
    }
  }

  return false;
}

const failures = [];
if (!reachable(targets.captain, false)) failures.push("Cinder Captain must be reachable without a key");
if (reachable(targets.stairs, false)) failures.push("stairs should remain gated before the key");
if (!reachable(targets.gate, true)) failures.push("boss gate must be reachable with the key");
if (!reachable(targets.warden, true)) failures.push("Warden must be reachable with the key");
if (!reachable(targets.stairs, true)) failures.push("stairs must be reachable with the key");

if (failures.length) {
  throw new Error(`Map validation failed: ${failures.join("; ")}`);
}

console.log("Map validation passed.");
