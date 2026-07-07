import { ART, drawTile, drawWeaponTile, pickTile } from "./assets.js";
import { COLORS, DECOR, ENEMY, ITEM, TILE, VIEW } from "./constants.js";
import { tileAt } from "./map.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function visible(game, x, y) {
  const dx = x - game.player.x;
  const dy = y - game.player.y;
  return dx * dx + dy * dy <= 12 * 12;
}

function camera(game, canvas, tile) {
  const cols = Math.floor(canvas.width / tile);
  const rows = Math.floor(canvas.height / tile);
  return {
    x: clamp(game.player.x - Math.floor(cols / 2), 0, Math.max(0, game.world.width - cols)),
    y: clamp(game.player.y - Math.floor(rows / 2), 0, Math.max(0, game.world.height - rows)),
    cols,
    rows,
  };
}

function drawRect(ctx, x, y, w, h, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

function glow(ctx, cx, cy, tile, color, alpha, radius = 2) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  for (let y = -radius; y <= radius; y += 1) {
    for (let x = -radius; x <= radius; x += 1) {
      if (Math.abs(x) + Math.abs(y) <= radius) ctx.fillRect(cx + x * tile, cy + y * tile, tile, tile);
    }
  }
  ctx.restore();
}

function drawMapTile(ctx, assets, game, tile, sx, sy, worldX, worldY) {
  const tileKind = tileAt(game.world, worldX, worldY);
  const seen = visible(game, worldX, worldY);
  const alpha = seen ? 1 : 0.24;
  if (tileKind === TILE.VOID) {
    drawRect(ctx, sx, sy, tile, tile, "#050405", 1);
    if (!seen) drawRect(ctx, sx, sy, tile, tile, "rgba(0,0,0,.72)");
    return;
  }
  if (tileKind === TILE.WALL) {
    drawRect(ctx, sx, sy, tile, tile, "#101015", alpha);
    drawTile(ctx, assets, pickTile(ART.wall, worldX, worldY, 7), sx, sy, tile, alpha);
    drawRect(ctx, sx, sy, tile, tile, "rgba(5,7,14,.22)", alpha);
    return;
  }
  drawRect(ctx, sx, sy, tile, tile, "#171016", alpha);
  drawTile(ctx, assets, pickTile(ART.floor, worldX, worldY, 2), sx, sy, tile, alpha);
  drawRect(ctx, sx, sy, tile, tile, "rgba(28,12,18,.4)", alpha);

  if (tileKind === TILE.CAMP) {
    drawCampfire(ctx, game, sx, sy, tile, alpha, seen);
  } else if (tileKind === TILE.STAIRS) {
    drawTile(ctx, assets, ART.stairs, sx, sy, tile, alpha);
  } else if (tileKind === TILE.GATE) {
    drawTile(ctx, assets, ART.gate, sx, sy, tile, alpha);
    drawRect(ctx, sx + tile * .42, sy + tile * .14, tile * .18, tile * .72, "rgba(108,180,255,.55)", alpha);
  } else if (tileKind === TILE.LOCK) {
    drawTile(ctx, assets, ART.gate, sx, sy, tile, alpha);
    drawRect(ctx, sx + tile * .15, sy + tile * .18, tile * .7, tile * .16, "rgba(226,75,75,.7)", alpha);
    drawRect(ctx, sx + tile * .15, sy + tile * .66, tile * .7, tile * .16, "rgba(226,75,75,.7)", alpha);
    drawRect(ctx, sx + tile * .24, sy + tile * .08, tile * .12, tile * .84, "rgba(255,209,102,.55)", alpha);
    drawRect(ctx, sx + tile * .64, sy + tile * .08, tile * .12, tile * .84, "rgba(255,209,102,.55)", alpha);
  }

  const decor = game.world.decor.get(`${worldX},${worldY}`);
  if (decor && alpha > .3) {
    const decorTile = {
      [DECOR.ALTAR]: ART.altar,
      [DECOR.PEW]: ART.pew,
      [DECOR.BANNER]: ART.banner,
      [DECOR.GRAVE]: ART.grave,
      [DECOR.GLASS]: ART.glass,
      [DECOR.RUBBLE]: ART.rubble,
    }[decor];
    if (decor === "glass") glow(ctx, sx, sy, tile, "rgba(80,170,255,1)", .08, 3);
    if (decorTile != null) drawTile(ctx, assets, decorTile, sx, sy, tile, alpha);
  }
}

