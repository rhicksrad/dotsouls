import "./validate-map.mjs";
import { DECOR, ENEMY, TILE } from "../src/game/constants.js";
import { isPassable, setTile } from "../src/game/map.js";
import {
  CAMP_SHOP,
  actMove,
  createGame,
  equipWeapon,
  quickAttack,
  respawn,
  waitTurn,
  heavyAttack,
  upgradeWeaponAtAnvil,
  weaponUpgradeLevel,
  weaponUpgradeEmberCost,
} from "../src/game/state.js";
import { hasSave, loadGame, saveGame } from "../src/game/save.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function testBloodstainRecovery() {
  const game = createGame();
  game.player.x = 10;
  game.player.y = 27;
  game.lastCamp = { x: 9, y: 27 };
  game.player.souls = 42;
  game.player.hp = 1;
  game.world.enemies = [enemy(12, 27, { intent: { cells: [{ x: 10, y: 27 }], damage: 99 } })];

  waitTurn(game);
  assert(game.dead, "player should die from lethal intent");
  assert(game.player.souls === 0, "death should remove carried souls");
  assert(game.bloodstain?.souls === 42, "death should store carried souls in bloodstain");

  respawn(game);
  game.player.x = 9;
  game.player.y = 27;
  game.player.souls = 0;
  game.player.stamina = game.player.staminaMax;
  game.player.facing = "right";
  game.world.enemies = [];
  game.bloodstain = { x: 10, y: 27, souls: 42 };
  const moved = actMove(game, "right");
  assert(moved, "player should move onto the bloodstain");
  assert(game.player.souls === 42, "bloodstain should restore souls");
  assert(game.bloodstain === null, "bloodstain should clear after recovery");
}

function testWeaponReach() {
  const swordGame = createGame();
  setupDuel(swordGame, 12, 10);
  quickAttack(swordGame);
  assert(swordGame.world.enemies[0].hp === 30, "Ashblade quick attack should not hit two tiles away");

  const spearGame = createGame();
  setupDuel(spearGame, 12, 10);
  spearGame.player.weapons.push("spear");
  equipWeapon(spearGame, "spear");
  quickAttack(spearGame);
  assert(spearGame.world.enemies[0].hp < 30, "Cinder Spear quick attack should hit two tiles away");

  const axeGame = createGame();
  setupDuel(axeGame, 10, 9);
  axeGame.player.weapons.push("axe");
  equipWeapon(axeGame, "axe");
  heavyAttack(axeGame);
  assert(axeGame.world.enemies[0].hp < 30, "Crypt Axe heavy attack should hit adjacent side cells");
}

function testCriticalWindow() {
  const game = createGame();
  game.player.x = 10;
  game.player.y = 10;
  game.player.facing = "right";
  game.player.stamina = game.player.staminaMax;
  game.world.enemies = [enemy(11, 10, { hp: 50, hpMax: 50, poise: 1 })];

  quickAttack(game);
  const afterStagger = game.world.enemies[0].hp;
  assert(game.world.enemies[0].vulnerable > 0, "stagger should open a critical window");
  game.player.stamina = game.player.staminaMax;
  quickAttack(game);
  const criticalDamage = afterStagger - game.world.enemies[0].hp;
  assert(criticalDamage > 8, "second hit during vulnerability should deal critical damage");
  assert(game.world.enemies[0].vulnerable === 0, "critical hit should consume the vulnerability window");
}

function testWardenPhase() {
  const game = createGame();
  const warden = game.world.enemies.find((entry) => entry.type === ENEMY.WARDEN);
  assert(warden, "map should contain a Warden");
  game.player.x = warden.x - 1;
  game.player.y = warden.y;
  game.player.facing = "right";
  game.player.stamina = game.player.staminaMax;
  warden.hp = Math.floor(warden.hpMax / 2) + 2;
  warden.phase = 1;
  const baseAtk = warden.atk;

  heavyAttack(game);
  assert(warden.phase === 2, "Warden should enter phase two below half health");
  assert(warden.atk === baseAtk + 2, "Warden phase two should increase attack");
}

