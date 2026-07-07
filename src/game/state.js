import { DECOR, DIRS, DIR_ORDER, ENEMY, ITEM, TILE } from "./constants.js";
import { createMap, isPassable, setTile, tileAt } from "./map.js";

const STAMINA = {
  move: 1,
  dodge: 3,
  guard: 1,
};

export const WEAPON_ORDER = ["ashblade", "dagger", "spear", "axe", "greatsword"];

export const WEAPONS = {
  ashblade: {
    id: "ashblade",
    label: "Ashblade",
    kind: "sword",
    quickCost: 2,
    heavyCost: 4,
    damage: 4,
    quickBonus: 0,
    heavyBonus: 4,
    quickStagger: 1,
    heavyStagger: 2,
    quickEffect: "slash",
    heavyEffect: "thrust",
  },
  dagger: {
    id: "dagger",
    label: "Moon Dagger",
    kind: "dagger",
    quickCost: 1,
    heavyCost: 3,
    damage: 3,
    quickBonus: 1,
    heavyBonus: 3,
    quickStagger: 1,
    heavyStagger: 1,
    quickEffect: "thrust",
    heavyEffect: "slash",
  },
  spear: {
    id: "spear",
    label: "Cinder Spear",
    kind: "spear",
    quickCost: 2,
    heavyCost: 5,
    damage: 5,
    quickBonus: 0,
    heavyBonus: 4,
    quickStagger: 1,
    heavyStagger: 3,
    quickEffect: "thrust",
    heavyEffect: "thrust",
  },
  axe: {
    id: "axe",
    label: "Crypt Axe",
    kind: "axe",
    quickCost: 3,
    heavyCost: 6,
    damage: 7,
    quickBonus: 1,
    heavyBonus: 5,
    quickStagger: 2,
    heavyStagger: 4,
    quickEffect: "slash",
    heavyEffect: "slash",
  },
  greatsword: {
    id: "greatsword",
    label: "Bell Greatsword",
    kind: "greatsword",
    quickCost: 4,
    heavyCost: 7,
    damage: 8,
    quickBonus: 1,
    heavyBonus: 7,
    quickStagger: 2,
    heavyStagger: 5,
    quickEffect: "slash",
    heavyEffect: "slash",
  },
};

export const CAMP_SHOP = [
  { id: "hp", label: "Kindle Vigor", basePrice: 25, detail: "+4 max HP" },
  { id: "stamina", label: "Temper Breath", basePrice: 22, detail: "+2 max stamina" },
  { id: "damage", label: "Sharpen Blade", basePrice: 36, detail: "+1 weapon damage" },
  { id: "flask", label: "Bless Flask", basePrice: 46, detail: "+1 flask charge" },
  { id: "dagger", label: "Moon Dagger", basePrice: 35, detail: "fast weapon, cheap attacks" },
  { id: "spear", label: "Cinder Spear", basePrice: 55, detail: "unlocks after the Captain falls" },
  { id: "axe", label: "Crypt Axe", basePrice: 85, detail: "unlocks after the boss gate opens" },
  { id: "greatsword", label: "Bell Greatsword", basePrice: 110, detail: "unlocks after the Warden falls" },
];

export function createGame() {
  const world = createMap();
  return {
    world,
    player: {
      x: world.start.x,
      y: world.start.y,
      hp: 24,
      hpMax: 24,
      stamina: 12,
      staminaMax: 12,
      souls: 0,
      embers: 0,
      flasks: 2,
      flasksMax: 2,
      hasKey: false,
      descentKey: false,
      relics: 0,
      weaponId: "ashblade",
      weapons: ["ashblade"],
      weaponLevels: {
        ashblade: 0,
        dagger: 0,
        spear: 0,
        axe: 0,
        greatsword: 0,
      },
      weapon: "Ashblade",
      damageBonus: 0,
      damage: 4,
      facing: "right",
      guard: false,
      invuln: 0,
      combo: 0,
    },
    upgrades: {
      hp: 0,
      stamina: 0,
      damage: 0,
      flask: 0,
      dagger: false,
      spear: false,
      axe: false,
      greatsword: false,
    },
    progress: {
      captainDefeated: false,
      bossGateOpened: false,
      wardenDefeated: false,
    },
    stats: {
      deaths: 0,
      enemiesDefeated: 0,
      soulsRecovered: 0,
      soulsLost: 0,
      soulsSpent: 0,
      bloodstainsRecovered: 0,
      criticalHits: 0,
      purchases: 0,
      weaponUpgrades: 0,
      victories: 0,
      destructiblesBroken: 0,
    },
    lastCamp: { x: world.start.x, y: world.start.y },
    bloodstain: null,
    log: [
      "Ember Vendor: Press L at the campfire if you want to live longer.",
      "The Fallen Chapel listens.",
    ],
    dialogue: {
      speaker: "Ember Vendor",
      text: "Still breathing? Good. Press L by my fire and spend those souls before the chapel eats them.",
      t: 720,
    },
    effects: [],
    dead: false,
    won: false,
    muted: true,
    volume: .65,
    paused: false,
    debug: false,
    turn: 0,
    shake: 0,
  };
}

export function pushLog(game, text) {
  game.log.unshift(text);
  game.log = game.log.slice(0, 12);
}

export function enemyAt(game, x, y) {
  return game.world.enemies.find((enemy) => enemy.hp > 0 && enemy.x === x && enemy.y === y);
}

export function itemAt(game, x, y) {
  return game.world.items.find((item) => !item.taken && item.x === x && item.y === y);
}

export function setFacing(game, dirName) {
  if (DIRS[dirName]) game.player.facing = dirName;
}

