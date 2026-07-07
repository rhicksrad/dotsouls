const SHEET = {
  tile: 16,
  gap: 1,
  cols: 12,
};

const WEAPON_SHEET = {
  tile: 16,
  cols: 24,
};

export const ART = {
  floor: [48, 49],
  wall: [14, 28, 40, 57, 58, 59],
  stairs: 36,
  camp: 120,
  gate: 21,
  chest: 89,
  chestOpen: 91,
  key: 102,
  flask: 114,
  souls: 101,
  relic: 129,
  player: 97,
  hollow: 96,
  slime: 108,
  warden: 110,
  altar: 82,
  pew: 79,
  banner: 82,
  grave: 109,
  glass: 50,
  rubble: 24,
};

export function loadAssets() {
  const sheet = new Image();
  sheet.src = "./assets/kenney_tiny-dungeon/Tilemap/tilemap_packed.png";
  const weapons = new Image();
  weapons.src = "./assets/weapon-rpg-icons/source/16x16 Weapons RPG Icons/steel-weapons.png";
  const sheetLoad = new Promise((resolve, reject) => {
    sheet.onload = resolve;
    sheet.onerror = () => reject(new Error("Could not load Kenney Tiny Dungeon tilesheet."));
  });
  const weaponLoad = new Promise((resolve, reject) => {
    weapons.onload = resolve;
    weapons.onerror = () => reject(new Error("Could not load steel weapon icons."));
  });
  const tileLoads = Array.from({ length: 132 }, (_, index) => loadLooseTile(index));
  return Promise.all([sheetLoad, weaponLoad, ...tileLoads]).then(([, , ...tiles]) => ({
    sheet,
    tiles,
    weapons,
    weaponTile: WEAPON_SHEET.tile,
    weaponCols: WEAPON_SHEET.cols,
    ...SHEET,
  }));
}

function loadLooseTile(index) {
  const img = new Image();
  img.src = `./assets/kenney_tiny-dungeon/Tiles/tile_${String(index).padStart(4, "0")}.png`;
  return new Promise((resolve, reject) => {
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load tile_${String(index).padStart(4, "0")}.png`));
  });
}

export function drawTile(ctx, assets, index, x, y, size, alpha = 1, scale = 1) {
  const w = size * scale;
  const h = size * scale;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = false;
  const img = assets.tiles[index];
  if (img) {
    ctx.drawImage(img, x - (w - size) / 2, y - (h - size), w, h);
  } else {
    const sx = (index % assets.cols) * (assets.tile + assets.gap);
    const sy = Math.floor(index / assets.cols) * (assets.tile + assets.gap);
    ctx.drawImage(assets.sheet, sx, sy, assets.tile, assets.tile, x - (w - size) / 2, y - (h - size), w, h);
  }
  ctx.restore();
}

export function drawWeaponTile(ctx, assets, index, x, y, size, angle, alpha = 1, scale = 1) {
  if (!assets.weapons) return;
  const sourceSize = assets.weaponTile;
  const sx = (index % assets.weaponCols) * sourceSize;
  const sy = Math.floor(index / assets.weaponCols) * sourceSize;
  const drawSize = size * scale;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = false;
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.drawImage(assets.weapons, sx, sy, sourceSize, sourceSize, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
  ctx.restore();
}

export function pickTile(list, x, y, salt = 0) {
  return list[Math.abs((x * 17 + y * 31 + salt) % list.length)];
}
