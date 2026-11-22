// One Frame Heist — keyboard and mouse input.
// WASD or arrow keys move the thief. A mouse click tosses a coin toward the
// clicked spot to lure a guard away. Space or F drops a smoke bomb at the
// thief's feet. R restarts, Enter starts, M toggles sound.

export function createInput(canvas) {
  const keys = new Set();
  const input = {
    keys,
    // The last mouse click in logical canvas coordinates, or null.
    click: null,
    // Set to true once when Space or F is pressed; the game loop consumes it.
    smokePressed: false,
    // Set to true once when R is pressed; the game loop consumes it.
    restartPressed: false,
    // Set to true once when Enter is pressed; the game loop consumes it.
    startPressed: false,
    // Set to true once when M is pressed; the game loop consumes it.
    mutePressed: false,
  };

  const KEY_ACTIONS = {
    Space: 'smokePressed',
    KeyF: 'smokePressed',
    KeyR: 'restartPressed',
    Enter: 'startPressed',
    KeyM: 'mutePressed',
  };

  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    if (event.repeat) return;
    keys.add(event.code);
    const flag = KEY_ACTIONS[event.code];
    if (flag) input[flag] = true;
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.code);
  });
  window.addEventListener('blur', () => {
    keys.clear();
  });

  canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    input.click = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  });

  return input;
}

/** Movement direction from the held keys, normalised to length 1. */
export function moveDirection(input) {
  let dx = 0;
  let dy = 0;
  if (input.keys.has('KeyA') || input.keys.has('ArrowLeft')) dx -= 1;
  if (input.keys.has('KeyD') || input.keys.has('ArrowRight')) dx += 1;
  if (input.keys.has('KeyW') || input.keys.has('ArrowUp')) dy -= 1;
  if (input.keys.has('KeyS') || input.keys.has('ArrowDown')) dy += 1;
  if (dx === 0 && dy === 0) return { x: 0, y: 0 };
  const length = Math.hypot(dx, dy);
  return { x: dx / length, y: dy / length };
}
