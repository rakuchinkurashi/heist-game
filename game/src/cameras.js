// One Frame Heist — the wall cameras: fixed mounts that sweep their vision
// cone back and forth. A camera never chases; it only raises the alarm
// while the thief stands inside its sweeping cone with a clear view.

import { CAMERA_EYE } from './config.js';
import { angleDifference, distance, hasLineOfSight } from './world.js';

/** Three cameras: one on the top wall, one on each side wall. */
export function createCameras() {
  return [
    {
      id: 'cam-top',
      x: 640, y: 82,
      baseAngle: Math.PI / 2, // looking down into the room
      sweep: 0.95, // radians either side of the base angle
      periodSeconds: 4.2, // one full sweep out and back
      phase: 0,
    },
    {
      id: 'cam-west',
      x: 18, y: 380,
      baseAngle: 0, // looking right
      sweep: 0.7,
      periodSeconds: 5.1,
      phase: 1.3,
    },
    {
      id: 'cam-east',
      x: 1262, y: 380,
      baseAngle: Math.PI, // looking left
      sweep: 0.7,
      periodSeconds: 5.1,
      phase: 3.1,
    },
  ];
}

/** Where a camera is looking right now: a smooth sine sweep around its base angle. */
export function cameraAngle(camera, timeSeconds) {
  const t = (timeSeconds / camera.periodSeconds) * Math.PI * 2 + camera.phase;
  return camera.baseAngle + Math.sin(t) * camera.sweep;
}

/** Can this camera see the thief right now? Same rules as a guard's eye. */
export function cameraSeesThief(camera, thief, solids, smokes, timeSeconds) {
  const dist = distance(camera.x, camera.y, thief.x, thief.y);
  if (dist > CAMERA_EYE.range) return false;
  if (smokes.some((s) => distance(thief.x, thief.y, s.x, s.y) <= s.radius)) return false;
  const angle = cameraAngle(camera, timeSeconds);
  const toThief = Math.atan2(thief.y - camera.y, thief.x - camera.x);
  if (angleDifference(toThief, angle) > CAMERA_EYE.halfAngle) return false;
  return hasLineOfSight(camera.x, camera.y, thief.x, thief.y, solids);
}

/** Step the cameras one frame; true when any camera has the thief in view. */
export function updateCameras(cameras, thief, solids, smokes, timeSeconds) {
  let spotted = false;
  for (const camera of cameras) {
    if (cameraSeesThief(camera, thief, solids, smokes, timeSeconds)) spotted = true;
  }
  return spotted;
}