function drawCampfire(ctx, game, sx, sy, tile, alpha, seen) {
  const flicker = ((game.turn + sx + sy) % 4) / 4;
  glow(ctx, sx, sy, tile, "rgba(255,128,42,1)", seen ? .22 + flicker * .04 : .05, 3);
  glow(ctx, sx, sy, tile, "rgba(255,210,90,1)", seen ? .08 : .02, 1);

  const px = tile / 16;
  const x = (n) => sx + Math.floor(n * px);
  const y = (n) => sy + Math.floor(n * px);
  const w = (n) => Math.max(1, Math.ceil(n * px));

  drawRect(ctx, x(3), y(11), w(10), w(2), "#3d2720", alpha);
  drawRect(ctx, x(4), y(12), w(8), w(2), "#7a4425", alpha);
  drawRect(ctx, x(3), y(13), w(3), w(1), "#b66a30", alpha);
  drawRect(ctx, x(10), y(13), w(3), w(1), "#b66a30", alpha);

  drawRect(ctx, x(2), y(11), w(2), w(2), "#6b6f7a", alpha);
  drawRect(ctx, x(12), y(11), w(2), w(2), "#8a8d93", alpha);
  drawRect(ctx, x(6), y(13), w(4), w(1), "#1d1210", alpha);

  const lift = flicker > .5 ? 1 : 0;
  drawRect(ctx, x(6), y(5 + lift), w(4), w(7 - lift), "#d84626", alpha);
  drawRect(ctx, x(5), y(7), w(2), w(4), "#f06a2f", alpha);
  drawRect(ctx, x(9), y(7 + lift), w(2), w(4 - lift), "#f06a2f", alpha);
  drawRect(ctx, x(7), y(4), w(2), w(6), "#ffd166", alpha);
  drawRect(ctx, x(7), y(7), w(3), w(4), "#fff0a8", alpha);
  drawRect(ctx, x(8), y(3 + lift), w(1), w(2), "#ff8a2a", alpha);

  drawRect(ctx, x(6), y(14), w(1), w(1), "#ffdb6e", alpha);
  drawRect(ctx, x(9), y(14), w(1), w(1), "#e24b4b", alpha);
}

function drawItems(ctx, assets, game, tile, cam) {
  for (const item of game.world.items) {
    if (item.taken && item.type !== ITEM.CHEST) continue;
    if (!visible(game, item.x, item.y)) continue;
    const sx = (item.x - cam.x) * tile;
    const sy = (item.y - cam.y) * tile;
    if (sx < -tile || sy < -tile || sx > cam.cols * tile || sy > cam.rows * tile) continue;
    if (item.type === ITEM.CHEST) drawTile(ctx, assets, item.opened ? ART.chestOpen : ART.chest, sx, sy, tile);
    if (item.type === ITEM.SOULS) {
      glow(ctx, sx, sy, tile, "rgba(255,220,64,1)", .1, 1);
      drawTile(ctx, assets, ART.souls, sx, sy, tile);
    }
    if (item.type === ITEM.FLASK) drawTile(ctx, assets, ART.flask, sx, sy, tile);
    if (item.type === ITEM.KEY) drawTile(ctx, assets, ART.key, sx, sy, tile);
    if (item.type === ITEM.RELIC) {
      glow(ctx, sx, sy, tile, "rgba(188,90,255,1)", .12, 2);
      drawTile(ctx, assets, ART.relic, sx, sy, tile);
    }
  }
}

