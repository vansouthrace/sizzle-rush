// Keyboard and mouse input: WASD / arrows to walk, E or Space to use the
// nearest station, M to mute, Enter to start / restart. Clicking the floor
// sets a walk target; clicking a station walks to it and uses it on arrival.

export function createInput(canvas) {
  const input = {
    keys: new Set(),
    click: null, // {x, y, used:false} in canvas pixels, consumed by world.js
    moveTarget: null,
    interactPressed: false,
    startPressed: false,
    mutePressed: false,
  };

  const KEYMAP = {
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
  };

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const dir = KEYMAP[event.code];
    if (dir) {
      input.keys.add(dir);
      event.preventDefault();
    } else if (event.code === 'KeyE' || event.code === 'Space') {
      input.interactPressed = true;
      event.preventDefault();
    } else if (event.code === 'Enter') {
      input.startPressed = true;
    } else if (event.code === 'KeyM') {
      input.mutePressed = true;
    }
  });

  window.addEventListener('keyup', (event) => {
    const dir = KEYMAP[event.code];
    if (dir) input.keys.delete(dir);
  });

  window.addEventListener('blur', () => input.keys.clear());

  canvas.addEventListener('pointerdown', (event) => {
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

// Read the held movement keys as a unit vector (or null when idle).
export function moveVector(input) {
  let x = 0;
  let y = 0;
  if (input.keys.has('left')) x -= 1;
  if (input.keys.has('right')) x += 1;
  if (input.keys.has('up')) y -= 1;
  if (input.keys.has('down')) y += 1;
  if (x === 0 && y === 0) return null;
  const len = Math.hypot(x, y);
  return { x: x / len, y: y / len };
}
