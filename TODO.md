# Dot Souls Feature Backlog

## Critical: Make The Game Whole

- [x] Guarantee the full map is completable from spawn to Warden to stairs.
- [x] Add a campfire interaction/menu at every campfire.
- [x] Add a vendor/training menu with meaningful soul sinks.
- [x] Restore death flow: drop carried souls into a bloodstain.
- [x] Restore bloodstain recovery on return.
- [x] Preserve earned upgrades across death/reset style respawns where appropriate.
- [x] Add clear UI prompts when standing on campfire, chest, gate, stairs, bloodstain, or relic.
- [x] Add boss gate/key flow that is visible, reliable, and cannot soft-lock.
- [x] Add an explicit victory condition and post-victory overlay.

## Combat Feel

- [x] Add weapon sprites from the downloaded weapons pack to the held player weapon.
- [x] Add weapon-flavored slash/thrust trails for each equipped weapon class.
- [x] Add multiple weapon classes: sword, greatsword, spear, axe, dagger.
- [x] Add equip switching and weapon stats: stamina cost, arc, reach, stagger.
- [x] Add critical-hit stats and crit windows per weapon.
- [x] Add enemy-specific tells: line, cone, sweep, leap, curse zone.
- [ ] Add dodge i-frames visual ring and recovery timing.
- [ ] Add parry timing window feedback.
- [ ] Add backstab/critical hit when attacking staggered enemies from behind.
- [ ] Add enemy hit reactions and death particles.
- [x] Add boss phase transition at 50% HP.

## Progression

- [x] Add first vendor inventory: weapons, flasks, and stat training.
- [x] Remove progression keys from shop and move them to combat rewards.
- [x] Add evolving vendor inventory based on Captain, gate, and Warden progress.
- [x] Add anvil upgrades with per-weapon +1/+2 changes.
- [x] Add ember material costs and elite/boss/chest/relic upgrade sources.
- [ ] Expand vendor inventory with relic hints, blessings, and limited-stock curios.
- [x] Add permanent upgrades: max HP, stamina, damage, flask capacity.
- [ ] Add temporary boons that reset on death/rest.
- [ ] Add locked chests and treasure rooms.
- [ ] Add named relics that change combat behavior.
- [ ] Add soul banking or risk/reward offering at chapel altar.
- [x] Add run stats: deaths, souls recovered/lost, enemies defeated.

## World And Encounters

- [x] Add room encounter locks that open after enemies are defeated.
- [x] Add destructible pew/rubble shortcuts.
- [ ] Add secret walls or hidden alcoves.
- [ ] Add minimap/fog-of-war memory.
- [ ] Add second area below the chapel.
- [ ] Add optional miniboss.
- [x] Add NPC vendor sprite and dialogue.
- [ ] Add lore pickups/tomb inscriptions.

## Presentation

- [x] Integrate downloaded music pack into the sound system.
- [x] Add separate tracks for exploration, combat, boss, campfire, victory, death.
- [x] Add volume controls and mute persistence.
- [ ] Add title screen/main menu.
- [x] Add pause/options menu.
- [ ] Add screen shake tuning and hit-stop.
- [ ] Add better lighting around torches, relics, and room edges.
- [x] Add clearer campfire, vendor, and boss-phase lighting.
- [ ] Add animated UI portraits/icons.
- [ ] Add mobile-friendly controls.

## Engineering

- [x] Add automated reachability validation for maps.
- [x] Add first automated tests for map reachability, weapon reach, death, and bloodstain.
- [ ] Expand tests for enemy AI, vendor purchases, and victory.
- [x] Add tests for destructibles, encounter locks, and options persistence.
- [x] Add boss phase, Captain key, and anvil upgrade tests.
- [x] Add critical-window and ember-material tests.
- [x] Add save/load to localStorage.
- [x] Add save/load persistence tests.
- [ ] Add content data files for enemies/weapons/items instead of hardcoding.
- [x] Add a debug overlay for collision, enemy intents, and map coordinates.
- [ ] Add lint/format scripts.
- [ ] Keep GitHub Pages build small and deterministic.
