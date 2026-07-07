import { loadAssets } from "./game/assets.js";
import {
  CAMP_SHOP,
  WEAPONS,
  WEAPON_ORDER,
  actMove,
  buyCampUpgrade,
  campPrice,
  canUseCamp,
  createGame,
  cycleWeapon,
  dodge,
  equipWeapon,
  guard,
  heal,
  heavyAttack,
  pushLog,
  quickAttack,
  respawn,
  showVendorDialogue,
  shopItemAvailable,
  updateEffects,
  upgradeWeaponAtAnvil,
  waitTurn,
  weaponUpgradeLevel,
  weaponUpgradeEmberCost,
  weaponUpgradePrice,
  weaponUpgradeSummary,
} from "./game/state.js";
import { render, resizeCanvas } from "./game/render.js";
import { hasSave, loadGame, saveGame } from "./game/save.js";
import { setVolume, syncMusic, tone, toggleSound } from "./game/sound.js";
import { updateHud } from "./game/ui.js";

const canvas = document.getElementById("game");
const viewport = document.querySelector(".viewport");
const ctx = canvas.getContext("2d");
const campMenu = document.getElementById("campMenu");
const pauseMenu = document.getElementById("pauseMenu");
const campShop = document.getElementById("campShop");
const anvilShop = document.getElementById("anvilShop");
const volumeSlider = document.getElementById("volumeSlider");
const volumeText = document.getElementById("volumeText");

let assets;
let game;
let tileSize = 24;

async function boot() {
  assets = await loadAssets();
  buildCampShop();
  reset();
  window.addEventListener("resize", resizeAndRender);
  window.addEventListener("keydown", onKey);
  document.getElementById("resetButton").addEventListener("click", newRun);
  document.getElementById("saveButton").addEventListener("click", manualSave);
  document.getElementById("loadButton").addEventListener("click", manualLoad);
  document.getElementById("pauseButton").addEventListener("click", togglePause);
  document.getElementById("closePauseButton").addEventListener("click", closePauseMenu);
  document.getElementById("pauseSaveButton").addEventListener("click", manualSave);
  document.getElementById("pauseLoadButton").addEventListener("click", manualLoad);
  volumeSlider.addEventListener("input", () => {
    setVolume(game, Number(volumeSlider.value) / 100);
    syncVolumeControls();
    syncMusic(game);
    autoSave();
  });
  document.getElementById("closeCampButton").addEventListener("click", closeCampMenu);
  document.getElementById("muteButton").addEventListener("click", () => {
    toggleSound(game);
    updateHud(game);
    syncMusic(game);
  });
  requestAnimationFrame(loop);
}

function reset() {
  game = loadGame() || createGame();
  closeCampMenu();
  closePauseMenu();
  setVolume(game, game.volume);
  resizeAndRender();
  updateHud(game);
  syncCampShop();
  syncAnvilShop();
  syncSaveButtons();
  syncSoundButton();
  syncVolumeControls();
}

function newRun() {
  game = createGame();
  closeCampMenu();
  closePauseMenu();
  setVolume(game, game.volume);
  resizeAndRender();
  updateHud(game);
  syncCampShop();
  syncAnvilShop();
  syncSaveButtons();
  syncSoundButton();
  syncVolumeControls();
}

function resizeAndRender() {
  tileSize = resizeCanvas(canvas, viewport);
  render(ctx, assets, game, tileSize);
}

function onKey(event) {
  const key = event.key.toLowerCase();
  if (!campMenu.hidden && (key === "escape" || key === "l" || key === "enter")) {
    event.preventDefault();
    closeCampMenu();
    return;
  }
  if (!pauseMenu.hidden && (key === "escape" || key === "p")) {
    event.preventDefault();
    closePauseMenu();
    return;
  }
  if (!campMenu.hidden) return;
  if (key === "escape" || key === "p") {
    event.preventDefault();
    togglePause();
    return;
  }
  if (!pauseMenu.hidden || game.paused) return;

  const commands = {
    arrowup: "up",
    w: "up",
    arrowright: "right",
    d: "right",
    arrowdown: "down",
    s: "down",
    arrowleft: "left",
    a: "left",
  };
  if (commands[key]) {
    event.preventDefault();
    const dirName = commands[key];
    const acted = event.shiftKey ? dodge(game, dirName) : actMove(game, dirName);
    if (acted) actionSound(event.shiftKey ? [260, 390] : [164, 196]);
  } else if (key === " ") {
    event.preventDefault();
    if (quickAttack(game)) actionSound([330, 220]);
  } else if (key === "f") {
    event.preventDefault();
    if (heavyAttack(game)) actionSound([196, 146]);
  } else if (key === "q") {
    event.preventDefault();
    if (dodge(game)) actionSound([260, 390]);
  } else if (key === "e") {
    event.preventDefault();
    if (guard(game)) actionSound([180, 240, 360]);
  } else if (key === "h") {
    event.preventDefault();
    if (heal(game)) actionSound([392, 523]);
  } else if (key === "tab") {
    event.preventDefault();
    if (cycleWeapon(game, event.shiftKey ? -1 : 1)) actionSound([220, 330]);
  } else if (/^[1-5]$/.test(key)) {
    event.preventDefault();
    const id = WEAPON_ORDER[Number(key) - 1];
    if (id && equipWeapon(game, id)) actionSound([220, 330]);
  } else if (key === ".") {
    event.preventDefault();
    waitTurn(game);
  } else if (key === "r") {
    event.preventDefault();
    if (game.dead) {
      if (respawn(game)) actionSound([146, 196, 293]);
      updateHud(game);
      syncCampShop();
      syncAnvilShop();
      syncMusic(game);
      render(ctx, assets, game, tileSize);
    } else {
      newRun();
    }
    return;
  } else if (key === "l" || key === "enter") {
    event.preventDefault();
    if (canUseCamp(game)) openCampMenu();
    else pushLog(game, "Find a campfire to trade souls.");
  } else if (key === "m") {
    event.preventDefault();
    toggleSound(game);
    syncSoundButton();
  } else if (key === "`" || key === "~") {
    event.preventDefault();
    game.debug = !game.debug;
    pushLog(game, game.debug ? "Debug overlay on." : "Debug overlay off.");
  } else {
    return;
  }
  updateHud(game);
  syncCampShop();
  syncAnvilShop();
  syncMusic(game);
  autoSave();
  render(ctx, assets, game, tileSize);
}