function drawBloodstain(ctx, game, tile, cam) {
  const stain = game.bloodstain;
  if (!stain || !visible(game, stain.x, stain.y)) return;
  const sx = (stain.x - cam.x) * tile;
  const sy = (stain.y - cam.y) * tile;
  if (sx < -tile || sy < -tile || sx > cam.cols * tile || sy > cam.rows * tile) return;

  glow(ctx, sx, sy, tile, "rgba(226,75,75,1)", .16, 2);
  drawRect(ctx, sx + tile * .22, sy + tile * .38, tile * .56, tile * .26, "#6f151f", .9);
  drawRect(ctx, sx + tile * .34, sy + tile * .22, tile * .18, tile * .22, "#b4212d", .85);
  drawRect(ctx, sx + tile * .58, sy + tile * .54, tile * .16, tile * .16, "#d84949", .8);
  drawRect(ctx, sx + tile * .16, sy + tile * .58, tile * .12, tile * .12, "#8e1a24", .85);
  ctx.save();
  ctx.fillStyle = "#ffd166";
  ctx.font = `${Math.max(10, Math.floor(tile * .42))}px "Courier New", monospace`;
  ctx.textAlign = "center";
  ctx.fillText(String(stain.souls), sx + tile / 2, sy - 2);
  ctx.restore();
}

function drawCampVendors(ctx, game, tile, cam) {
  for (let y = cam.y; y < cam.y + cam.rows; y += 1) {
    for (let x = cam.x; x < cam.x + cam.cols; x += 1) {
      if (tileAt(game.world, x, y) !== TILE.CAMP || !visible(game, x, y)) continue;
      const sx = (x - cam.x) * tile;
      const sy = (y - cam.y) * tile;
      const active = game.player.x === x && game.player.y === y;
      if (active) drawCampfireForeground(ctx, game, sx, sy, tile);
      drawVendor(ctx, sx + tile * .68, sy + tile * .3, tile, active ? 1 : .78, active);
    }
  }
}

function drawCampfireForeground(ctx, game, sx, sy, tile) {
  const flicker = game.turn % 2;
  const px = tile / 16;
  const r = (x, y, w, h, color, alpha = 1) => drawRect(ctx, sx + x * px, sy + y * px, Math.max(1, w * px), Math.max(1, h * px), color, alpha);
  r(2, 8, 2, 5, "#d84626", .9);
  r(3, 6 + flicker, 1, 4, "#ffd166", .95);
  r(12, 9, 2, 4, "#f06a2f", .85);
  r(12, 7 + flicker, 1, 3, "#fff0a8", .9);
  r(4, 14, 8, 1, "#ff8a2a", .8);
}

function drawVendor(ctx, x, y, tile, alpha, active) {
  const px = tile / 16;
  const r = (ox, oy, ow, oh, color) => drawRect(ctx, x + ox * px, y + oy * px, Math.max(1, ow * px), Math.max(1, oh * px), color, alpha);
  glow(ctx, x - tile * .18, y + tile * .24, tile, "rgba(120,184,255,1)", .05 * alpha, 1);
  r(4, 2, 5, 3, "#243a55");
  r(3, 5, 7, 7, "#1f5b79");
  r(5, 4, 3, 3, "#caa878");
  r(5, 6, 1, 1, "#0b0d12");
  r(7, 6, 1, 1, "#0b0d12");
  r(2, 7, 2, 4, "#143549");
  r(9, 7, 2, 4, "#143549");
  r(4, 12, 2, 2, "#0d1d2a");
  r(8, 12, 2, 2, "#0d1d2a");
  r(5, 1, 3, 1, "#8cdcff");
  drawShopSign(ctx, x - tile * .84, y - tile * 1.08, tile, alpha, active);
}

