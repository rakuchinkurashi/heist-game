// One Frame Heist — the game loop and state machine.
// Screens: title → play → caught | escaped. The loop moves the thief,
// updates guards and cameras, raises or calms the alarm, cracks loot the
// thief stands beside, spends tools, and opens the exit at the target value.

import { ALARM, SCORE, THIEF, TOOLS, VIEW } from './config.js';
import { buildRoom, distance, resolveCircleCollision, solidRects } from './world.js';
import { createGuards, lureGuardsToCoin, updateGuards } from './guards.js';
import { createCameras, updateCameras } from './cameras.js';
import { createInput, moveDirection } from './input.js';
import {
  isMuted,
  playCaught,
  playCoin,
  playEscape,
  playPickup,
  playSpotted,
  playUnlock,
  toggleMute,
} from './audio.js';
import { SCREEN_CAUGHT, SCREEN_ESCAPED, SCREEN_PLAY, SCREEN_TITLE, drawGame } from './render.js';
import { stageShot } from './shots.js';

export function createGame() {
  const room = buildRoom();
  return {
    screen: SCREEN_TITLE,
    room,
    solids: solidRects(room),
    thief: { x: room.entrance.x, y: room.entrance.y, facing: 0 },
    guards: createGuards(),
    cameras: createCameras(),
    alarm: 0,
    lootValue: 0,
    elapsedSeconds: 0,
    score: 0,
    coinsLeft: TOOLS.coins,
    smokesLeft: TOOLS.smokes,
    smokes: [],
    coinsInFlight: [],
    coinsLanded: [],
    unlocked: false,
    wasSpotted: false,
    muted: false,
  };
}

/** Score from loot carried plus a bonus for a fast getaway. */
function computeScore(game) {
  const timeBonus = Math.max(0, SCORE.timeBonusStart - Math.floor(game.elapsedSeconds) * SCORE.timeBonusPerSecond);
  return game.lootValue + timeBonus;
}

/** Fresh run: same room, same guards, everything reset. */
export function resetGame(game) {
  const fresh = createGame();
  fresh.screen = SCREEN_PLAY;
  Object.assign(game, fresh);
}

/** The exit zone is open once the target loot value is carried. */
function thiefAtExit(game) {
  const exit = game.room.exit;
  return (
    game.thief.x >= exit.x && game.thief.x <= exit.x + exit.w &&
    game.thief.y >= exit.y - 8 && game.thief.y <= exit.y + exit.h
  );
}