export function actMove(game, dirName) {
  if (!canAct(game)) return false;
  setFacing(game, dirName);
  const dir = DIRS[dirName];
  const target = { x: game.player.x + dir.x, y: game.player.y + dir.y };
  const foe = enemyAt(game, target.x, target.y);
  if (foe) return quickAttack(game);
  if (!spend(game, STAMINA.move)) return false;
  if (!movePlayerTo(game, target.x, target.y)) return false;
  finishPlayerAction(game, "step");
  return true;
}

export function quickAttack(game) {
  const weapon = equippedWeapon(game);
  const level = weaponUpgradeLevel(game, weapon.id);
  if (!canAct(game) || !spend(game, weaponCost(weapon, "quick", level))) return false;
  const cells = weaponCells(game, weapon, "quick");
  const damage = weapon.damage + weapon.quickBonus + game.player.damageBonus + upgradeDamageBonus(weapon, level) + game.player.combo;
  const hits = strikeCells(game, cells, damage, weapon.quickStagger + upgradeStaggerBonus(weapon, level), "quick");
  const broken = breakDecor(game, cells, weapon);
  game.player.combo = hits ? Math.min(3, game.player.combo + 1) : 0;
  game.effects.push({ kind: weapon.quickEffect, weapon: weapon.id, cells, facing: game.player.facing, t: 16, max: 16, hit: hits || broken });
  game.shake = hits ? 5 : broken ? 4 : 2;
  pushLog(game, hits ? weaponHitLine(weapon, "quick") : broken ? `${weapon.label} smashes through the chapel debris.` : `${weapon.label} cuts empty air.`);
  finishPlayerAction(game, "quick");
  return true;
}

export function heavyAttack(game) {
  const weapon = equippedWeapon(game);
  const level = weaponUpgradeLevel(game, weapon.id);
  if (!canAct(game) || !spend(game, weaponCost(weapon, "heavy", level))) return false;
  const cells = weaponCells(game, weapon, "heavy");
  const damage = weapon.damage + weapon.heavyBonus + game.player.damageBonus + upgradeDamageBonus(weapon, level);
  const hits = strikeCells(game, cells, damage, weapon.heavyStagger + upgradeStaggerBonus(weapon, level), "heavy");
  const broken = breakDecor(game, cells, weapon);
  game.player.combo = 0;
  game.effects.push({ kind: weapon.heavyEffect, weapon: weapon.id, cells, facing: game.player.facing, t: 18, max: 18, hit: hits || broken });
  game.shake = hits ? 8 : broken ? 6 : 3;
  pushLog(game, hits ? weaponHitLine(weapon, "heavy") : broken ? `${weapon.label} tears the room open.` : `${weapon.label} lands on stone.`);
  finishPlayerAction(game, "heavy");
  return true;
}

export function dodge(game, dirName = game.player.facing) {
  if (!canAct(game) || !spend(game, STAMINA.dodge)) return false;
  setFacing(game, dirName);
  const dir = DIRS[game.player.facing];
  let nx = game.player.x;
  let ny = game.player.y;
  for (let i = 0; i < 2; i += 1) {
    const tx = nx + dir.x;
    const ty = ny + dir.y;
    if (!isPassable(game.world, tx, ty, game.player.hasKey) || enemyAt(game, tx, ty)) break;
    nx = tx;
    ny = ty;
  }
  game.effects.push({ kind: "afterimage", x: game.player.x, y: game.player.y, t: 10, max: 10 });
  game.player.x = nx;
  game.player.y = ny;
  game.player.invuln = 1;
  game.player.combo = 0;
  collect(game);
  recoverBloodstain(game);
  pushLog(game, "You slip through the killing line.");
  finishPlayerAction(game, "dodge");
  return true;
}

export function guard(game) {
  if (!canAct(game) || !spend(game, STAMINA.guard)) return false;
  game.player.guard = true;
  game.effects.push({ kind: "guard", x: game.player.x, y: game.player.y, t: 14, max: 14 });
  pushLog(game, `You raise ${equippedWeapon(game).label} to guard.`);
  finishPlayerAction(game, "guard");
  return true;
}

export function waitTurn(game) {
  if (!canAct(game)) return false;
  pushLog(game, "You hold your ground.");
  finishPlayerAction(game, "wait");
  return true;
}

export function heal(game) {
  const player = game.player;
  if (!canAct(game)) return false;
  if (player.flasks <= 0) {
    pushLog(game, "No flasks remain.");
    return false;
  }
  if (player.hp === player.hpMax) {
    pushLog(game, "You are already whole.");
    return false;
  }
  player.flasks -= 1;
  player.hp = Math.min(player.hpMax, player.hp + 11);
  game.effects.push({ kind: "heal", x: player.x, y: player.y, t: 18, max: 18 });
  pushLog(game, "A flask burns bright in your chest.");
  finishPlayerAction(game, "heal");
  return true;
}

export function updateEffects(game) {
  game.effects = game.effects.filter((effect) => {
    effect.t -= 1;
    return effect.t > 0;
  });
  game.shake = Math.max(0, game.shake - 1);
  if (game.dialogue?.t > 0) game.dialogue.t -= 1;
}

export function setDialogue(game, speaker, text, t = 520) {
  game.dialogue = { speaker, text, t };
}

export function showVendorDialogue(game, variant = "camp") {
  const lines = {
    camp: "Warm your hands, count your souls, then press L. I sell blades, flask blessings, and trouble.",
    shop: "Spend wisely. Every soul in your purse is one the bloodstain can steal back.",
    poor: "Come back with souls. Hope is lovely, but it buys absolutely nothing.",
  };
  setDialogue(game, "Ember Vendor", lines[variant] || lines.camp, 560);
}

