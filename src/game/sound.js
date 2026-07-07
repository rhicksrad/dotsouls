import { ENEMY, TILE } from "./constants.js";
import { tileAt } from "./map.js";

let audio;
let master;
let music;
let currentTrack = "";
let volume = .65;

const TRACKS = {
  explore: "./assets/music-codeman-8bit/bgm_action_1.mp3",
  combat: "./assets/music-codeman-8bit/bgm_action_2.mp3",
  boss: "./assets/music-codeman-8bit/bgm_action_5.mp3",
  camp: "./assets/music-codeman-8bit/bgm_menu.mp3",
  death: "./assets/music-codeman-8bit/bgm_action_3.mp3",
  victory: "./assets/music-codeman-8bit/bgm_action_4.mp3",
};

export function toggleSound(game) {
  game.muted = !game.muted;
  setVolume(game, game.volume ?? volume);
  document.getElementById("muteButton").textContent = game.muted ? "Sound Off" : "Sound On";
  if (game.muted) {
    if (music) music.pause();
  } else {
    tone([220, 330, 440], .05);
    syncMusic(game);
  }
}

export function tone(notes, length = .07) {
  if (!audio) {
    audio = new (window.AudioContext || window.webkitAudioContext)();
    master = audio.createGain();
    master.gain.value = .035 * volume;
    master.connect(audio.destination);
  }
  if (audio.state === "suspended") audio.resume();
  notes.forEach((freq, index) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(.0001, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(.55, audio.currentTime + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + length + index * .025);
    osc.connect(gain).connect(master);
    osc.start(audio.currentTime + index * .025);
    osc.stop(audio.currentTime + length + index * .025 + .02);
  });
}

export function setVolume(game, value) {
  volume = Math.max(0, Math.min(1, Number(value) || 0));
  if (game) game.volume = volume;
  if (master) master.gain.value = .035 * volume;
  if (music) music.volume = .32 * volume;
}

export function syncMusic(game) {
  if (!game || game.muted) {
    if (music) music.pause();
    return;
  }
  ensureMusic();
  const nextTrack = chooseTrack(game);
  if (currentTrack !== nextTrack) {
    currentTrack = nextTrack;
    music.src = nextTrack;
    music.currentTime = 0;
  }
  music.play().catch(() => {
    // Browsers require a user gesture; the Sound button provides it.
  });
}

function ensureMusic() {
  if (music) return;
  music = new Audio();
  music.loop = true;
  music.volume = .32 * volume;
}

function chooseTrack(game) {
  if (game.dead) return TRACKS.death;
  if (game.won) return TRACKS.victory;
  const warden = game.world.enemies.find((enemy) => enemy.type === ENEMY.WARDEN && enemy.hp > 0);
  if (warden && distance(warden, game.player) <= 9) return TRACKS.boss;
  if (game.world.enemies.some((enemy) => enemy.hp > 0 && distance(enemy, game.player) <= 7)) return TRACKS.combat;
  if (tileAt(game.world, game.player.x, game.player.y) === TILE.CAMP) return TRACKS.camp;
  return TRACKS.explore;
}

function distance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
