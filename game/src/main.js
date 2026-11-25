// Sizzle Rush — entry point: canvas setup, game loop, screen switching.
// Keyboard and mouse are wired in input.js; the rules live in world.js;
// everything on screen is drawn by render.js.

import { CANVAS_W, CANVAS_H } from './config.js';
import { newGame, startShift, update } from './world.js';
import { createInput } from './input.js';
import { render } from './render.js';
import { applyShot, shotFromUrl } from './shots.js';
import { unlockAudio, toggleMute, isMuted } from './audio.js';

const canvas = document.getElementById('game');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;
const ctx = canvas.getContext('2d');

const { shot, seed } = shotFromUrl();
const state = newGame(seed);
const input = createInput(canvas);

// Debug handle for automated play-testing (read-only state inspection).
window.__sizzle = { state, input };

if (shot) {
  applyShot(state, shot, seed);
}

let last = performance.now();

function frame(now) {
  const dt = (now - last) / 1000;
  last = now;

  if (input.startPressed) {
    input.startPressed = false;
    unlockAudio();
    if (state.screen !== 'playing') startShift(state);
  }
  if (input.mutePressed) {
    input.mutePressed = false;
    toggleMute();
  }
  if (input.click && state.screen === 'title') {
    const { x, y } = input.click;
    input.click = null;
    if (x >= 490 && x <= 790 && y >= 440 && y <= 496) {
      unlockAudio();
      startShift(state);
    }
  }
  if (input.click && state.screen === 'over') {
    const { x, y } = input.click;
    input.click = null;
    if (x >= 490 && x <= 790 && y >= 478 && y <= 530) {
      unlockAudio();
      startShift(state);
    }
  }

  update(state, input, dt);
  render(ctx, state, input);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

// Keep the tab title honest about the mute state.
document.addEventListener('keydown', (event) => {
  if (event.code === 'KeyM') {
    document.title = isMuted() ? 'Sizzle Rush (muted)' : 'Sizzle Rush';
  }
});