function updatePlay(game, input, dt) {
  game.elapsedSeconds += dt;
  const thief = game.thief;

  // Move the thief, sliding along walls and furniture.
  const direction = moveDirection(input);
  if (direction.x !== 0 || direction.y !== 0) {
    thief.facing = Math.atan2(direction.y, direction.x);
    const next = resolveCircleCollision(
      thief.x + direction.x * THIEF.speed * dt,
      thief.y + direction.y * THIEF.speed * dt,
      THIEF.radius,
      game.solids,
    );
    thief.x = Math.max(THIEF.radius, Math.min(VIEW.width - THIEF.radius, next.x));
    thief.y = Math.max(64 + THIEF.radius, Math.min(VIEW.height - THIEF.radius, next.y));
  }

  // Tools: click tosses a coin, Space or F drops smoke.
  if (input.click !== null) {
    const click = input.click;
    input.click = null;
    if (game.coinsLeft > 0) {
      game.coinsLeft -= 1;
      game.coinsInFlight.push({ x: thief.x, y: thief.y, sx: thief.x, sy: thief.y, tx: click.x, ty: click.y, t: 0 });
      playCoin();
    }
  }
  if (input.smokePressed) {
    input.smokePressed = false;
    if (game.smokesLeft > 0) {
      game.smokesLeft -= 1;
      game.smokes.push({ x: thief.x, y: thief.y, radius: TOOLS.smokeRadius, remaining: TOOLS.smokeSeconds });
    }
  }

  // Tossed coins fly straight to their target, then sit there pinging.
  for (const coin of game.coinsInFlight) {
    coin.t += dt * 3;
    const k = Math.min(1, coin.t);
    coin.x = coin.sx + (coin.tx - coin.sx) * k;
    coin.y = coin.sy + (coin.ty - coin.sy) * k;
    if (k >= 1) {
      game.coinsLanded.push({ x: coin.tx, y: coin.ty, remaining: 8 });
      lureGuardsToCoin(game.guards, coin.tx, coin.ty);
    }
  }
  game.coinsInFlight = game.coinsInFlight.filter((coin) => coin.t < 1);
  for (const coin of game.coinsLanded) coin.remaining -= dt;
  game.coinsLanded = game.coinsLanded.filter((coin) => coin.remaining > 0);

  // Smoke clouds shrink away.
  for (const smoke of game.smokes) smoke.remaining -= dt;
  game.smokes = game.smokes.filter((smoke) => smoke.remaining > 0);

  // Guards and cameras: who can see the thief right now?
  const result = { caught: false };
  const guardSpotted = updateGuards(game.guards, thief, game.solids, game.smokes, dt, result);
  const cameraSpotted = updateCameras(game.cameras, thief, game.solids, game.smokes, game.elapsedSeconds);
  const spotted = guardSpotted || cameraSpotted;
  if (spotted && !game.wasSpotted) playSpotted();
  game.wasSpotted = spotted;

  // The alarm climbs while seen, calms while hidden.
  if (spotted) {
    let rise = 0;
    if (guardSpotted) rise += ALARM.guardPerSecond;
    if (cameraSpotted) rise += ALARM.cameraPerSecond;
    game.alarm = Math.min(ALARM.max, game.alarm + rise * dt);
  } else {
    game.alarm = Math.max(0, game.alarm - ALARM.decayPerSecond * dt);
  }
  if (game.alarm >= ALARM.max) result.caught = true;

  // Crack loot the thief stands beside; moving away resets the crack.
  const moving = direction.x !== 0 || direction.y !== 0;
  for (const item of game.room.loot) {
    if (item.taken) continue;
    const near = distance(thief.x, thief.y, item.x, item.y) <= THIEF.pickupRadius;
    if (near && !moving) {
      item.progress += dt / item.channelSeconds;
      if (item.progress >= 1) {
        item.taken = true;
        item.progress = 0;
        game.lootValue += item.value;
        playPickup();
        if (game.lootValue >= game.room.targetValue && !game.unlocked) {
          game.unlocked = true;
          playUnlock();
        }
      }
    } else {
      item.progress = 0;
    }
  }

  game.score = computeScore(game);

  // The getaway: reach the open exit carrying the target value.
  if (game.unlocked && thiefAtExit(game)) {
    game.screen = SCREEN_ESCAPED;
    game.score = computeScore(game);
    playEscape();
    return;
  }
  if (result.caught) {
    game.screen = SCREEN_CAUGHT;
    playCaught();
  }
}

export function startGame() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');

  // Logical 1280x720 canvas, scaled by CSS to fit the window.
  canvas.width = VIEW.width;
  canvas.height = VIEW.height;

  const input = createInput(canvas);
  const game = createGame();
  game.muted = isMuted();

  if (shot !== null) {
    // Screenshot scenes: stage a real game state for the camera.
    game.screen = stageShot(shot, game);
  }

  let lastTime = performance.now();

  function frame(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    if (input.mutePressed) {
      input.mutePressed = false;
      game.muted = toggleMute();
    }
    if (input.restartPressed) {
      input.restartPressed = false;
      if (game.screen !== SCREEN_TITLE) resetGame(game);
    }
    if (input.startPressed) {
      input.startPressed = false;
      if (game.screen === SCREEN_TITLE) game.screen = SCREEN_PLAY;
      else if (game.screen === SCREEN_CAUGHT || game.screen === SCREEN_ESCAPED) resetGame(game);
    }
    // A click on a title / end screen starts (or restarts) the game.
    if (input.click !== null && game.screen !== SCREEN_PLAY) {
      input.click = null;
      if (game.screen === SCREEN_TITLE) game.screen = SCREEN_PLAY;
      else resetGame(game);
    }

    if (game.screen === SCREEN_PLAY) updatePlay(game, input, dt);
    drawGame(ctx, game);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

startGame();
