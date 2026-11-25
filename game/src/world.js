// Sizzle Rush — game state and rules: the chef, the stations, the grill,
// the assembly plate, serving, scoring and the shift timer.

import {
  CANVAS_W, CANVAS_H, SHIFT_SECONDS, GRILL_SECONDS, BURN_AFTER_SECONDS,
  GRILL_SLOTS, CHEF_SPEED, CHEF_RADIUS, STATIONS, FLOOR, INGREDIENTS,
} from './config.js';
import { makeRng } from './random.js';
import { makeTicket, maybeSpawnTicket, expireTickets, matchingTicket } from './orders.js';
import { sfx, startMusic, stopMusic } from './audio.js';
import { moveVector } from './input.js';

export function newGame(seed) {
  return {
    screen: 'title', // title | playing | over
    seed: seed || 1,
    rng: makeRng(seed || 1),
    elapsed: 0,
    timeLeft: SHIFT_SECONDS,
    nextOrderAt: 2,
    tickets: [],
    grill: [], // {kind:'patty', cooked: seconds on grill, burnt: bool}
    plate: [], // ingredient kinds stacked on the assembly plate
    chef: { x: 640, y: 560, facing: 1, walkPhase: 0, moving: false },
    carrying: null, // one ingredient kind, or 'plate' when hauling a finished plate
    score: 0,
    coins: 0,
    served: 0,
    missed: 0,
    combo: 0,
    bestCombo: 0,
    lastServeAt: -99,
    message: null, // {text, until} floating feedback
    messageKind: 'info',
    paused: false,
    overReason: '',
    rating: 0,
  };
}

export function startShift(state) {
  const fresh = newGame(state.seed);
  fresh.screen = 'playing';
  fresh.rng = state.rng;
  fresh.tickets = [makeTicket(fresh.rng, 0), makeTicket(fresh.rng, 0)];
  fresh.nextOrderAt = 12;
  Object.assign(state, fresh);
  startMusic();
}

function say(state, text, kind) {
  state.message = { text, until: state.elapsed + 1.6 };
  state.messageKind = kind || 'info';
}

function stationAt(state, x, y) {
  for (const s of STATIONS) {
    if (x >= s.x - 34 && x <= s.x + s.w + 34 && y >= s.y - 34 && y <= s.y + s.h + 34) return s;
  }
  return null;
}

// Distance from the chef to a station's FRONT edge (its bottom side, the
// side the chef stands at). The grill sits above the serving window and the
// bins sit above the plate, so measuring to the whole rectangle would pick
// the station behind the one the chef is facing; the front edge disambiguates.
function frontEdgeDistance(state, station) {
  const { x, y } = state.chef;
  const cx = Math.max(station.x, Math.min(x, station.x + station.w));
  const cy = station.y + station.h;
  return Math.hypot(x - cx, y - cy);
}

function inRangeOf(state, station) {
  return frontEdgeDistance(state, station) <= 78;
}

function nearestStation(state) {
  let best = null;
  let bestD = Infinity;
  for (const s of STATIONS) {
    const d = frontEdgeDistance(state, s);
    if (d < bestD) { bestD = d; best = s; }
  }
  return bestD <= 78 ? best : null;
}