export function equipWeapon(game, id) {
  if (!WEAPONS[id] || !game.player.weapons.includes(id)) {
    pushLog(game, "That weapon is not in your pack.");
    return false;
  }
  if (game.player.weaponId === id) return false;
  game.player.weaponId = id;
  updateWeaponDamage(game);
  game.player.combo = 0;
  game.effects.push({ kind: "guard", x: game.player.x, y: game.player.y, t: 10, max: 10 });
  pushLog(game, `Equipped ${game.player.weapon}.`);
  return true;
}

export function cycleWeapon(game, direction = 1) {
  const owned = WEAPON_ORDER.filter((id) => game.player.weapons.includes(id));
  if (owned.length <= 1) {
    pushLog(game, "No other weapon is ready.");
    return false;
  }
  const current = owned.indexOf(game.player.weaponId);
  const next = owned[(current + direction + owned.length) % owned.length];
  return equipWeapon(game, next);
}

export function canUseCamp(game) {
  return !game.dead && !game.won && tileAt(game.world, game.player.x, game.player.y) === TILE.CAMP;
}

export function campPrice(game, id) {
  const item = CAMP_SHOP.find((entry) => entry.id === id);
  if (!item) return 0;
  const repeats = typeof game.upgrades[id] === "number" ? game.upgrades[id] : game.upgrades[id] ? 1 : 0;
  if (WEAPONS[id]) return item.basePrice;
  return Math.floor(item.basePrice * (1 + repeats * 0.55));
}

export function shopItemAvailable(game, id) {
  if (id === "spear") return game.progress.captainDefeated;
  if (id === "axe") return game.progress.bossGateOpened;
  if (id === "greatsword") return game.progress.wardenDefeated;
  return true;
}

export function weaponUpgradeLevel(game, id) {
  return game.player.weaponLevels[id] ?? 0;
}

export function weaponUpgradePrice(game, id) {
  const level = weaponUpgradeLevel(game, id);
  if (!WEAPONS[id] || !game.player.weapons.includes(id) || level >= 2) return 0;
  const base = {
    ashblade: 45,
    dagger: 38,
    spear: 58,
    axe: 76,
    greatsword: 96,
  }[id];
  return level === 0 ? base : Math.floor(base * 1.85);
}

export function weaponUpgradeEmberCost(game, id) {
  const level = weaponUpgradeLevel(game, id);
  if (!WEAPONS[id] || !game.player.weapons.includes(id) || level >= 2) return 0;
  return level + 1;
}

export function weaponUpgradeSummary(game, id) {
  const level = weaponUpgradeLevel(game, id);
  const next = level + 1;
  if (!WEAPONS[id]) return "";
  if (level >= 2) return `${WEAPONS[id].label}+2 is fully tempered.`;
  const emberCost = weaponUpgradeEmberCost(game, id);
  const perks = {
    ashblade: ["+1 damage", "+1 damage, cheaper quick attacks"],
    dagger: ["+1 damage", "+1 damage, heavy hits farther"],
    spear: ["+1 damage", "+1 damage, longer reach"],
    axe: ["+2 damage", "+2 damage, wider heavy sweep"],
    greatsword: ["+2 damage", "+2 damage, longer heavy cleave"],
  }[id];
  return `${WEAPONS[id].label}+${next}: ${perks[level]} (${emberCost} ember${emberCost === 1 ? "" : "s"})`;
}

export function upgradeWeaponAtAnvil(game, id) {
  if (!canUseCamp(game)) {
    pushLog(game, "The anvil waits beside the campfire.");
    return false;
  }
  if (!game.player.weapons.includes(id)) {
    pushLog(game, "You need to own that weapon first.");
    return false;
  }
  const level = weaponUpgradeLevel(game, id);
  if (level >= 2) {
    pushLog(game, `${WEAPONS[id].label}+2 cannot be pushed further here.`);
    return false;
  }
  const price = weaponUpgradePrice(game, id);
  const emberCost = weaponUpgradeEmberCost(game, id);
  if (game.player.souls < price) {
    pushLog(game, `The anvil asks ${price} souls.`);
    showVendorDialogue(game, "poor");
    return false;
  }
  if (game.player.embers < emberCost) {
    pushLog(game, `The anvil needs ${emberCost} ember${emberCost === 1 ? "" : "s"}.`);
    setDialogue(game, "Ember Vendor", "No ember, no temper. Hunt the chapel's sworn dead and crack their fire loose.", 560);
    return false;
  }
  game.player.souls -= price;
  game.player.embers -= emberCost;
  game.stats.soulsSpent += price;
  game.stats.weaponUpgrades += 1;
  game.player.weaponLevels[id] = level + 1;
  if (game.player.weaponId === id) updateWeaponDamage(game);
  game.effects.push({ kind: "burst", x: game.player.x, y: game.player.y, color: "#c7e6ff", t: 20, max: 20 });
  pushLog(game, `${WEAPONS[id].label}+${level + 1} tempered.`);
  setDialogue(game, "Ember Vendor", `Hear that ring? ${WEAPONS[id].label}+${level + 1}. Now it has a name worth fearing.`, 560);
  return true;
}

