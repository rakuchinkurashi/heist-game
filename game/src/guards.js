// One Frame Heist — the guards: waypoint patrols, vision cones, chase and
// investigation. A guard walks a fixed loop, turns to face where it walks,
// and only sees the thief inside its cone with a clear line of sight.
// A tossed coin pulls the nearest guard off its route to look.

import { GUARD_EYE } from './config.js';
import { angleDifference, distance, hasLineOfSight, resolveCircleCollision } from './world.js';

export const GUARD_PATROL = 'patrol';
export const GUARD_CHASE = 'chase';
export const GUARD_INVESTIGATE = 'investigate';
export const GUARD_RETURN = 'return';

/** Two guards on rectangular loops: one works the top half, one the bottom. */
export function createGuards() {
  return [
    {
      id: 'guard-1',
      x: 240, y: 280,
      facing: 0,
      waypoints: [
        { x: 240, y: 280 }, { x: 1040, y: 280 },
        { x: 1040, y: 470 }, { x: 240, y: 470 },
      ],
      waypointIndex: 1,
      mode: GUARD_PATROL,
      speed: GUARD_EYE.patrolSpeed,
      lostSightFor: 0,
      investigateFor: 0,
      investigateAt: null,
      scanAngle: 0,
    },
    {
      id: 'guard-2',
      x: 1060, y: 620,
      facing: Math.PI,
      waypoints: [
        { x: 220, y: 620 }, { x: 1060, y: 620 },
        { x: 1060, y: 540 }, { x: 220, y: 540 },
      ],
      waypointIndex: 0,
      mode: GUARD_PATROL,
      speed: GUARD_EYE.patrolSpeed - 8,
      lostSightFor: 0,
      investigateFor: 0,
      investigateAt: null,
      scanAngle: 0,
    },
  ];
}

/**
 * Can this guard see the thief right now? Inside the cone (or very close,
 * where the guard hears footsteps), with no wall or furniture in between,
 * and not hidden inside a smoke cloud.
 */
export function guardSeesThief(guard, thief, solids, smokes) {
  const dist = distance(guard.x, guard.y, thief.x, thief.y);
  if (dist > GUARD_EYE.range) return false;
  if (smokes.some((s) => distance(thief.x, thief.y, s.x, s.y) <= s.radius)) return false;
  if (dist <= GUARD_EYE.hearingRadius) return true;
  const toThief = Math.atan2(thief.y - guard.y, thief.x - guard.x);
  if (angleDifference(toThief, guard.facing) > GUARD_EYE.halfAngle) return false;
  return hasLineOfSight(guard.x, guard.y, thief.x, thief.y, solids);
}

/** Walk toward (tx, ty) at the guard's speed, facing the walk, kept out of walls. */
function walkToward(guard, tx, ty, dt, solids) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return true;
  const step = Math.min(dist, guard.speed * dt);
  guard.facing = Math.atan2(dy, dx);
  const next = resolveCircleCollision(
    guard.x + (dx / dist) * step,
    guard.y + (dy / dist) * step,
    14, solids,
  );
  guard.x = next.x;
  guard.y = next.y;
  return dist - step < 2;
}

/** Send the nearest guard within lure range to look at a tossed coin. */
export function lureGuardsToCoin(guards, coinX, coinY) {
  let nearest = null;
  let nearestDist = Infinity;
  for (const guard of guards) {
    const dist = distance(guard.x, guard.y, coinX, coinY);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = guard;
    }
  }
  if (nearest === null || nearestDist > 460) return false;
  if (nearest.mode === GUARD_CHASE) return false;
  nearest.mode = GUARD_INVESTIGATE;
  nearest.investigateAt = { x: coinX, y: coinY };
  nearest.investigateFor = 0;
  nearest.speed = GUARD_EYE.patrolSpeed + 18;
  return true;
}

/**
 * Step every guard one frame. Returns true when any guard is looking at the
 * thief (the alarm rises), and sets `caught` when a guard grabs the thief.
 */
export function updateGuards(guards, thief, solids, smokes, dt, result) {
  let spotted = false;
  for (const guard of guards) {
    const sees = guardSeesThief(guard, thief, solids, smokes);
    if (sees) {
      spotted = true;
      guard.mode = GUARD_CHASE;
      guard.lostSightFor = 0;
      guard.investigateAt = null;
    }

    if (guard.mode === GUARD_CHASE) {
      if (!sees) {
        guard.lostSightFor += dt;
        if (guard.lostSightFor >= GUARD_EYE.loseSightSeconds) {
          guard.mode = GUARD_RETURN;
          guard.speed = GUARD_EYE.patrolSpeed;
        }
      }
      guard.speed = GUARD_EYE.chaseSpeed;
      walkToward(guard, thief.x, thief.y, dt, solids);
      if (distance(guard.x, guard.y, thief.x, thief.y) < 26) result.caught = true;
    } else if (guard.mode === GUARD_INVESTIGATE) {
      const target = guard.investigateAt;
      if (target === null) {
        guard.mode = GUARD_RETURN;
      } else if (walkToward(guard, target.x, target.y, dt, solids)) {
        // Arrived: stand and scan the area for a while.
        guard.investigateFor += dt;
        guard.facing += dt * 1.6;
        if (guard.investigateFor >= GUARD_EYE.investigateSeconds) {
          guard.mode = GUARD_RETURN;
          guard.speed = GUARD_EYE.patrolSpeed;
          guard.investigateAt = null;
        }
      }
    } else if (guard.mode === GUARD_RETURN) {
      // Walk back to the nearest waypoint, then resume the patrol loop.
      let nearestIndex = 0;
      let nearestDist = Infinity;
      guard.waypoints.forEach((point, index) => {
        const dist = distance(guard.x, guard.y, point.x, point.y);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIndex = index;
        }
      });
      const point = guard.waypoints[nearestIndex];
      if (walkToward(guard, point.x, point.y, dt, solids)) {
        guard.mode = GUARD_PATROL;
        guard.waypointIndex = (nearestIndex + 1) % guard.waypoints.length;
      }
    } else {
      // Patrol: walk the loop, pausing a beat at each corner to look around.
      const point = guard.waypoints[guard.waypointIndex];
      if (walkToward(guard, point.x, point.y, dt, solids)) {
        guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
      }
    }
  }
  return spotted;
}