function drawShopSign(ctx, x, y, tile, alpha, active) {
  const width = tile * 1.75;
  const height = tile * .56;
  drawRect(ctx, x, y, width, height, "#21141a", alpha);
  drawRect(ctx, x, y, width, Math.max(2, tile * .08), "#825858", alpha);
  drawRect(ctx, x, y + height - Math.max(2, tile * .08), width, Math.max(2, tile * .08), "#825858", alpha);
  drawRect(ctx, x + width * .43, y + height, width * .14, tile * .18, "#825858", alpha);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#ffd166";
  ctx.font = `${Math.max(10, Math.floor(tile * .38))}px "Courier New", monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(active ? "PRESS L" : "SHOP", x + width / 2, y + height / 2 + 1);
  ctx.restore();
}

function drawActors(ctx, assets, game, tile, cam) {
  for (const enemy of game.world.enemies) {
    if (enemy.hp <= 0 || !visible(game, enemy.x, enemy.y)) continue;
    const sx = (enemy.x - cam.x) * tile;
    const sy = (enemy.y - cam.y) * tile;
    if (enemy.type === ENEMY.WARDEN) {
      glow(ctx, sx, sy, tile, enemy.phase === 2 ? "rgba(255,138,42,1)" : "rgba(220,48,48,1)", enemy.phase === 2 ? .18 : .11, enemy.phase === 2 ? 4 : 3);
      drawTile(ctx, assets, ART.warden, sx, sy + tile * .2, tile, 1, 2.25);
      if (enemy.phase === 2) {
        drawRect(ctx, sx + tile * .18, sy - tile * .4, tile * .64, tile * .22, "#ff8a2a", .8);
        drawRect(ctx, sx + tile * .34, sy - tile * .62, tile * .32, tile * .24, "#ffd166", .9);
      }
      drawHealth(ctx, sx - tile * .35, sy - tile * 1.7, tile * 1.7, enemy.hp / enemy.hpMax, COLORS.red);
    } else {
      drawTile(ctx, assets, enemy.type === ENEMY.SLIME ? ART.slime : ART.hollow, sx, sy + tile * .1, tile, 1, 1.18);
      drawHealth(ctx, sx + 2, sy - 3, tile - 4, enemy.hp / enemy.hpMax, COLORS.red);
    }
  }

  const px = (game.player.x - cam.x) * tile;
  const py = (game.player.y - cam.y) * tile;
  glow(ctx, px, py, tile, "rgba(255,180,70,1)", .1, 2);
  drawTile(ctx, assets, ART.player, px, py + tile * .2, tile, 1, 1.45);
  drawPlayerWeapon(ctx, assets, game, px, py, tile);
}

function drawPlayerWeapon(ctx, assets, game, px, py, tile) {
  const dirs = {
    up: { x: 0, y: -1 },
    right: { x: 1, y: 0 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
  };
  const dir = dirs[game.player.facing];
  const cx = px + tile / 2;
  const cy = py + tile / 2;
  const icon = weaponIcon(game.player.weaponId);
  const angle = weaponAngle(game.player.facing);
  if (icon != null) {
    drawWeaponTile(ctx, assets, icon, cx + dir.x * tile * .44, cy + dir.y * tile * .44, tile, angle, 1, weaponScale(game.player.weaponId));
    return;
  }
  ctx.save();
  ctx.strokeStyle = "#f5e6c8";
  ctx.lineWidth = Math.max(2, Math.floor(tile * .13));
  ctx.shadowColor = "#ffd166";
  ctx.shadowBlur = tile * .2;
  ctx.beginPath();
  ctx.moveTo(cx + dir.x * tile * .08, cy + dir.y * tile * .08);
  ctx.lineTo(cx + dir.x * tile * .68, cy + dir.y * tile * .68);
  ctx.stroke();
  ctx.restore();
}

function weaponIcon(name) {
  if (name === "dagger") return 96;
  if (name === "spear") return 19;
  if (name === "axe") return 169;
  if (name === "greatsword") return 29;
  return 7;
}

function weaponScale(name) {
  if (name === "dagger") return .95;
  if (name === "axe") return 1.25;
  if (name === "greatsword") return 1.35;
  return 1.16;
}

function weaponAngle(facing) {
  return {
    up: -Math.PI * .75,
    right: -Math.PI * .25,
    down: Math.PI * .25,
    left: Math.PI * .75,
  }[facing] || 0;
}

function drawHealth(ctx, x, y, w, pct, color) {
  drawRect(ctx, x, y, w, 4, "rgba(0,0,0,.72)");
  drawRect(ctx, x, y, w * clamp(pct, 0, 1), 4, color);
}

function drawAtmosphere(ctx, canvas, tile, cam, game) {
  const gradient = ctx.createRadialGradient(
    canvas.width * .5,
    canvas.height * .45,
    Math.min(canvas.width, canvas.height) * .2,
    canvas.width * .5,
    canvas.height * .5,
    Math.max(canvas.width, canvas.height) * .66,
  );
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(.72, "rgba(0,0,0,.18)");
  gradient.addColorStop(1, "rgba(0,0,0,.66)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < cam.rows; y += 1) {
    for (let x = 0; x < cam.cols; x += 1) {
      if (!visible(game, cam.x + x, cam.y + y)) drawRect(ctx, x * tile, y * tile, tile, tile, "rgba(0,0,0,.54)");
    }
  }

  ctx.save();
  ctx.globalAlpha = .06;
  ctx.fillStyle = "#ffd28a";
  for (let y = 0; y < canvas.height; y += tile * 2) ctx.fillRect(0, y, canvas.width, Math.max(1, Math.floor(tile * .08)));
  ctx.restore();
}

export function resizeCanvas(canvas, container) {
  const rect = container.getBoundingClientRect();
  const tile = clamp(Math.floor(Math.min(rect.width / VIEW.cols, rect.height / VIEW.rows)), 18, 34);
  const cols = Math.max(24, Math.floor(rect.width / tile));
  const rows = Math.max(16, Math.floor(rect.height / tile));
  canvas.width = cols * tile;
  canvas.height = rows * tile;
  return tile;
}

export function render(ctx, assets, game, tile) {
  const { canvas } = ctx;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const cam = camera(game, canvas, tile);

  for (let y = 0; y < cam.rows; y += 1) {
    for (let x = 0; x < cam.cols; x += 1) {
      drawMapTile(ctx, assets, game, tile, x * tile, y * tile, cam.x + x, cam.y + y);
    }
  }
  drawTelegraphs(ctx, game, tile, cam);
  drawItems(ctx, assets, game, tile, cam);
  drawBloodstain(ctx, game, tile, cam);
  drawCampVendors(ctx, game, tile, cam);
  drawActors(ctx, assets, game, tile, cam);
  drawEffects(ctx, game, tile, cam);
  drawAtmosphere(ctx, canvas, tile, cam, game);
  if (game.debug) drawDebug(ctx, game, tile, cam);
}

function drawDebug(ctx, game, tile, cam) {
  ctx.save();
  ctx.font = `${Math.max(10, Math.floor(tile * .38))}px "Courier New", monospace`;
  ctx.textBaseline = "top";
  for (let y = 0; y < cam.rows; y += 1) {
    for (let x = 0; x < cam.cols; x += 1) {
      const wx = cam.x + x;
      const wy = cam.y + y;
      const sx = x * tile;
      const sy = y * tile;
      const passable = tileAt(game.world, wx, wy) !== TILE.WALL && tileAt(game.world, wx, wy) !== TILE.VOID;
      drawRect(ctx, sx, sy, tile, tile, passable ? "rgba(85,199,109,.08)" : "rgba(226,75,75,.16)");
      if ((wx + wy) % 4 === 0) {
        ctx.fillStyle = "rgba(245,230,200,.42)";
        ctx.fillText(`${wx},${wy}`, sx + 2, sy + 2);
      }
    }
  }

  for (const enemy of game.world.enemies) {
    if (enemy.hp <= 0 || !enemy.intent) continue;
    for (const cell of enemy.intent.cells) {
      const sx = (cell.x - cam.x) * tile;
      const sy = (cell.y - cam.y) * tile;
      drawRect(ctx, sx + 1, sy + 1, tile - 2, tile - 2, "rgba(255,0,255,.28)");
    }
  }

  const lines = [
    `pos ${game.player.x},${game.player.y} face ${game.player.facing}`,
    `turn ${game.turn} enemies ${game.world.enemies.filter((enemy) => enemy.hp > 0).length}`,
    `souls ${game.player.souls} embers ${game.player.embers}`,
  ];
  const width = tile * 12;
  drawRect(ctx, 8, 8, width, tile * 2.4, "rgba(0,0,0,.72)");
  ctx.fillStyle = "#c7e6ff";
  lines.forEach((line, index) => ctx.fillText(line, 14, 14 + index * Math.max(12, tile * .46)));
  ctx.restore();
}

function drawTelegraphs(ctx, game, tile, cam) {
  const pulse = .45 + Math.sin(game.turn * 1.7) * .12;
  for (const enemy of game.world.enemies) {
    if (enemy.hp <= 0 || !enemy.intent) continue;
    const style = telegraphStyle(enemy.intent.type);
    for (const cell of enemy.intent.cells) {
      const sx = (cell.x - cam.x) * tile;
      const sy = (cell.y - cam.y) * tile;
      if (sx < -tile || sy < -tile || sx > cam.cols * tile || sy > cam.rows * tile) continue;
      drawRect(ctx, sx + 2, sy + 2, tile - 4, tile - 4, style.fill, pulse);
      ctx.save();
      ctx.strokeStyle = style.stroke;
      ctx.lineWidth = style.width;
      ctx.strokeRect(sx + 4, sy + 4, tile - 8, tile - 8);
      if (style.cross) {
        ctx.beginPath();
        ctx.moveTo(sx + 6, sy + 6);
        ctx.lineTo(sx + tile - 6, sy + tile - 6);
        ctx.moveTo(sx + tile - 6, sy + 6);
        ctx.lineTo(sx + 6, sy + tile - 6);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}

function telegraphStyle(type) {
  return {
    bolt: { fill: "rgba(86,174,255,.36)", stroke: "rgba(179,225,255,.86)", width: 2, cross: false },
    leap: { fill: "rgba(123,226,127,.32)", stroke: "rgba(207,255,178,.82)", width: 2, cross: true },
    sweep: { fill: "rgba(255,138,42,.4)", stroke: "rgba(255,222,138,.88)", width: 3, cross: false },
    lunge: { fill: "rgba(255,209,102,.35)", stroke: "rgba(255,245,190,.9)", width: 2, cross: false },
    warden: { fill: "rgba(226,75,75,.46)", stroke: "rgba(255,210,120,.85)", width: 3, cross: false },
    wardenPhase: { fill: "rgba(255,138,42,.52)", stroke: "rgba(255,240,168,.9)", width: 3, cross: true },
    slash: { fill: "rgba(226,75,75,.38)", stroke: "rgba(255,210,120,.78)", width: 2, cross: false },
  }[type] || { fill: "rgba(226,75,75,.42)", stroke: "rgba(255,210,120,.75)", width: 2, cross: false };
}

function drawEffects(ctx, game, tile, cam) {
  for (const effect of game.effects) {
    const age = 1 - effect.t / effect.max;
    if (effect.cells) {
      for (const cell of effect.cells) {
        const sx = (cell.x - cam.x) * tile;
        const sy = (cell.y - cam.y) * tile;
        if (effect.kind === "slash") {
          drawRect(ctx, sx + 1, sy + 1, tile - 2, tile - 2, effect.hit ? "rgba(255,230,160,.78)" : "rgba(160,200,255,.46)", 1 - age);
          drawBladeStroke(ctx, sx, sy, tile, effect.facing, 1 - age, effect.weapon);
        } else if (effect.kind === "thrust") {
          drawRect(ctx, sx + 2, sy + 2, tile - 4, tile - 4, "rgba(140,210,255,.34)", 1 - age);
          drawThrustStroke(ctx, sx, sy, tile, effect.facing, 1 - age, effect.weapon);
        } else if (effect.kind === "enemyStrike") {
          drawRect(ctx, sx + 2, sy + 2, tile - 4, tile - 4, "rgba(255,60,50,.5)", 1 - age);
        } else if (effect.kind === "tell") {
          drawRect(ctx, sx + 5, sy + 5, tile - 10, tile - 10, "rgba(255,180,80,.18)", 1 - age);
        }
      }
    }
    if (effect.x != null && effect.y != null) {
      const sx = (effect.x - cam.x) * tile;
      const sy = (effect.y - cam.y) * tile;
      if (effect.kind === "hit" || effect.kind === "crit") {
        drawRect(ctx, sx + 3, sy + 3, tile - 6, tile - 6, effect.kind === "crit" ? "rgba(255,209,102,.82)" : "rgba(255,255,255,.55)", 1 - age);
        ctx.save();
        ctx.globalAlpha = 1 - age;
        ctx.fillStyle = effect.kind === "crit" ? "#fff0a8" : "#ffd166";
        ctx.font = `${Math.max(11, Math.floor(tile * (effect.kind === "crit" ? .78 : .62)))}px "Courier New", monospace`;
        ctx.textAlign = "center";
        ctx.fillText(effect.kind === "crit" ? `!${effect.damage}` : String(effect.damage), sx + tile / 2, sy - tile * age);
        ctx.restore();
      } else if (effect.kind === "afterimage") {
        drawRect(ctx, sx + 4, sy + 4, tile - 8, tile - 8, "rgba(120,180,255,.45)", 1 - age);
      } else if (effect.kind === "guard") {
        ctx.save();
        ctx.globalAlpha = 1 - age;
        ctx.strokeStyle = "#78b8ff";
        ctx.lineWidth = 3;
        ctx.strokeRect(sx + 3, sy + 3, tile - 6, tile - 6);
        ctx.restore();
      } else if (effect.kind === "parry") {
        glow(ctx, sx, sy, tile, "rgba(120,210,255,1)", .28 * (1 - age), 2);
      } else if (effect.kind === "heal" || effect.kind === "burst") {
        glow(ctx, sx, sy, tile, effect.color || "rgba(120,255,150,1)", .28 * (1 - age), 3);
      }
    }
  }
}

function drawBladeStroke(ctx, sx, sy, tile, facing, alpha, weapon = "ashblade") {
  const heavy = weapon === "axe" || weapon === "greatsword";
  const quick = weapon === "dagger";
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = heavy ? "#ffb86b" : quick ? "#d7f4ff" : "#ffe6a5";
  ctx.lineWidth = Math.max(2, Math.floor(tile * (heavy ? .22 : quick ? .09 : .14)));
  ctx.lineCap = "square";
  ctx.beginPath();
  if (facing === "left" || facing === "right") {
    ctx.moveTo(sx + tile * (heavy ? .1 : .18), sy + tile * .24);
    ctx.lineTo(sx + tile * (heavy ? .9 : .82), sy + tile * .76);
  } else {
    ctx.moveTo(sx + tile * .24, sy + tile * (heavy ? .9 : .82));
    ctx.lineTo(sx + tile * .76, sy + tile * (heavy ? .1 : .18));
  }
  ctx.stroke();
  if (heavy) {
    ctx.globalAlpha = alpha * .55;
    ctx.lineWidth = Math.max(2, Math.floor(tile * .11));
    ctx.strokeStyle = "#fff0b8";
    ctx.stroke();
  }
  ctx.restore();
}

function drawThrustStroke(ctx, sx, sy, tile, facing, alpha, weapon = "ashblade") {
  const dirs = {
    up: [0, -1],
    right: [1, 0],
    down: [0, 1],
    left: [-1, 0],
  };
  const [dx, dy] = dirs[facing] || dirs.right;
  const cx = sx + tile / 2;
  const cy = sy + tile / 2;
  const long = weapon === "spear";
  const short = weapon === "dagger";
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = long ? "#ffd166" : short ? "#d7f4ff" : "#9ee7ff";
  ctx.lineWidth = Math.max(2, Math.floor(tile * (long ? .12 : short ? .08 : .18)));
  ctx.shadowColor = "#78b8ff";
  ctx.shadowBlur = tile * .35;
  ctx.beginPath();
  ctx.moveTo(cx - dx * tile * (long ? .46 : .35), cy - dy * tile * (long ? .46 : .35));
  ctx.lineTo(cx + dx * tile * (long ? .58 : short ? .34 : .45), cy + dy * tile * (long ? .58 : short ? .34 : .45));
  ctx.stroke();
  ctx.restore();
}
