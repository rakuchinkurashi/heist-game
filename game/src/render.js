// One Frame Heist — all drawing: the vault room, vision cones, loot, the
// thief, the HUD with its alarm meter, and the title / caught / escape
// screens. Colours carry the meaning at a glance: gold is loot, amber and
// red are danger, green is the way out, teal is safe cover.

import { ALARM, CAMERA_EYE, GUARD_EYE, HUD_HEIGHT, VIEW } from './config.js';
import { cameraAngle } from './cameras.js';
import { GUARD_CHASE, GUARD_INVESTIGATE } from './guards.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_ESCAPED = 'escaped';

const GOLD = '#f5c542';
const DANGER = '#e5484d';
const WARN = '#f5a524';
const SAFE = '#2fbf8f';
const INK = '#0e1420';
const PANEL = '#16202e';

/** Draw one vision cone: a translucent wedge from (x, y) along `angle`. */
function drawCone(ctx, x, y, angle, range, halfAngle, fill) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawFloor(ctx, room) {
  ctx.fillStyle = '#1b2436';
  ctx.fillRect(0, HUD_HEIGHT, VIEW.width, VIEW.height - HUD_HEIGHT);
  // Faint floor tiles so the room reads as a place, not a void.
  ctx.strokeStyle = 'rgba(255,255,255,0.045)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= VIEW.width; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, HUD_HEIGHT);
    ctx.lineTo(x, VIEW.height);
    ctx.stroke();
  }
  for (let y = HUD_HEIGHT; y <= VIEW.height; y += 80) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(VIEW.width, y);
    ctx.stroke();
  }
  // A deep-red carpet runner down the middle: the risky open route.
  ctx.fillStyle = 'rgba(120,32,44,0.35)';
  ctx.fillRect(560, HUD_HEIGHT, 160, VIEW.height - HUD_HEIGHT);
}

function drawRoomWalls(ctx, room) {
  for (const wall of room.walls) {
    ctx.fillStyle = '#3a4a63';
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.strokeStyle = '#55688a';
    ctx.lineWidth = 1;
    ctx.strokeRect(wall.x + 0.5, wall.y + 0.5, wall.w - 1, wall.h - 1);
  }
}

