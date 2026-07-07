import { TILE } from "./constants.js";
import { createGame } from "./state.js";
import { setTile } from "./map.js";

const SAVE_KEY = "dotsouls.save.v1";

export function saveGame(game) {
  if (typeof localStorage === "undefined" || !game) return false;
  localStorage.setItem(SAVE_KEY, JSON.stringify(serializeGame(game)));
  return true;
}

export function loadGame() {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    return hydrateGame(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function hasSave() {
  return typeof localStorage !== "undefined" && Boolean(localStorage.getItem(SAVE_KEY));
}

function serializeGame(game) {
  return {
    player: game.player,
    upgrades: game.upgrades,
    progress: game.progress,
    stats: game.stats,
    lastCamp: game.lastCamp,
    bloodstain: game.bloodstain,
    dead: game.dead,
    won: game.won,
    muted: game.muted,
    volume: game.volume,
    turn: game.turn,
    openedGate: game.world.map[game.world.bossGate.y * game.world.width + game.world.bossGate.x] !== TILE.GATE,
    encounterLocks: game.world.encounterLocks?.map((lock) => ({ id: lock.id, active: lock.active, opened: lock.opened })) || [],
    items: game.world.items.map((item) => ({ taken: item.taken, opened: item.opened })),
    enemies: game.world.enemies.map((enemy) => ({
      x: enemy.x,
      y: enemy.y,
      hp: enemy.hp,
      phase: enemy.phase,
      stagger: enemy.stagger,
      vulnerable: enemy.vulnerable,
      cooldown: enemy.cooldown,
      intent: null,
    })),
    decor: Array.from(game.world.decor.entries()),
  };
}

function hydrateGame(save) {
  const game = createGame();
  Object.assign(game.player, save.player || {});
  Object.assign(game.upgrades, save.upgrades || {});
  Object.assign(game.progress, save.progress || {});
  Object.assign(game.stats, save.stats || {});
  game.lastCamp = save.lastCamp || game.lastCamp;
  game.bloodstain = save.bloodstain || null;
  game.dead = Boolean(save.dead);
  game.won = Boolean(save.won);
  game.muted = save.muted ?? game.muted;
  game.volume = save.volume ?? game.volume;
  game.paused = false;
  game.turn = save.turn || 0;
  if (save.openedGate) setTile(game.world, game.world.bossGate.x, game.world.bossGate.y, TILE.FLOOR);
  if (Array.isArray(save.items)) {
    save.items.forEach((saved, index) => Object.assign(game.world.items[index] || {}, saved));
  }
  if (Array.isArray(save.enemies)) {
    save.enemies.forEach((saved, index) => Object.assign(game.world.enemies[index] || {}, saved, { intent: null }));
  }
  if (Array.isArray(save.decor)) {
    game.world.decor = new Map(save.decor);
  }
  if (Array.isArray(save.encounterLocks) && Array.isArray(game.world.encounterLocks)) {
    save.encounterLocks.forEach((saved) => {
      const lock = game.world.encounterLocks.find((candidate) => candidate.id === saved.id);
      if (!lock) return;
      lock.active = Boolean(saved.active);
      lock.opened = Boolean(saved.opened);
      const tile = lock.active ? TILE.LOCK : TILE.FLOOR;
      for (const gate of lock.gates) setTile(game.world, gate.x, gate.y, tile);
    });
  }
  game.log = ["Loaded the last campfire memory.", ...game.log].slice(0, 12);
  return game;
}
