// One Frame Heist — tuning constants and shared numbers.
// Every value lives here so the feel of the game (speeds, cones, alarm)
// can be balanced in one place without touching the logic files.

export const VIEW = { width: 1280, height: 720 };
export const HUD_HEIGHT = 64;

// The play floor sits below the HUD bar.
export const FLOOR = { x: 0, y: HUD_HEIGHT, width: 1280, height: 720 - HUD_HEIGHT };

// The thief.
export const THIEF = {
  radius: 14,
  speed: 178, // px per second
  // How close the thief must stand to a loot spot to start cracking it.
  pickupRadius: 36,
};

// A guard's eye.
export const GUARD_EYE = {
  range: 215, // how far a guard can spot the thief
  halfAngle: 0.62, // radians either side of facing (~35 degrees)
  patrolSpeed: 72,
  chaseSpeed: 128,
  // Spotting the thief closer than this always registers, even from behind.
  hearingRadius: 42,
  // Seconds of lost sight before a chasing guard gives up and patrols again.
  loseSightSeconds: 2.5,
  // Seconds a guard studies a coin's landing spot.
  investigateSeconds: 2.6,
};

// A wall camera's eye.
export const CAMERA_EYE = {
  range: 275,
  halfAngle: 0.55,
};

// The alarm meter: 0 is calm, 100 is caught.
export const ALARM = {
  max: 100,
  guardPerSecond: 30,
  cameraPerSecond: 22,
  decayPerSecond: 8,
};

// The tools the thief carries. Both are limited: every use is a decision.
export const TOOLS = {
  coins: 3, // click to toss one; the nearest guard walks over to look
  smokes: 2, // Space or F: a smoke cloud that hides the thief for a while
  smokeRadius: 96,
  smokeSeconds: 6,
  coinLureRadius: 460, // a guard farther than this ignores a tossed coin
};

// The score: loot value plus a bonus for a fast, quiet getaway.
export const SCORE = {
  timeBonusStart: 600,
  timeBonusPerSecond: 2,
  // Loot value the thief must carry before the exit door unlocks.
  targetValue: 1000,
};
