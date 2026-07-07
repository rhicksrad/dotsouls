import { getContextPrompt } from "./state.js";

export function updateHud(game) {
  const { player } = game;
  setText("hpText", `${Math.max(0, player.hp)}/${player.hpMax}`);
  setText("staText", `${player.stamina}/${player.staminaMax}`);
  setText("soulsText", player.souls);
  setText("embersText", player.embers);
  setText("flaskText", `${player.flasks}/${player.flasksMax}`);
  setText("weaponText", `${player.weapon} ${player.damage}`);
  setText("relicText", player.relics);
  setText("keyText", keyLabel(player));
  setText("objectiveText", game.world.objective);
  setText("promptText", getContextPrompt(game));
  setText("statDeaths", game.stats.deaths);
  setText("statKills", game.stats.enemiesDefeated);
  setText("statRecovered", game.stats.soulsRecovered);
  setText("statCrits", game.stats.criticalHits);
  setFill("hpFill", player.hp / player.hpMax);
  setFill("staFill", player.stamina / player.staminaMax);
  updateDialogue(game);

  const log = document.getElementById("eventLog");
  log.replaceChildren(...game.log.map((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    return li;
  }));

  const overlay = document.getElementById("overlay");
  const title = document.getElementById("overlayTitle");
  const text = document.getElementById("overlayText");
  if (game.dead || game.won) {
    overlay.hidden = false;
    title.textContent = game.won ? "Victory" : "You Died";
    title.style.color = game.won ? "#8ff0a0" : "#d84949";
    text.textContent = game.won ? "Press R to remake the run." : "Press R to rise again.";
  } else {
    overlay.hidden = true;
  }
}

function updateDialogue(game) {
  const box = document.getElementById("dialogueBox");
  const speaker = document.getElementById("dialogueSpeaker");
  const text = document.getElementById("dialogueText");
  if (game.dialogue?.t > 0) {
    box.hidden = false;
    speaker.textContent = game.dialogue.speaker;
    text.textContent = game.dialogue.text;
  } else {
    box.hidden = true;
  }
}

function setText(id, value) {
  document.getElementById(id).textContent = value;
}

function keyLabel(player) {
  if (player.hasKey && player.descentKey) return "Both";
  if (player.hasKey) return "Brass";
  if (player.descentKey) return "Descent";
  return "No";
}

function setFill(id, pct) {
  document.getElementById(id).style.width = `${Math.max(0, Math.min(100, Math.round(pct * 100)))}%`;
}
