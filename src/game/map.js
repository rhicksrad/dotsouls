import { DECOR, ENEMY, ITEM, TILE } from "./constants.js";

const W = 84;
const H = 54;

function idx(x, y) {
  return y * W + x;
}

function carve(map, x, y, w, h, tile = TILE.FLOOR) {
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) {
      if (xx > 0 && yy > 0 && xx < W - 1 && yy < H - 1) map[idx(xx, yy)] = tile;
    }
  }
}

function frame(map, x, y, w, h) {
  for (let xx = x; xx < x + w; xx += 1) {
    map[idx(xx, y)] = TILE.WALL;
    map[idx(xx, y + h - 1)] = TILE.WALL;
  }
  for (let yy = y; yy < y + h; yy += 1) {
    map[idx(x, yy)] = TILE.WALL;
    map[idx(x + w - 1, yy)] = TILE.WALL;
  }
}

function room(map, x, y, w, h) {
  carve(map, x, y, w, h);
  frame(map, x, y, w, h);
}

function set(map, x, y, tile) {
  if (x >= 0 && y >= 0 && x < W && y < H) map[idx(x, y)] = tile;
}

function addEnemy(enemies, x, y, type, name) {
  const stats = {
    [ENEMY.HOLLOW]: { hp: 7, atk: 3, souls: 7, poise: 1 },
    [ENEMY.SLIME]: { hp: 6, atk: 3, souls: 6, poise: 1 },
    [ENEMY.ACOLYTE]: { hp: 8, atk: 4, souls: 10, poise: 1 },
    [ENEMY.BRUTE]: { hp: 13, atk: 5, souls: 16, poise: 2 },
    [ENEMY.CAPTAIN]: { hp: 18, atk: 5, souls: 28, poise: 3 },
    [ENEMY.WARDEN]: { hp: 48, atk: 7, souls: 120, poise: 5 },
  }[type];
  enemies.push({
    id: `${type}-${enemies.length}`,
    x,
    y,
    spawnX: x,
    spawnY: y,
    type,
    name: name || enemyName(type),
    hp: stats.hp,
    hpMax: stats.hp,
    atk: stats.atk,
    atkBase: stats.atk,
    souls: stats.souls,
    poise: stats.poise,
    phase: 1,
    stagger: 0,
    vulnerable: 0,
    cooldown: 0,
    intent: null,
  });
}

function enemyName(type) {
  return {
    [ENEMY.HOLLOW]: "Ash Hollow",
    [ENEMY.SLIME]: "Grave Slime",
    [ENEMY.ACOLYTE]: "Bell Acolyte",
    [ENEMY.BRUTE]: "Pew Breaker",
    [ENEMY.CAPTAIN]: "Cinder Captain",
    [ENEMY.WARDEN]: "Chapel Warden",
  }[type];
}

export function createMap() {
  const map = new Uint8Array(W * H);
  map.fill(TILE.VOID);
  const decor = new Map();
  const items = [];
  const enemies = [];
  const naveLockGates = [
    { x: 20, y: 25 }, { x: 20, y: 26 }, { x: 20, y: 27 }, { x: 20, y: 28 }, { x: 20, y: 29 },
    { x: 41, y: 25 }, { x: 41, y: 26 }, { x: 41, y: 27 },
  ];

  room(map, 4, 20, 17, 15);      // vestry start
  room(map, 20, 16, 22, 22);     // nave
  room(map, 41, 21, 12, 10);     // transept bridge
  room(map, 52, 13, 19, 24);     // reliquary
  room(map, 31, 4, 16, 11);      // balcony
  room(map, 57, 39, 20, 10);     // crypt
  room(map, 69, 18, 11, 18);     // boss antechamber

  carve(map, 18, 25, 6, 5);
  carve(map, 38, 25, 7, 3);
  carve(map, 50, 25, 5, 3);
  carve(map, 38, 10, 4, 8);
  carve(map, 63, 35, 4, 7);

  set(map, 9, 27, TILE.CAMP);
  set(map, 37, 10, TILE.CAMP);
  set(map, 69, 29, TILE.GATE);
  set(map, 74, 27, TILE.STAIRS);

  for (let y = 20; y <= 33; y += 4) {
    for (let x = 24; x <= 37; x += 5) decor.set(`${x},${y}`, DECOR.PEW);
  }
  for (let x = 34; x <= 44; x += 5) decor.set(`${x},6`, DECOR.GLASS);
  decor.set("36,11", DECOR.ALTAR);
  decor.set("58,16", DECOR.BANNER);
  decor.set("67,16", DECOR.BANNER);
  decor.set("62,44", DECOR.GRAVE);
  decor.set("70,44", DECOR.GRAVE);
  decor.set("47,25", DECOR.RUBBLE);
  decor.set("47,26", DECOR.RUBBLE);

  items.push({ x: 14, y: 24, type: ITEM.SOULS, amount: 20 });
  items.push({ x: 36, y: 8, type: ITEM.FLASK });
  items.push({ x: 65, y: 17, type: ITEM.CHEST, opened: false, reward: 45 });
  items.push({ x: 63, y: 44, type: ITEM.RELIC, name: "Cinder Relic" });

  addEnemy(enemies, 16, 27, ENEMY.HOLLOW);
  addEnemy(enemies, 27, 25, ENEMY.HOLLOW);
  addEnemy(enemies, 34, 30, ENEMY.HOLLOW);
  addEnemy(enemies, 37, 22, ENEMY.BRUTE);
  addEnemy(enemies, 40, 9, ENEMY.ACOLYTE);
  addEnemy(enemies, 58, 20, ENEMY.ACOLYTE);
  addEnemy(enemies, 63, 27, ENEMY.CAPTAIN);
  addEnemy(enemies, 65, 42, ENEMY.SLIME);
  addEnemy(enemies, 72, 43, ENEMY.SLIME);
  addEnemy(enemies, 74, 28, ENEMY.WARDEN);

  const encounterLocks = [
    {
      id: "nave",
      name: "Nave ambush",
      bounds: { x: 21, y: 17, w: 20, h: 20 },
      gates: naveLockGates,
      enemyIds: ["hollow-1", "hollow-2", "brute-3"],
      active: false,
      opened: false,
    },
  ];

  return {
    width: W,
    height: H,
    map,
    decor,
    items,
    enemies,
    encounterLocks,
    start: { x: 9, y: 27 },
    bossGate: { x: 69, y: 29 },
    objective: "Find the brass key, break the Warden, descend.",
  };
}

export function tileAt(world, x, y) {
  if (x < 0 || y < 0 || x >= world.width || y >= world.height) return TILE.WALL;
  return world.map[idx(x, y)];
}

export function setTile(world, x, y, tile) {
  set(world.map, x, y, tile);
}

export function isPassable(world, x, y, hasKey = false) {
  const tile = tileAt(world, x, y);
  if (tile === TILE.GATE) return hasKey;
  if (tile === TILE.LOCK) return false;
  const decor = world.decor?.get(`${x},${y}`);
  if (decor === DECOR.PEW || decor === DECOR.RUBBLE) return false;
  return tile === TILE.FLOOR || tile === TILE.CAMP || tile === TILE.STAIRS;
}