function testKeyProgressionAndAnvil() {
  assert(!CAMP_SHOP.some((item) => item.id === "key"), "brass key should not be sold by the vendor");

  const keyGame = createGame();
  keyGame.player.x = 10;
  keyGame.player.y = 10;
  keyGame.player.facing = "right";
  keyGame.world.enemies = [enemy(11, 10, { type: ENEMY.CAPTAIN, name: "Test Captain", hp: 1 })];
  quickAttack(keyGame);
  assert(keyGame.player.hasKey, "Captain should drop the brass key");
  assert(keyGame.player.embers === 1, "Captain should drop one ember");
  assert(keyGame.progress.captainDefeated, "Captain kill should advance vendor inventory");

  const anvilGame = createGame();
  anvilGame.player.souls = 999;
  assert(!upgradeWeaponAtAnvil(anvilGame, "ashblade"), "anvil should require embers");
  anvilGame.player.embers = 3;
  assert(weaponUpgradeEmberCost(anvilGame, "ashblade") === 1, "+1 should cost one ember");
  assert(upgradeWeaponAtAnvil(anvilGame, "ashblade"), "anvil should upgrade owned weapon to +1");
  assert(anvilGame.player.embers === 2, "+1 should consume one ember");
  assert(weaponUpgradeEmberCost(anvilGame, "ashblade") === 2, "+2 should cost two embers");
  assert(upgradeWeaponAtAnvil(anvilGame, "ashblade"), "anvil should upgrade owned weapon to +2");
  assert(anvilGame.player.embers === 0, "+2 should consume two embers");
  assert(!upgradeWeaponAtAnvil(anvilGame, "ashblade"), "anvil should cap upgrades at +2");
  assert(weaponUpgradeLevel(anvilGame, "ashblade") === 2, "ashblade should stop at +2");
}

function testDestructibles() {
  const game = createGame();
  game.player.x = 23;
  game.player.y = 20;
  game.player.facing = "right";
  game.player.stamina = game.player.staminaMax;
  game.world.enemies = [];

  assert(game.world.decor.get("24,20") === DECOR.PEW, "test fixture should place a pew in front of the player");
  assert(!isPassable(game.world, 24, 20, false), "destructible pews should block movement");
  assert(quickAttack(game), "quick attack should swing into destructible decor");
  assert(!game.world.decor.has("24,20"), "weapon swing should remove a destructible pew");
  assert(isPassable(game.world, 24, 20, false), "cleared decor should become passable");
  assert(game.stats.destructiblesBroken === 1, "breaking decor should increment run stats");
}

function testEncounterLock() {
  const game = createGame();
  game.player.x = 20;
  game.player.y = 27;
  game.player.facing = "right";
  game.player.stamina = game.player.staminaMax;

  assert(actMove(game, "right"), "stepping into the nave should be allowed");
  const lock = game.world.encounterLocks.find((entry) => entry.id === "nave");
  assert(lock.active, "nave encounter should lock when entered");
  assert(game.world.map[27 * game.world.width + 20] === TILE.LOCK, "nave entrance should seal with lock tiles");

  for (const id of lock.enemyIds) {
    const enemy = game.world.enemies.find((entry) => entry.id === id);
    enemy.hp = 0;
  }
  waitTurn(game);
  assert(lock.opened, "encounter lock should open after required enemies die");
  assert(game.world.map[27 * game.world.width + 20] === TILE.FLOOR, "nave entrance should reopen after encounter clear");
}

function testSaveLoad() {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key),
  };

  const game = createGame();
  game.player.souls = 77;
  game.player.embers = 2;
  game.stats.deaths = 3;
  game.progress.captainDefeated = true;
  game.world.items[0].taken = true;
  game.volume = .23;
  const lock = game.world.encounterLocks[0];
  lock.active = true;
  setTile(game.world, lock.gates[2].x, lock.gates[2].y, TILE.LOCK);

  assert(saveGame(game), "saveGame should write to localStorage");
  assert(hasSave(), "hasSave should detect a saved run");
  const loaded = loadGame();
  assert(loaded.player.souls === 77, "loadGame should restore player souls");
  assert(loaded.player.embers === 2, "loadGame should restore embers");
  assert(loaded.stats.deaths === 3, "loadGame should restore run stats");
  assert(loaded.progress.captainDefeated, "loadGame should restore progress flags");
  assert(loaded.world.items[0].taken, "loadGame should restore item state");
  assert(loaded.volume === .23, "loadGame should restore volume");
  assert(loaded.world.encounterLocks[0].active, "loadGame should restore active encounter locks");
  assert(loaded.world.map[27 * loaded.world.width + 20] === TILE.LOCK, "loadGame should restore lock tiles");
}

function setupDuel(game, enemyX, enemyY) {
  game.player.x = 10;
  game.player.y = 10;
  game.player.facing = "right";
  game.player.stamina = game.player.staminaMax;
  game.world.enemies = [enemy(enemyX, enemyY)];
}

function enemy(x, y, overrides = {}) {
  return {
    id: "test-enemy",
    x,
    y,
    spawnX: x,
    spawnY: y,
    type: ENEMY.HOLLOW,
    name: "Test Hollow",
    hp: 30,
    hpMax: 30,
    atk: 0,
    souls: 0,
    poise: 9,
    stagger: 0,
    cooldown: 99,
    intent: null,
    ...overrides,
  };
}

testBloodstainRecovery();
testWeaponReach();
testCriticalWindow();
testWardenPhase();
testKeyProgressionAndAnvil();
testDestructibles();
testEncounterLock();
testSaveLoad();

console.log("Game tests passed.");