export function buyCampUpgrade(game, id) {
  if (!canUseCamp(game)) {
    pushLog(game, "The vendor only appears in campfire light.");
    return false;
  }
  const item = CAMP_SHOP.find((entry) => entry.id === id);
  if (!item) return false;
  if (!shopItemAvailable(game, id)) {
    pushLog(game, `${item.label} is not ready for sale yet.`);
    return false;
  }
  if (WEAPONS[id] && game.player.weapons.includes(id)) {
    pushLog(game, `${item.label} is already in your pack.`);
    return false;
  }
  const price = campPrice(game, id);
  if (game.player.souls < price) {
    pushLog(game, `${item.label} costs ${price} souls.`);
    return false;
  }

  game.player.souls -= price;
  game.stats.soulsSpent += price;
  game.stats.purchases += 1;
  if (typeof game.upgrades[id] === "number") game.upgrades[id] += 1;
  else game.upgrades[id] = true;

  if (id === "hp") {
    game.player.hpMax += 4;
    game.player.hp = game.player.hpMax;
  } else if (id === "stamina") {
    game.player.staminaMax += 2;
    game.player.stamina = game.player.staminaMax;
  } else if (id === "damage") {
    game.player.damageBonus += 1;
    updateWeaponDamage(game);
  } else if (id === "flask") {
    game.player.flasksMax += 1;
    game.player.flasks = game.player.flasksMax;
  } else if (WEAPONS[id]) {
    unlockWeapon(game, id);
    equipWeapon(game, id);
  }

  game.effects.push({ kind: "burst", x: game.player.x, y: game.player.y, color: "#ffd166", t: 18, max: 18 });
  pushLog(game, `${item.label} purchased.`);
  return true;
}

export function respawn(game) {
  if (!game.dead) return false;
  game.dead = false;
  game.player.x = game.lastCamp.x;
  game.player.y = game.lastCamp.y;
  game.player.hp = game.player.hpMax;
  game.player.stamina = game.player.staminaMax;
  game.player.flasks = game.player.flasksMax;
  game.player.guard = false;
  game.player.invuln = 1;
  game.player.combo = 0;
  game.effects = [{ kind: "burst", x: game.player.x, y: game.player.y, color: "#ff8a2a", t: 22, max: 22 }];
  game.world.enemies.forEach((enemy) => {
    if (enemy.type === ENEMY.WARDEN && enemy.hp <= 0) return;
    enemy.x = enemy.spawnX;
    enemy.y = enemy.spawnY;
    enemy.hp = enemy.hpMax;
    enemy.phase = 1;
    enemy.atk = enemy.atkBase ?? enemy.atk;
    enemy.stagger = 0;
    enemy.vulnerable = 0;
    enemy.cooldown = 0;
    enemy.intent = null;
  });
  pushLog(game, "You rise at the last campfire. Your bloodstain waits.");
  return true;
}

export function getContextPrompt(game) {
  if (game.dead) return "Press R to rise at the last campfire.";
  if (game.won) return "Press R to begin another descent.";
  if (isBloodstainHere(game)) return `Step taken: recover ${game.bloodstain.souls} souls.`;

  const here = tileAt(game.world, game.player.x, game.player.y);
  if (here === TILE.CAMP) return "Press L or Enter to open the campfire vendor. Tab or 1-5 swaps weapons.";
  if (here === TILE.STAIRS) return game.player.descentKey ? "The Warden's key opens the descent." : "Defeat the Warden and claim the descent key.";

  const item = itemAt(game, game.player.x, game.player.y);
  if (item) return itemPrompt(item);

  const face = facingCell(game);
  if (tileAt(game.world, face.x, face.y) === TILE.GATE) {
    return game.player.hasKey ? "Walk forward to unlock the brass gate." : "The Cinder Captain carries the brass key.";
  }
  return "Find the brass key, break the Warden, descend.";
}

function canAct(game) {
  return !game.dead && !game.won && !game.paused;
}

function spend(game, amount) {
  if (game.player.stamina < amount) {
    pushLog(game, "Not enough stamina.");
    return false;
  }
  game.player.stamina -= amount;
  return true;
}

function equippedWeapon(game) {
  return WEAPONS[game.player.weaponId] || WEAPONS.ashblade;
}

function updateWeaponDamage(game) {
  const weapon = equippedWeapon(game);
  const level = weaponUpgradeLevel(game, weapon.id);
  game.player.weapon = level > 0 ? `${weapon.label}+${level}` : weapon.label;
  game.player.damage = weapon.damage + game.player.damageBonus + upgradeDamageBonus(weapon, level);
}

function unlockWeapon(game, id) {
  if (!WEAPONS[id] || game.player.weapons.includes(id)) return;
  game.player.weapons.push(id);
  game.player.weapons.sort((a, b) => WEAPON_ORDER.indexOf(a) - WEAPON_ORDER.indexOf(b));
}