function interact(state, station) {
  if (!station) return;
  const chef = state.chef;

  if (station.kind === 'bin') {
    if (state.carrying) { sfx.error(); say(state, 'Hands full! Serve or trash it first.', 'bad'); return; }
    state.carrying = station.ingredient;
    sfx.pickup();
    say(state, `${INGREDIENTS[station.ingredient].label} in hand`, 'info');
    return;
  }

  if (station.kind === 'grill') {
    if (state.carrying === 'patty') {
      if (state.grill.length >= GRILL_SLOTS) { sfx.error(); say(state, 'Grill is full!', 'bad'); return; }
      state.grill.push({ kind: 'patty', cooked: 0, burnt: false });
      state.carrying = null;
      sfx.sizzle();
      say(state, 'Patty on the grill…', 'info');
      return;
    }
    const ready = state.grill.findIndex((p) => !p.burnt && p.cooked >= GRILL_SECONDS);
    if (ready >= 0 && !state.carrying) {
      state.grill.splice(ready, 1);
      state.carrying = 'patty';
      sfx.pickup();
      say(state, 'Cooked patty in hand', 'info');
      return;
    }
    const burnt = state.grill.findIndex((p) => p.burnt);
    if (burnt >= 0 && !state.carrying) {
      state.grill.splice(burnt, 1);
      sfx.burn();
      say(state, 'Burnt patty tossed', 'bad');
      return;
    }
    sfx.error();
    say(state, 'Grill needs a raw patty — or a cooked one to pick up', 'bad');
    return;
  }

  if (station.kind === 'trash') {
    if (state.carrying) {
      state.carrying = null;
      sfx.place();
      say(state, 'Tossed it', 'info');
    } else if (state.plate.length) {
      state.plate = [];
      sfx.place();
      say(state, 'Plate cleared', 'info');
    } else {
      sfx.error();
    }
    return;
  }

  if (station.kind === 'plate') {
    if (state.carrying === 'plate') {
      // Putting a finished plate back down (should not normally happen).
      state.carrying = null;
      sfx.place();
      return;
    }
    if (state.carrying) {
      state.plate.push(state.carrying);
      state.carrying = null;
      sfx.place();
      const match = matchingTicket(state.plate, state.tickets);
      if (match) say(state, `${match.name} is READY — carry it to the window!`, 'good');
      return;
    }
    const match = matchingTicket(state.plate, state.tickets);
    if (match && state.plate.length) {
      state.carrying = 'plate';
      state.servingTicketId = match.id;
      state.plate = [];
      sfx.pickup();
      say(state, 'Plate in hand — serve it at the window!', 'good');
      return;
    }
    if (state.plate.length) {
      sfx.error();
      say(state, 'That plate does not match any ticket yet', 'bad');
    } else {
      sfx.error();
      say(state, 'Plate is empty — add ingredients', 'bad');
    }
    return;
  }

  if (station.kind === 'window') {
    if (state.carrying !== 'plate') {
      sfx.error();
      say(state, 'Bring a finished plate to the window', 'bad');
      return;
    }
    serveWithTicket(state);
  }
}

function servePlate(state) {
  state.carrying = null;
  state.served += 1;
  const now = state.elapsed;
  const quick = now - state.lastServeAt <= 12;
  state.combo = quick ? state.combo + 1 : 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.lastServeAt = now;
  const base = 100;
  const comboBonus = (state.combo - 1) * 25;
  const earned = base + comboBonus;
  state.score += earned;
  state.coins += 10 + (state.combo - 1) * 2;
  sfx.ding();
  sfx.coin();
  say(state, `Served! +${earned} pts${state.combo > 1 ? ` (combo x${state.combo})` : ''}`, 'good');
}

// The plate remembers which ticket it was built for, so serving removes
// exactly that ticket. Kept on the state, set when a plate becomes ready.
function refreshReadyTicket(state) {
  const match = matchingTicket(state.plate, state.tickets);
  state.readyTicketId = match ? match.id : null;
}

