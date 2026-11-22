// One Frame Heist — the vault room: walls, cover furniture, loot spots,
// the entrance where the thief starts and the exit door.
// Cover blocks movement and blocks sight, so the furniture is both the
// puzzle and the hiding place: every route runs from one shadow to the next.

import { FLOOR, SCORE } from './config.js';

// Rectangles are { x, y, w, h } in logical 1280x720 space.
const WALL = 16;

export function buildRoom() {
  const walls = [
    // Outer shell of the vault room.
    { x: 0, y: FLOOR.y, w: 1280, h: WALL },
    { x: 0, y: 720 - WALL, w: 1280, h: WALL },
    { x: 0, y: FLOOR.y, w: WALL, h: FLOOR.height },
    { x: 1280 - WALL, y: FLOOR.y, w: WALL, h: FLOOR.height },
  ];

  // Cover furniture. Each piece blocks movement and line of sight.
  const cover = [
    { x: 96, y: 120, w: 150, h: 96, kind: 'vault', label: 'Vault A' },
    { x: 1034, y: 120, w: 150, h: 96, kind: 'vault', label: 'Vault B' },
    { x: 380, y: 120, w: 200, h: 56, kind: 'case', label: 'Gem case' },
    { x: 700, y: 120, w: 200, h: 56, kind: 'case', label: 'Gem case' },
    { x: 280, y: 330, w: 170, h: 72, kind: 'desk', label: 'Ledger desk' },
    { x: 830, y: 330, w: 170, h: 72, kind: 'desk', label: 'Ledger desk' },
    { x: 600, y: 420, w: 80, h: 80, kind: 'pillar', label: 'Pillar' },
    { x: 470, y: 560, w: 64, h: 64, kind: 'planter', label: 'Planter' },
    { x: 746, y: 560, w: 64, h: 64, kind: 'planter', label: 'Planter' },
  ];

  // Loot spots sit just clear of the furniture so the thief can reach them.
  // channelSeconds is how long the thief must stand still to take the loot.
  const loot = [
    { id: 'safe-a', name: 'Vault Safe A', kind: 'safe', x: 171, y: 232, value: 400, channelSeconds: 2.5, taken: false, progress: 0 },
    { id: 'safe-b', name: 'Vault Safe B', kind: 'safe', x: 1109, y: 232, value: 400, channelSeconds: 2.5, taken: false, progress: 0 },
    { id: 'ruby', name: 'Ruby', kind: 'gem', x: 480, y: 192, value: 250, channelSeconds: 0.8, taken: false, progress: 0 },
    { id: 'sapphire', name: 'Sapphire', kind: 'gem', x: 800, y: 192, value: 250, channelSeconds: 0.8, taken: false, progress: 0 },
    { id: 'painting-west', name: 'Portrait', kind: 'painting', x: 44, y: 400, value: 150, channelSeconds: 0.6, taken: false, progress: 0 },
    { id: 'painting-east', name: 'Landscape', kind: 'painting', x: 1236, y: 400, value: 150, channelSeconds: 0.6, taken: false, progress: 0 },
    { id: 'crown', name: 'Crown Jewel', kind: 'gem', x: 640, y: 516, value: 500, channelSeconds: 1.5, taken: false, progress: 0 },
    { id: 'gold', name: 'Gold Bars', kind: 'gold', x: 640, y: 240, value: 300, channelSeconds: 1.0, taken: false, progress: 0 },
  ];

  return {
    walls,
    cover,
    loot,
    targetValue: SCORE.targetValue,
    // Where the thief slips in, bottom-left.
    entrance: { x: 92, y: 652 },
    // The exit door on the bottom wall, bottom-right. Locked until the
    // target value is carried; touching it then is the getaway.
    exit: { x: 1140, y: 672, w: 84, h: 32 },
  };
}

/** Every solid rectangle: walls plus cover furniture. */
export function solidRects(room) {
  return room.walls.concat(room.cover);
}

/** Push a circle (x, y, radius) out of every solid rectangle it overlaps. */
export function resolveCircleCollision(x, y, radius, solids) {
  let px = x;
  let py = y;
  for (const rect of solids) {
    const nearestX = Math.max(rect.x, Math.min(px, rect.x + rect.w));
    const nearestY = Math.max(rect.y, Math.min(py, rect.y + rect.h));
    const dx = px - nearestX;
    const dy = py - nearestY;
    const distSq = dx * dx + dy * dy;
    if (distSq >= radius * radius) continue;
    if (distSq === 0) {
      // Centre inside the rectangle: push out along the shallowest side.
      const left = px - rect.x;
      const right = rect.x + rect.w - px;
      const top = py - rect.y;
      const bottom = rect.y + rect.h - py;
      const shallow = Math.min(left, right, top, bottom);
      if (shallow === left) px = rect.x - radius;
      else if (shallow === right) px = rect.x + rect.w + radius;
      else if (shallow === top) py = rect.y - radius;
      else py = rect.y + rect.h + radius;
      continue;
    }
    const dist = Math.sqrt(distSq);
    px = nearestX + (dx / dist) * radius;
    py = nearestY + (dy / dist) * radius;
  }
  return { x: px, y: py };
}

/** True when the segment from (x1, y1) to (x2, y2) crosses a solid rectangle. */
export function segmentHitsRect(x1, y1, x2, y2, rect) {
  // A segment whose endpoint sits inside the rectangle is blocked.
  if (x1 >= rect.x && x1 <= rect.x + rect.w && y1 >= rect.y && y1 <= rect.y + rect.h) return true;
  if (x2 >= rect.x && x2 <= rect.x + rect.w && y2 >= rect.y && y2 <= rect.y + rect.h) return true;
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;
  // Slab test on the x axis.
  if (dx === 0) {
    if (x1 < rect.x || x1 > rect.x + rect.w) return false;
  } else {
    let t1 = (rect.x - x1) / dx;
    let t2 = (rect.x + rect.w - x1) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  // Slab test on the y axis.
  if (dy === 0) {
    if (y1 < rect.y || y1 > rect.y + rect.h) return false;
  } else {
    let t1 = (rect.y - y1) / dy;
    let t2 = (rect.y + rect.h - y1) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  return true;
}

/** True when nothing solid stands between the two points. */
export function hasLineOfSight(x1, y1, x2, y2, solids) {
  for (const rect of solids) {
    if (segmentHitsRect(x1, y1, x2, y2, rect)) return false;
  }
  return true;
}

/** Smallest absolute turn between two headings, in radians. */
export function angleDifference(a, b) {
  let diff = a - b;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return Math.abs(diff);
}

/** Distance between two points. */
export function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}