function weaponCells(game, weapon, mode) {
  const { x, y, facing } = game.player;
  const dir = DIRS[facing];
  const side = perpendicular(facing);
  const level = weaponUpgradeLevel(game, weapon.id);

  if (weapon.kind === "dagger") {
    if (mode === "heavy") {
      const cells = [
        { x: x + dir.x, y: y + dir.y },
        { x: x + side.x, y: y + side.y },
        { x: x - side.x, y: y - side.y },
      ];
      if (level >= 2) cells.push({ x: x + dir.x * 2, y: y + dir.y * 2 });
      return cells;
    }
    return [{ x: x + dir.x, y: y + dir.y }];
  }

  if (weapon.kind === "spear") {
    const reach = (mode === "heavy" ? 3 : 2) + (level >= 2 ? 1 : 0);
    return ray(x, y, dir, reach);
  }

  if (weapon.kind === "axe") {
    const front = { x: x + dir.x, y: y + dir.y };
    if (mode === "heavy") {
      const cells = [
        front,
        { x: front.x + side.x, y: front.y + side.y },
        { x: front.x - side.x, y: front.y - side.y },
        { x: x + side.x, y: y + side.y },
        { x: x - side.x, y: y - side.y },
      ];
      if (level >= 2) cells.push({ x: x - dir.x, y: y - dir.y });
      return cells;
    }
    return attackArc(x, y, facing);
  }

  if (weapon.kind === "greatsword") {
    const front = { x: x + dir.x, y: y + dir.y };
    const far = { x: x + dir.x * 2, y: y + dir.y * 2 };
    if (mode === "heavy") {
      const cells = [
        front,
        far,
        { x: front.x + side.x, y: front.y + side.y },
        { x: front.x - side.x, y: front.y - side.y },
        { x: far.x + side.x, y: far.y + side.y },
        { x: far.x - side.x, y: far.y - side.y },
      ];
      if (level >= 2) cells.push({ x: x + dir.x * 3, y: y + dir.y * 3 });
      return cells;
    }
    return [front, far, { x: front.x + side.x, y: front.y + side.y }, { x: front.x - side.x, y: front.y - side.y }];
  }

  if (mode === "heavy") return ray(x, y, dir, 2);
  if (level >= 2 && mode === "quick") return [{ x: x + dir.x, y: y + dir.y }, { x: x + dir.x * 2, y: y + dir.y * 2 }];
  return attackArc(x, y, facing);
}

function weaponCost(weapon, mode, level) {
  const base = mode === "quick" ? weapon.quickCost : weapon.heavyCost;
  if (weapon.kind === "sword" && level >= 2 && mode === "quick") return Math.max(1, base - 1);
  if (weapon.kind === "spear" && level >= 2 && mode === "heavy") return Math.max(1, base - 1);
  return base;
}

function upgradeDamageBonus(weapon, level) {
  if (weapon.kind === "axe" || weapon.kind === "greatsword") return level * 2;
  return level;
}

function upgradeStaggerBonus(weapon, level) {
  if (level < 2) return 0;
  if (weapon.kind === "axe" || weapon.kind === "greatsword" || weapon.kind === "spear") return 1;
  return 0;
}

function weaponHitLine(weapon, mode) {
  if (weapon.kind === "dagger") return mode === "heavy" ? "Moon Dagger flashes at the flank." : "Moon Dagger bites fast.";
  if (weapon.kind === "spear") return mode === "heavy" ? "Cinder Spear punches through the line." : "Cinder Spear keeps them at reach.";
  if (weapon.kind === "axe") return mode === "heavy" ? "Crypt Axe caves the air around you." : "Crypt Axe hooks through bone.";
  if (weapon.kind === "greatsword") return mode === "heavy" ? "Bell Greatsword tolls through the chapel." : "Bell Greatsword hews a path.";
  return mode === "heavy" ? "Ashblade breaks their stance." : "Ashblade cleaves through the dark.";
}

function breakDecor(game, cells, weapon) {
  let broken = 0;
  for (const cell of cells) {
    const key = `${cell.x},${cell.y}`;
    const decor = game.world.decor.get(key);
    if (decor !== DECOR.PEW && decor !== DECOR.RUBBLE) continue;
    game.world.decor.delete(key);
    game.stats.destructiblesBroken += 1;
    broken += 1;
    const color = decor === DECOR.RUBBLE ? "#a99579" : "#7b4a33";
    game.effects.push({ kind: "burst", x: cell.x, y: cell.y, color, t: 18, max: 18 });
    if (decor === DECOR.RUBBLE && cell.x === 47 && (cell.y === 25 || cell.y === 26)) {
      openRubbleShortcut(game);
    }
  }
  if (broken > 1) pushLog(game, `${weapon.label} clears ${broken} obstacles.`);
  return broken;
}

function openRubbleShortcut(game) {
  for (const cell of [{ x: 47, y: 24 }, { x: 48, y: 24 }, { x: 49, y: 24 }, { x: 50, y: 24 }]) {
    if (tileAt(game.world, cell.x, cell.y) === TILE.WALL) setTile(game.world, cell.x, cell.y, TILE.FLOOR);
  }
  pushLog(game, "The rubble gives way, opening a narrow chapel shortcut.");
}

function updateEncounterLocks(game) {
  if (!Array.isArray(game.world.encounterLocks)) return;
  for (const lock of game.world.encounterLocks) {
    if (lock.opened) continue;
    const inside = game.player.x >= lock.bounds.x
      && game.player.x < lock.bounds.x + lock.bounds.w
      && game.player.y >= lock.bounds.y
      && game.player.y < lock.bounds.y + lock.bounds.h;
    if (!lock.active && inside) {
      lock.active = true;
      for (const gate of lock.gates) setTile(game.world, gate.x, gate.y, TILE.LOCK);
      game.effects.push({ kind: "burst", x: game.player.x, y: game.player.y, color: "#e24b4b", t: 22, max: 22 });
      pushLog(game, `${lock.name}: the exits slam shut.`);
    }
    if (!lock.active) continue;
    const cleared = lock.enemyIds.every((id) => {
      const enemy = game.world.enemies.find((candidate) => candidate.id === id);
      return !enemy || enemy.hp <= 0;
    });
    if (!cleared) continue;
    lock.active = false;
    lock.opened = true;
    for (const gate of lock.gates) setTile(game.world, gate.x, gate.y, TILE.FLOOR);
    game.effects.push({ kind: "burst", x: game.player.x, y: game.player.y, color: "#ffd166", t: 24, max: 24 });
    pushLog(game, `${lock.name}: the chapel unlocks.`);
  }
}