function manualSave() {
  if (saveGame(game)) pushLog(game, "Saved at the campfire memory.");
  updateHud(game);
  syncSaveButtons();
}

function manualLoad() {
  const loaded = loadGame();
  if (!loaded) {
    pushLog(game, "No saved memory found.");
  } else {
    game = loaded;
    closeCampMenu();
    closePauseMenu();
    setVolume(game, game.volume);
    resizeAndRender();
  }
  updateHud(game);
  syncCampShop();
  syncAnvilShop();
  syncSaveButtons();
  syncSoundButton();
  syncVolumeControls();
  render(ctx, assets, game, tileSize);
}

function autoSave() {
  saveGame(game);
  syncSaveButtons();
}

function syncSaveButtons() {
  const loadButton = document.getElementById("loadButton");
  if (loadButton) loadButton.disabled = !hasSave();
}

function syncSoundButton() {
  const muteButton = document.getElementById("muteButton");
  if (muteButton) muteButton.textContent = game.muted ? "Sound Off" : "Sound On";
}

function togglePause() {
  if (game.dead || game.won) return;
  game.paused = !game.paused;
  pauseMenu.hidden = !game.paused;
  if (game.paused) {
    closeCampMenu();
    pushLog(game, "Paused at the edge of the firelight.");
  } else {
    pushLog(game, "The chapel moves again.");
  }
  updateHud(game);
  syncVolumeControls();
  render(ctx, assets, game, tileSize);
}

function closePauseMenu() {
  if (pauseMenu) pauseMenu.hidden = true;
  if (game) game.paused = false;
}

function syncVolumeControls() {
  const pct = Math.round((game.volume ?? .65) * 100);
  if (volumeSlider) volumeSlider.value = String(pct);
  if (volumeText) volumeText.textContent = `${pct}%`;
}

function buildCampShop() {
  campShop.replaceChildren(...CAMP_SHOP.map((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.buy = item.id;
    button.innerHTML = `<span>${item.label}</span><b></b><small>${item.detail}</small>`;
    button.addEventListener("click", () => {
      if (buyCampUpgrade(game, item.id)) actionSound([330, 415, 523]);
      updateHud(game);
      syncCampShop();
      syncAnvilShop();
      autoSave();
      render(ctx, assets, game, tileSize);
    });
    return button;
  }));
}

function openCampMenu() {
  campMenu.hidden = false;
  showVendorDialogue(game, game.player.souls > 0 ? "shop" : "poor");
  updateHud(game);
  syncCampShop();
  syncAnvilShop();
}

function closeCampMenu() {
  if (campMenu) campMenu.hidden = true;
}

function syncCampShop() {
  if (!game || !campShop) return;
  campShop.querySelectorAll("button[data-buy]").forEach((button) => {
    const id = button.dataset.buy;
    button.hidden = !shopItemAvailable(game, id);
    if (button.hidden) return;
    const price = campPrice(game, id);
    const priceNode = button.querySelector("b");
    if (priceNode) priceNode.textContent = `${price} souls`;
    const alreadyOwned = WEAPONS[id] && game.player.weapons.includes(id);
    button.disabled = !canUseCamp(game) || alreadyOwned || game.player.souls < price;
  });
}

function syncAnvilShop() {
  if (!game || !anvilShop) return;
  const buttons = game.player.weapons.map((id) => {
    const weapon = WEAPONS[id];
    const level = weaponUpgradeLevel(game, id);
    const price = weaponUpgradePrice(game, id);
    const embers = weaponUpgradeEmberCost(game, id);
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.upgrade = id;
    const next = Math.min(2, level + 1);
    button.innerHTML = `<span>${weapon.label}+${next}</span><b>${level >= 2 ? "done" : `${price} souls / ${embers} ember${embers === 1 ? "" : "s"}`}</b><small>${weaponUpgradeSummary(game, id)}</small>`;
    button.disabled = !canUseCamp(game) || level >= 2 || game.player.souls < price || game.player.embers < embers;
    button.addEventListener("click", () => {
      if (upgradeWeaponAtAnvil(game, id)) actionSound([220, 330, 440]);
      updateHud(game);
      syncCampShop();
      syncAnvilShop();
      autoSave();
      render(ctx, assets, game, tileSize);
    });
    return button;
  });
  anvilShop.replaceChildren(...buttons);
}

function actionSound(notes) {
  if (!game.muted) tone(notes);
}

function loop() {
  const dialogueWasVisible = game.dialogue?.t > 0;
  if (!game.paused) updateEffects(game);
  if (dialogueWasVisible) updateHud(game);
  render(ctx, assets, game, tileSize);
  requestAnimationFrame(loop);
}

boot().catch((error) => {
  console.error(error);
  pushLog(game, "The chapel failed to load.");
  updateHud(game);
});
