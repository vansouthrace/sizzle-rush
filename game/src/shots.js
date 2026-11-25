// Screenshot presets: ?shot=start|play|end&seed=N opens the game in a fixed,
// fully rendered state so the maker's screenshots are real renders of the
// game's own code. In shot mode the simulation is paused after the preset
// is applied, so the frame never drifts while the screenshot is taken.

import { newGame, startShift } from './world.js';
import { makeTicket } from './orders.js';
import { GRILL_SECONDS } from './config.js';

export function applyShot(state, shot, seed) {
  if (shot === 'start') {
    state.screen = 'title';
    state.paused = true;
    return;
  }

  if (shot === 'end') {
    startShift(state);
    state.elapsed = 150;
    state.timeLeft = 0;
    state.score = 1240;
    state.coins = 148;
    state.served = 11;
    state.missed = 3;
    state.combo = 0;
    state.bestCombo = 4;
    state.screen = 'over';
    state.overReason = 'Time! The lunch rush is over.';
    state.rating = 3;
    state.paused = true;
    return;
  }

  // shot=play (and the default): a shift mid-rush — two tickets on the
  // board, a patty half-grilled, a dish mid-assembly on the plate, the chef
  // holding a tomato beside it, timer running.
  startShift(state);
  state.elapsed = 63;
  state.timeLeft = 87;
  state.score = 320;
  state.coins = 42;
  state.served = 3;
  state.missed = 0;
  state.combo = 2;
  state.bestCombo = 2;
  state.tickets = [
    { id: 7, name: 'Classic Stack', needs: ['bun', 'patty', 'lettuce', 'tomato'], bornAt: 40, expiresAt: 85, warned: false },
    { id: 8, name: 'Cheesy Melt', needs: ['bun', 'patty', 'cheese', 'cheese'], bornAt: 52, expiresAt: 97, warned: false },
  ];
  state.grill = [{ kind: 'patty', cooked: GRILL_SECONDS / 2, burnt: false }];
  state.plate = ['bun', 'patty', 'cheese', 'cheese'];
  state.carrying = 'tomato';
  state.chef.x = 860;
  state.chef.y = 585;
  state.chef.facing = -1;
  state.message = { text: 'Cheesy Melt is READY — carry it to the window!', until: 999 };
  state.messageKind = 'good';
  state.paused = true;
}

export function shotFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return {
    shot: params.get('shot') || null,
    seed: Number(params.get('seed') || 1) || 1,
  };
}