function movePlayerTo(game, x, y) {
  if (!isPassable(game.world, x, y, game.player.hasKey)) {
    if (tileAt(game.world, x, y) === TILE.GATE) pushLog(game, "The brass gate needs its key.");
    else if (tileAt(game.world, x, y) === TILE.LOCK) pushLog(game, "Iron spikes seal the room until the ambush is broken.");
    else {
      const decor = game.world.decor.get(`${x},${y}`);
      if (decor === DECOR.PEW || decor === DECOR.RUBBLE) pushLog(game, "That can be broken with a swing.");
    }
    return false;
  }
  if (tileAt(game.world, x, y) === TILE.GATE && game.player.hasKey) {
    setTile(game.world, x, y, TILE.FLOOR);
    game.player.hasKey = false;
    game.progress.bossGateOpened = true;
    game.effects.push({ kind: "burst", x, y, color: "#78b8ff", t: 16, max: 16 });
    pushLog(game, "The brass key melts into the gate.");
    setDialogue(game, "Ember Vendor", "Gate's open. The old iron in my pack just got heavier. Come see the axe when you survive.", 520);
  }
  game.player.x = x;
  game.player.y = y;
  collect(game);
  recoverBloodstain(game);
  updateEncounterLocks(game);
  if (tileAt(game.world, x, y) === TILE.CAMP) {
    game.lastCamp = { x, y };
    rest(game);
  }
  if (tileAt(game.world, x, y) === TILE.STAIRS) {
    if (!game.player.descentKey) {
      pushLog(game, "The descent needs the Warden's key.");
    } else {
      game.won = true;
      game.stats.victories += 1;
      pushLog(game, "You descend with the chapel's ember.");
    }
  }
  return true;
}

function finishPlayerAction(game, action) {
  game.turn += 1;
  executeEnemyIntents(game);
  if (game.dead || game.won) return;
  updateEncounterLocks(game);
  planEnemies(game);
  game.player.stamina = Math.min(game.player.staminaMax, game.player.stamina + (action === "wait" || action === "guard" ? 3 : 2));
  game.player.invuln = Math.max(0, game.player.invuln - 1);
  if (action !== "guard") game.player.guard = false;
  game.world.enemies.forEach((enemy) => {
    if (enemy.vulnerable > 0) enemy.vulnerable -= 1;
  });
  updateEncounterLocks(game);
}

function strikeCells(game, cells, damage, stagger, kind) {
  let hits = 0;
  for (const cell of cells) {
    const enemy = enemyAt(game, cell.x, cell.y);
    if (!enemy) continue;
    const critical = enemy.vulnerable > 0;
    const finalDamage = critical ? Math.ceil(damage * criticalMultiplier(game)) : damage;
    enemy.hp -= finalDamage;
    enemy.stagger += stagger;
    enemy.intent = null;
    if (critical) {
      enemy.vulnerable = 0;
      enemy.stagger = 0;
      game.stats.criticalHits += 1;
      game.shake = Math.max(game.shake, 12);
      game.effects.push({ kind: "crit", x: enemy.x, y: enemy.y, damage: finalDamage, t: 24, max: 24 });
      pushLog(game, `Critical hit: ${enemy.name} takes ${finalDamage}.`);
    } else {
      game.effects.push({ kind: "hit", x: enemy.x, y: enemy.y, damage: finalDamage, t: 18, max: 18 });
    }
    hits += 1;
    if (enemy.hp <= 0) {
      game.player.souls += enemy.souls;
      game.stats.enemiesDefeated += 1;
      pushLog(game, `${enemy.name} collapses. +${enemy.souls} souls.`);
      if (enemy.type === ENEMY.CAPTAIN) {
        game.player.hasKey = true;
        game.player.embers += 1;
        game.progress.captainDefeated = true;
        pushLog(game, "The captain drops the brass key.");
        pushLog(game, "Claimed a cracked ember. +1 ember.");
        setDialogue(game, "Ember Vendor", "That brass key was earned properly. Bring it to the gate and I'll show you better steel.", 560);
      }
      if (enemy.type === ENEMY.WARDEN) {
        game.player.descentKey = true;
        game.player.embers += 2;
        game.progress.wardenDefeated = true;
        game.effects.push({ kind: "burst", x: enemy.x, y: enemy.y, color: "#e24b4b", t: 30, max: 30 });
        pushLog(game, "The Chapel Warden breaks. The descent key falls cold.");
        pushLog(game, "The bell-heart leaves two hot embers.");
        setDialogue(game, "Ember Vendor", "The Warden's key. Never thought I'd see that ugly thing again. The greatsword is yours to buy now.", 640);
      }
    } else if (enemy.type === ENEMY.WARDEN && enemy.phase === 1 && enemy.hp <= enemy.hpMax / 2) {
      enemy.phase = 2;
      enemy.atk += 2;
      enemy.cooldown = 1;
      enemy.intent = null;
      enemy.stagger = 0;
      game.shake = 14;
      game.effects.push({ kind: "burst", x: enemy.x, y: enemy.y, color: "#ff8a2a", t: 34, max: 34 });
      pushLog(game, "The Warden's bell-heart ignites.");
    } else if (enemy.stagger >= enemy.poise) {
      enemy.stagger = 0;
      enemy.vulnerable = 2;
      enemy.cooldown = 1;
      enemy.intent = null;
      pushLog(game, `${enemy.name} staggers. Strike now.`);
    } else if (kind === "heavy") {
      pushLog(game, `${enemy.name}'s attack is interrupted.`);
    }
  }
  return hits;
}