function drawFurniture(ctx, room) {
  for (const piece of room.cover) {
    if (piece.kind === 'vault') {
      ctx.fillStyle = '#4a5a3a';
      ctx.fillRect(piece.x, piece.y, piece.w, piece.h);
      ctx.fillStyle = '#5d6f47';
      ctx.fillRect(piece.x + 8, piece.y + 8, piece.w - 16, piece.h - 16);
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(piece.x + piece.w / 2, piece.y + piece.h / 2, 18, 0, Math.PI * 2);
      ctx.stroke();
    } else if (piece.kind === 'case') {
      ctx.fillStyle = '#274b5e';
      ctx.fillRect(piece.x, piece.y, piece.w, piece.h);
      ctx.fillStyle = 'rgba(180,220,255,0.25)';
      ctx.fillRect(piece.x + 6, piece.y + 6, piece.w - 12, piece.h - 12);
    } else if (piece.kind === 'desk') {
      ctx.fillStyle = '#5b4632';
      ctx.fillRect(piece.x, piece.y, piece.w, piece.h);
      ctx.fillStyle = '#6f5844';
      ctx.fillRect(piece.x + 10, piece.y + 10, piece.w - 20, piece.h - 20);
    } else if (piece.kind === 'pillar') {
      ctx.fillStyle = '#46586e';
      ctx.fillRect(piece.x, piece.y, piece.w, piece.h);
      ctx.fillStyle = '#5a6d84';
      ctx.fillRect(piece.x + 8, piece.y + 8, piece.w - 16, piece.h - 16);
    } else {
      ctx.fillStyle = '#2e5d43';
      ctx.fillRect(piece.x, piece.y, piece.w, piece.h);
      ctx.fillStyle = '#3f7a58';
      ctx.beginPath();
      ctx.arc(piece.x + piece.w / 2, piece.y + piece.h / 2, 20, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    ctx.strokeRect(piece.x + 0.5, piece.y + 0.5, piece.w - 1, piece.h - 1);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(piece.label, piece.x + piece.w / 2, piece.y + piece.h + 14);
  }
}

function drawLoot(ctx, room) {
  for (const item of room.loot) {
    if (item.taken) continue;
    const pulse = 1 + Math.sin(Date.now() / 300 + item.x) * 0.08;
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.scale(pulse, pulse);
    if (item.kind === 'gem') {
      ctx.fillStyle = item.id === 'crown' ? '#ff5d8f' : '#7dd3fc';
      ctx.beginPath();
      ctx.moveTo(0, -13);
      ctx.lineTo(11, 0);
      ctx.lineTo(0, 13);
      ctx.lineTo(-11, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (item.kind === 'safe') {
      ctx.fillStyle = GOLD;
      ctx.fillRect(-13, -13, 26, 26);
      ctx.strokeStyle = '#7a5b00';
      ctx.lineWidth = 2;
      ctx.strokeRect(-13, -13, 26, 26);
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.stroke();
    } else if (item.kind === 'painting') {
      ctx.fillStyle = '#b07d4f';
      ctx.fillRect(-14, -11, 28, 22);
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 2;
      ctx.strokeRect(-14, -11, 28, 22);
      ctx.fillStyle = '#7fb069';
      ctx.fillRect(-9, -6, 18, 12);
    } else {
      ctx.fillStyle = GOLD;
      for (const offset of [-9, 0, 9]) {
        ctx.fillRect(offset - 6, -6, 12, 12);
      }
    }
    ctx.restore();
    // Value tag above the loot.
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`$${item.value}`, item.x, item.y - 22);
    // Crack progress ring while the thief stands at the loot.
    if (item.progress > 0 && item.progress < 1) {
      ctx.beginPath();
      ctx.arc(item.x, item.y, 20, -Math.PI / 2, -Math.PI / 2 + item.progress * Math.PI * 2);
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 4;
      ctx.stroke();
    }
  }
}

function drawExit(ctx, room, unlocked) {
  const door = room.exit;
  ctx.fillStyle = unlocked ? SAFE : DANGER;
  ctx.fillRect(door.x, door.y - 8, door.w, 12);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(unlocked ? 'EXIT — GO!' : `EXIT — LOCKED ($${room.targetValue})`, door.x + door.w / 2, door.y - 14);
  if (unlocked) {
    ctx.strokeStyle = SAFE;
    ctx.lineWidth = 3;
    ctx.strokeRect(door.x, door.y - 8, door.w, 12);
  }
}

function drawGuards(ctx, guards) {
  for (const guard of guards) {
    const chasing = guard.mode === GUARD_CHASE;
    const curious = guard.mode === GUARD_INVESTIGATE;
    const coneFill = chasing
      ? 'rgba(229,72,77,0.30)'
      : curious
        ? 'rgba(245,165,36,0.25)'
        : 'rgba(245,196,66,0.18)';
    drawCone(ctx, guard.x, guard.y, guard.facing, GUARD_EYE.range, GUARD_EYE.halfAngle, coneFill);
    // Guard body: a uniformed figure with a cap brim pointing where it faces.
    ctx.fillStyle = chasing ? DANGER : '#8a6d3b';
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#1c2433';
    ctx.beginPath();
    ctx.arc(guard.x + Math.cos(guard.facing) * 8, guard.y + Math.sin(guard.facing) * 8, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(chasing ? '!' : curious ? '?' : '', guard.x, guard.y - 20);
  }
}

function drawCameras(ctx, cameras, timeSeconds) {
  for (const camera of cameras) {
    const angle = cameraAngle(camera, timeSeconds);
    drawCone(ctx, camera.x, camera.y, angle, CAMERA_EYE.range, CAMERA_EYE.halfAngle, 'rgba(229,72,77,0.16)');
    ctx.fillStyle = '#39445a';
    ctx.beginPath();
    ctx.arc(camera.x, camera.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = DANGER;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = DANGER;
    ctx.beginPath();
    ctx.arc(camera.x + Math.cos(angle) * 12, camera.y + Math.sin(angle) * 12, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawThief(ctx, thief) {
  // A hooded figure in dark teal, with a pale mask slit facing where it moves.
  ctx.fillStyle = '#123f3a';
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7fffd4';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#e8fff6';
  ctx.beginPath();
  ctx.arc(thief.x + Math.cos(thief.facing) * 6, thief.y + Math.sin(thief.facing) * 6, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawTools(ctx, game) {
  for (const smoke of game.smokes) {
    const alpha = Math.min(1, smoke.remaining / 1.5);
    ctx.fillStyle = `rgba(200,205,215,${0.45 * alpha})`;
    ctx.beginPath();
    ctx.arc(smoke.x, smoke.y, smoke.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(255,255,255,${0.6 * alpha})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  for (const coin of game.coinsInFlight) {
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7a5b00';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  for (const coin of game.coinsLanded) {
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 10 + Math.sin(Date.now() / 120) * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** The top HUD bar: alarm meter, loot carried, tools left, time and score. */
function drawHud(ctx, game) {
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, VIEW.width, HUD_HEIGHT);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ONE FRAME HEIST', 18, 28);
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText('WASD move · Click toss coin · Space smoke · R restart', 18, 48);

  // Alarm meter.
  const meterX = 470;
  const meterY = 18;
  const meterW = 300;
  const meterH = 20;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('ALARM', meterX, meterY - 5);
  ctx.fillStyle = '#2a3446';
  ctx.fillRect(meterX, meterY, meterW, meterH);
  const alarmRatio = Math.min(1, game.alarm / ALARM.max);
  const alarmColour = alarmRatio > 0.7 ? DANGER : alarmRatio > 0.35 ? WARN : SAFE;
  ctx.fillStyle = alarmColour;
  ctx.fillRect(meterX, meterY, meterW * alarmRatio, meterH);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.strokeRect(meterX + 0.5, meterY + 0.5, meterW - 1, meterH - 1);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${Math.round(game.alarm)}%`, meterX + meterW + 10, meterY + 15);

  // Loot carried toward the target.
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText(`LOOT $${game.lootValue} / $${game.room.targetValue}`, 850, 30);
  ctx.fillStyle = '#ffffff';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(`Coins ${game.coinsLeft} · Smoke ${game.smokesLeft} · ${formatTime(game.elapsedSeconds)}`, 850, 50);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`SCORE ${game.score}`, VIEW.width - 18, 30);
  ctx.textAlign = 'left';
}

export function formatTime(seconds) {
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

function drawPanel(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(10,14,22,0.78)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  const panelW = 620;
  const panelH = 120 + lines.length * 30;
  const panelX = (VIEW.width - panelW) / 2;
  const panelY = (VIEW.height - panelH) / 2;
  ctx.fillStyle = PANEL;
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.strokeRect(panelX, panelY, panelW, panelH);
  ctx.fillStyle = accent;
  ctx.font = 'bold 34px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, VIEW.width / 2, panelY + 58);
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px system-ui, sans-serif';
  lines.forEach((line, index) => {
    ctx.fillText(line, VIEW.width / 2, panelY + 100 + index * 30);
  });
  ctx.textAlign = 'left';
}

export function drawGame(ctx, game) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  drawFloor(ctx, game.room);
  drawFurniture(ctx, game.room);
  drawLoot(ctx, game.room);
  drawExit(ctx, game.room, game.lootValue >= game.room.targetValue);
  drawCameras(ctx, game.cameras, game.elapsedSeconds);
  drawGuards(ctx, game.guards);
  drawThief(ctx, game.thief);
  drawTools(ctx, game);
  drawHud(ctx, game);

  if (game.screen === SCREEN_TITLE) {
    drawPanel(ctx, 'ONE FRAME HEIST', [
      'Slip in, lift $1000 of loot, and reach the exit — without tripping the alarm.',
      'Guards patrol with vision cones. Cameras sweep. Furniture blocks their sight.',
      'Click to toss a coin and lure a guard. Space drops smoke.',
      'Stand still at loot to crack it.',
      'Press Enter or click to begin. WASD / arrows to move. R restarts any time.',
    ], GOLD);
  } else if (game.screen === SCREEN_CAUGHT) {
    drawPanel(ctx, 'CAUGHT!', [
      `The alarm hit 100% — the guards have you. Loot carried: $${game.lootValue}.`,
      `Score: ${game.score}. Press R or click to try the vault again.`,
    ], DANGER);
  } else if (game.screen === SCREEN_ESCAPED) {
    drawPanel(ctx, 'CLEAN GETAWAY!', [
      `You slipped out with $${game.lootValue} of loot in ${formatTime(game.elapsedSeconds)}.`,
      `Score: ${game.score}. Press R or click to run the vault again.`,
    ], SAFE);
  }
}
