// One Frame Heist — the ?shot= screenshot scenes.
// Each scene stages a real game state so the screenshots show the game as
// it actually plays: start is the title over a fresh room, play is a thief
// mid-heist with some loot already lifted and the alarm partway up, and end
// is the clean getaway screen. Nothing here is drawn specially for the
// camera; the render path is the same one the player sees.

import { SCREEN_CAUGHT, SCREEN_ESCAPED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

/**
 * Stage `game` for the named scene and return the screen to show.
 * Unknown names fall back to the title scene.
 */
export function stageShot(name, game) {
  if (name === 'play') {
    // Mid-heist: the thief is near the centre of the room, two loot spots
    // are already taken, the alarm is partway up, and a guard is closing in.
    game.thief.x = 640;
    game.thief.y = 380;
    game.thief.facing = -Math.PI / 2;
    const ruby = game.room.loot.find((item) => item.id === 'ruby');
    const gold = game.room.loot.find((item) => item.id === 'gold');
    if (ruby) ruby.taken = true;
    if (gold) gold.taken = true;
    game.lootValue = 550;
    game.alarm = 34;
    game.elapsedSeconds = 87;
    game.coinsLeft = 2;
    game.smokesLeft = 1;
    game.smokes.push({ x: 560, y: 430, radius: 96, remaining: 4 });
    game.guards[0].x = 700;
    game.guards[0].y = 300;
    game.guards[0].facing = Math.PI / 2;
    game.guards[0].mode = 'chase';
    game.guards[1].x = 300;
    game.guards[1].y = 560;
    game.guards[1].facing = 0;
    game.score = 550 + Math.max(0, 600 - 87 * 2);
    return SCREEN_PLAY;
  }
  if (name === 'end') {
    // The getaway: loot past the target, exit unlocked, escape screen up.
    for (const item of game.room.loot) {
      if (item.id === 'ruby' || item.id === 'sapphire' || item.id === 'gold' || item.id === 'safe-a') {
        item.taken = true;
      }
    }
    game.lootValue = 1400;
    game.unlocked = true;
    game.alarm = 58;
    game.elapsedSeconds = 154;
    game.thief.x = 1180;
    game.thief.y = 668;
    game.score = 1400 + Math.max(0, 600 - 154 * 2);
    return SCREEN_ESCAPED;
  }
  if (name === 'caught') {
    game.alarm = 100;
    game.lootValue = 250;
    game.elapsedSeconds = 61;
    game.score = 250 + Math.max(0, 600 - 61 * 2);
    return SCREEN_CAUGHT;
  }
  return SCREEN_TITLE;
}