function criticalMultiplier(game) {
  const weapon = equippedWeapon(game);
  if (weapon.kind === "dagger") return 2.8;
  if (weapon.kind === "spear") return 2.35;
  if (weapon.kind === "greatsword") return 2.2;
  if (weapon.kind === "axe") return 2.05;
  return 2.25;
}

function attackArc(x, y, facing) {
  const dir = DIRS[facing];
  const side = perpendicular(facing);
  return [
    { x: x + dir.x, y: y + dir.y },
    { x: x + dir.x + side.x, y: y + dir.y + side.y },
    { x: x + dir.x - side.x, y: y + dir.y - side.y },
  ];
}

function perpendicular(facing) {
  if (facing === "up" || facing === "down") return { x: 1, y: 0 };
  return { x: 0, y: 1 };
}

function collect(game) {
  const item = itemAt(game, game.player.x, game.player.y);
  if (!item) return;
  if (item.type === ITEM.SOULS) {
    game.player.souls += item.amount;
    pushLog(game, `Recovered ${item.amount} cold souls.`);
    item.taken = true;
  } else if (item.type === ITEM.FLASK) {
    game.player.flasksMax += 1;
    game.player.flasks = game.player.flasksMax;
    pushLog(game, "Found an extra flask.");
    item.taken = true;
  } else if (item.type === ITEM.KEY) {
    game.player.hasKey = true;
    pushLog(game, "Found the brass key.");
    item.taken = true;
  } else if (item.type === ITEM.RELIC) {
    game.player.relics += 1;
    game.player.embers += 1;
    game.player.damageBonus += 1;
    updateWeaponDamage(game);
    game.player.hpMax += 4;
    game.player.hp += 4;
    pushLog(game, "Cinder Relic claimed: blade, body, and ember strengthened.");
    item.taken = true;
  } else if (item.type === ITEM.CHEST) {
    item.opened = true;
    item.taken = true;
    game.player.souls += item.reward;
    game.player.embers += 1;
    pushLog(game, `Opened a reliquary. +${item.reward} souls, +1 ember.`);
  }
}

function itemPrompt(item) {
  if (item.type === ITEM.SOULS) return `Cold souls: ${item.amount}.`;
  if (item.type === ITEM.FLASK) return "Flask shard: walk onto it to claim another charge.";
  if (item.type === ITEM.KEY) return "Brass key: walk onto it to unlock the Warden gate.";
  if (item.type === ITEM.RELIC) return "Cinder Relic: permanent strength lies here.";
  if (item.type === ITEM.CHEST && !item.opened) return "Reliquary chest: walk onto it to open.";
  return "";
}

function facingCell(game) {
  const dir = DIRS[game.player.facing];
  return { x: game.player.x + dir.x, y: game.player.y + dir.y };
}

function isBloodstainHere(game) {
  return game.bloodstain && game.bloodstain.x === game.player.x && game.bloodstain.y === game.player.y;
}

function recoverBloodstain(game) {
  if (!isBloodstainHere(game)) return;
  const recovered = game.bloodstain.souls;
  game.player.souls += recovered;
  game.stats.soulsRecovered += recovered;
  game.stats.bloodstainsRecovered += 1;
  game.effects.push({ kind: "burst", x: game.player.x, y: game.player.y, color: "#e24b4b", t: 22, max: 22 });
  game.bloodstain = null;
  pushLog(game, recovered > 0 ? `Recovered your bloodstain: ${recovered} souls.` : "The bloodstain fades.");
}

function rest(game) {
  const player = game.player;
  const restored = player.hp !== player.hpMax || player.flasks !== player.flasksMax;
  player.hp = player.hpMax;
  player.flasks = player.flasksMax;
  player.stamina = player.staminaMax;
  if (restored) pushLog(game, "You kneel at the ember and breathe.");
  pushLog(game, "A quiet vendor waits in the flame. Press L.");
  showVendorDialogue(game, "camp");
}

function executeEnemyIntents(game) {
  for (const enemy of game.world.enemies) {
    if (enemy.hp <= 0 || !enemy.intent) continue;
    const intent = enemy.intent;
    enemy.intent = null;
    const playerInDanger = intent.cells.some((cell) => cell.x === game.player.x && cell.y === game.player.y);
    game.effects.push({ kind: "enemyStrike", cells: intent.cells, t: 12, max: 12 });
    if (!playerInDanger || game.player.invuln > 0) continue;
    const parried = game.player.guard && isFacing(game.player, enemy);
    if (parried) {
      enemy.stagger += 2;
      enemy.cooldown = 1;
      game.player.stamina = Math.min(game.player.staminaMax, game.player.stamina + 2);
      game.effects.push({ kind: "parry", x: game.player.x, y: game.player.y, t: 16, max: 16 });
      pushLog(game, `Parried ${enemy.name}.`);
      continue;
    }
    const guarded = game.player.guard;
    const damage = guarded ? Math.max(1, Math.floor(intent.damage / 2)) : intent.damage;
    game.player.hp -= damage;
    game.player.combo = 0;
    game.shake = 10;
    game.effects.push({ kind: "hit", x: game.player.x, y: game.player.y, damage, t: 18, max: 18 });
    pushLog(game, guarded ? `Guard absorbs part of the blow (${damage}).` : `${enemy.name} hits you for ${damage}.`);
    if (game.player.hp <= 0) {
      dropBloodstain(game);
      game.dead = true;
      pushLog(game, "You died.");
      return;
    }
  }
}

