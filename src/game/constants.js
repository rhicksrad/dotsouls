export const TILE = {
  VOID: 0,
  FLOOR: 1,
  WALL: 2,
  CAMP: 3,
  STAIRS: 4,
  GATE: 5,
  LOCK: 6,
};

export const ITEM = {
  SOULS: "souls",
  FLASK: "flask",
  KEY: "key",
  CHEST: "chest",
  RELIC: "relic",
};

export const ENEMY = {
  HOLLOW: "hollow",
  SLIME: "slime",
  ACOLYTE: "acolyte",
  BRUTE: "brute",
  CAPTAIN: "captain",
  WARDEN: "warden",
};

export const DIRS = {
  up: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
};

export const DIR_ORDER = ["up", "right", "down", "left"];

export const DECOR = {
  ALTAR: "altar",
  PEW: "pew",
  BANNER: "banner",
  GRAVE: "grave",
  GLASS: "glass",
  RUBBLE: "rubble",
};

export const VIEW = {
  cols: 36,
  rows: 24,
  tile: 24,
};

export const COLORS = {
  text: "#f5e6c8",
  gold: "#ffd166",
  blue: "#78b8ff",
  green: "#7be27f",
  red: "#e24b4b",
  muted: "#a99579",
};