export function update(state, input, dt) {
  if (state.screen !== 'playing' || state.paused) return;
  dt = Math.min(dt, 0.05);
  state.elapsed += dt;
  state.timeLeft = Math.max(0, SHIFT_SECONDS - state.elapsed);

  // Shift over.
  if (state.timeLeft <= 0) {
    endShift(state, 'Time! The lunch rush is over.');
    return;
  }

  // Orders.
  maybeSpawnTicket(state, state.rng);
  const expired = expireTickets(state);
  for (const ticket of expired) {
    state.missed += 1;
    state.combo = 0;
    sfx.error();
    say(state, `${ticket.name} walked out — ticket expired!`, 'bad');
  }
  for (const ticket of state.tickets) {
    if (!ticket.warned && ticket.expiresAt - state.elapsed <= 10) {
      ticket.warned = true;
      sfx.tick();
    }
  }

  // Grill cooks (and burns).
  for (const patty of state.grill) {
    patty.cooked += dt;
    if (!patty.burnt && patty.cooked >= BURN_AFTER_SECONDS) {
      patty.burnt = true;
      sfx.burn();
      say(state, 'A patty burnt on the grill!', 'bad');
    }
  }

  refreshReadyTicket(state);

  // Chef movement: keys win over a click target.
  const chef = state.chef;
  const vec = moveVector(input);
  chef.moving = false;
  if (vec) {
    input.moveTarget = null;
    chef.x += vec.x * CHEF_SPEED * dt;
    chef.y += vec.y * CHEF_SPEED * dt;
    chef.facing = vec.x !== 0 ? Math.sign(vec.x) : chef.facing;
    chef.walkPhase += dt * 10;
    chef.moving = true;
  } else if (input.moveTarget) {
    const dx = input.moveTarget.x - chef.x;
    const dy = input.moveTarget.y - chef.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 8) {
      input.moveTarget = null;
      if (input.moveTargetStation) {
        // The chef walked to this station's front on purpose: use it, not
        // whichever station happens to be nearest now.
        const station = input.moveTargetStation;
        input.moveTargetStation = null;
        if (inRangeOf(state, station)) interact(state, station);
      }
    } else {
      chef.x += (dx / dist) * CHEF_SPEED * dt;
      chef.y += (dy / dist) * CHEF_SPEED * dt;
      chef.facing = dx !== 0 ? Math.sign(dx) : chef.facing;
      chef.walkPhase += dt * 10;
      chef.moving = true;
    }
  }

  // Clamp the chef to the floor.
  chef.x = Math.max(FLOOR.x + CHEF_RADIUS, Math.min(FLOOR.x + FLOOR.w - CHEF_RADIUS, chef.x));
  chef.y = Math.max(FLOOR.y + CHEF_RADIUS, Math.min(FLOOR.y + FLOOR.h - CHEF_RADIUS, chef.y));

  // Mouse click: walk to a station, or set a floor target.
  if (input.click) {
    const { x, y } = input.click;
    input.click = null;
    const station = stationAt(state, x, y);
    if (station) {
      const cx = station.x + station.w / 2;
      const cy = Math.min(station.y + station.h + 44, FLOOR.y + FLOOR.h - 10);
      input.moveTarget = { x: cx, y: Math.max(cy, FLOOR.y + 30) };
      input.moveTargetStation = station;
      if (inRangeOf(state, station)) {
        input.moveTarget = null;
        input.moveTargetStation = null;
        interact(state, station);
      }
    } else if (y >= FLOOR.y && y <= FLOOR.y + FLOOR.h) {
      input.moveTarget = { x, y };
      input.moveTargetStation = null;
    }
  }

  // Keyboard interact.
  if (input.interactPressed) {
    input.interactPressed = false;
    const station = nearestStation(state);
    if (station) interact(state, station);
  }
}

function endShift(state, reason) {
  state.screen = 'over';
  state.overReason = reason;
  const total = state.served + state.missed;
  const rate = total === 0 ? 0 : state.served / total;
  state.rating = state.served >= 12 && rate >= 0.8 ? 3 : state.served >= 7 && rate >= 0.6 ? 2 : state.served >= 3 ? 1 : 0;
  stopMusic();
  sfx.ding();
}

// Serve with ticket removal: called from interact() via the window; the
// ticket is the one the plate matched when it was picked up.
export function serveWithTicket(state) {
  if (state.servingTicketId != null) {
    state.tickets = state.tickets.filter((t) => t.id !== state.servingTicketId);
    state.servingTicketId = null;
  }
  servePlate(state);
}