function dropBloodstain(game) {
  const souls = game.player.souls;
  game.bloodstain = { x: game.player.x, y: game.player.y, souls };
  game.player.souls = 0;
  game.stats.deaths += 1;
  game.stats.soulsLost += souls;
  game.effects.push({ kind: "burst", x: game.player.x, y: game.player.y, color: "#e24b4b", t: 26, max: 26 });
  pushLog(game, souls > 0 ? `Your bloodstain holds ${souls} souls.` : "A bloodstain marks where you fell.");
}

function isFacing(player, enemy) {
  const dir = DIRS[player.facing];
  return Math.sign(enemy.x - player.x) === dir.x && Math.sign(enemy.y - player.y) === dir.y
    || (dir.x !== 0 && enemy.y === player.y && Math.sign(enemy.x - player.x) === dir.x)
    || (dir.y !== 0 && enemy.x === player.x && Math.sign(enemy.y - player.y) === dir.y);
}

function planEnemies(game) {
  for (const enemy of game.world.enemies) {
    if (enemy.hp <= 0) continue;
    if (enemy.cooldown > 0) {
      enemy.cooldown -= 1;
      continue;
    }
    const dist = distance(enemy, game.player);
    if (dist > aggroRange(enemy)) continue;
    const intent = makeIntent(game, enemy, dist);
    if (intent) {
      enemy.intent = intent;
      game.effects.push({ kind: "tell", cells: intent.cells, t: 20, max: 20 });
    } else {
      stepEnemy(game, enemy);
    }
  }
}

function makeIntent(game, enemy, dist) {
  const toPlayer = directionTo(enemy, game.player);
  if (enemy.type === ENEMY.ACOLYTE && (enemy.x === game.player.x || enemy.y === game.player.y) && dist <= 7) {
    return { type: "bolt", cells: ray(enemy.x, enemy.y, toPlayer, 6), damage: enemy.atk };
  }
  if (enemy.type === ENEMY.SLIME && dist <= 4) {
    const dir = directionTo(enemy, game.player);
    return { type: "leap", cells: [{ x: enemy.x + dir.x * 2, y: enemy.y + dir.y * 2 }, { x: game.player.x, y: game.player.y }], damage: enemy.atk };
  }
  if (enemy.type === ENEMY.BRUTE && dist <= 2) {
    return { type: "sweep", cells: attackArc(enemy.x, enemy.y, dirName(toPlayer)), damage: enemy.atk };
  }
  if (enemy.type === ENEMY.CAPTAIN && dist <= 2) {
    const dir = directionTo(enemy, game.player);
    return { type: "lunge", cells: [{ x: enemy.x + dir.x, y: enemy.y + dir.y }, { x: enemy.x + dir.x * 2, y: enemy.y + dir.y * 2 }], damage: enemy.atk };
  }
  if (enemy.type === ENEMY.WARDEN && dist <= 5) {
    const dir = directionTo(enemy, game.player);
    const line = ray(enemy.x, enemy.y, dir, enemy.phase === 2 ? 4 : 3);
    const side = perpendicular(dirName(dir));
    const cells = [...line, { x: enemy.x + side.x, y: enemy.y + side.y }, { x: enemy.x - side.x, y: enemy.y - side.y }];
    if (enemy.phase === 2) {
      cells.push(
        { x: enemy.x + side.x * 2, y: enemy.y + side.y * 2 },
        { x: enemy.x - side.x * 2, y: enemy.y - side.y * 2 },
        { x: enemy.x - dir.x, y: enemy.y - dir.y },
      );
    }
    return { type: enemy.phase === 2 ? "wardenPhase" : "warden", cells, damage: enemy.atk };
  }
  if (dist === 1) return { type: "slash", cells: [{ x: game.player.x, y: game.player.y }], damage: enemy.atk };
  return null;
}

function stepEnemy(game, enemy) {
  const options = pathOptions(enemy, game.player);
  for (const step of options) {
    const nx = enemy.x + step.x;
    const ny = enemy.y + step.y;
    if (isPassable(game.world, nx, ny, true) && !enemyAt(game, nx, ny) && (game.player.x !== nx || game.player.y !== ny)) {
      enemy.x = nx;
      enemy.y = ny;
      return;
    }
  }
}

function distance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function directionTo(a, b) {
  const dx = Math.sign(b.x - a.x);
  const dy = Math.sign(b.y - a.y);
  if (Math.abs(b.x - a.x) >= Math.abs(b.y - a.y)) return { x: dx, y: 0 };
  return { x: 0, y: dy };
}

function dirName(dir) {
  if (dir.x > 0) return "right";
  if (dir.x < 0) return "left";
  if (dir.y > 0) return "down";
  return "up";
}

function pathOptions(a, b) {
  const primary = directionTo(a, b);
  const secondary = primary.x ? { x: 0, y: Math.sign(b.y - a.y) } : { x: Math.sign(b.x - a.x), y: 0 };
  return [primary, secondary, { x: -secondary.x, y: -secondary.y }];
}

function ray(x, y, dir, length) {
  const cells = [];
  for (let i = 1; i <= length; i += 1) cells.push({ x: x + dir.x * i, y: y + dir.y * i });
  return cells;
}

function aggroRange(enemy) {
  if (enemy.type === ENEMY.WARDEN) return 12;
  if (enemy.type === ENEMY.ACOLYTE) return 9;
  return 7;
}

export function dangerCells(game) {
  return game.world.enemies.flatMap((enemy) => enemy.hp > 0 && enemy.intent ? enemy.intent.cells : []);
}

export function liveEnemies(game) {
  return game.world.enemies.filter((enemy) => enemy.hp > 0);
}
