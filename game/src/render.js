// Sizzle Rush — every pixel the player sees: header, order board, kitchen
// floor, stations, the chef, and the title / game-over screens. All art is
// drawn with canvas shapes; there are no image files.

import {
  CANVAS_W, CANVAS_H, SHIFT_SECONDS, GRILL_SECONDS, BURN_AFTER_SECONDS,
  STATIONS, FLOOR, COLORS, INGREDIENTS,
} from './config.js';
import { matchingTicket } from './orders.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align, weight) {
  ctx.fillStyle = color || COLORS.text;
  ctx.font = `${weight || 700} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function fmtTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// One ingredient drawn as a little canvas icon, centred at (x, y), size s.
export function drawIngredient(ctx, kind, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  if (kind === 'bun') {
    ctx.fillStyle = INGREDIENTS.bun.color;
    roundRect(ctx, -s * 0.55, -s * 0.28, s * 1.1, s * 0.56, s * 0.22);
    ctx.fill();
    ctx.fillStyle = '#fff2cf';
    for (const [dx, dy] of [[-0.3, -0.08], [0, 0.08], [0.3, -0.06]]) {
      ctx.beginPath();
      ctx.ellipse(dx * s, dy * s, s * 0.07, s * 0.045, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'patty') {
    ctx.fillStyle = INGREDIENTS.patty.color;
    roundRect(ctx, -s * 0.55, -s * 0.2, s * 1.1, s * 0.4, s * 0.14);
    ctx.fill();
    ctx.fillStyle = INGREDIENTS.patty.dark;
    for (const [dx, dy] of [[-0.32, 0], [0.05, -0.06], [0.34, 0.05]]) {
      ctx.beginPath();
      ctx.arc(dx * s, dy * s, s * 0.05, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'lettuce') {
    ctx.fillStyle = INGREDIENTS.lettuce.color;
    ctx.beginPath();
    for (let i = 0; i <= 8; i += 1) {
      const px = -s * 0.55 + (i / 8) * s * 1.1;
      const py = (i % 2 === 0 ? -0.16 : 0.16) * s;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.lineTo(s * 0.55, s * 0.18);
    ctx.lineTo(-s * 0.55, s * 0.18);
    ctx.closePath();
    ctx.fill();
  } else if (kind === 'tomato') {
    ctx.fillStyle = INGREDIENTS.tomato.color;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff8a8a';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = INGREDIENTS.tomato.dark;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.07, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'cheese') {
    ctx.fillStyle = INGREDIENTS.cheese.color;
    ctx.beginPath();
    ctx.moveTo(-s * 0.5, -s * 0.3);
    ctx.lineTo(s * 0.5, -s * 0.3);
    ctx.lineTo(0, s * 0.38);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = INGREDIENTS.cheese.dark;
    for (const [dx, dy] of [[-0.2, -0.05], [0.18, 0.02]]) {
      ctx.beginPath();
      ctx.arc(dx * s, dy * s, s * 0.05, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'sauce') {
    ctx.strokeStyle = INGREDIENTS.sauce.color;
    ctx.lineWidth = s * 0.14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-s * 0.45, -s * 0.1);
    ctx.quadraticCurveTo(-s * 0.15, s * 0.25, s * 0.1, -s * 0.08);
    ctx.quadraticCurveTo(s * 0.3, -s * 0.3, s * 0.48, 0);
    ctx.stroke();
  }
  ctx.restore();
}

// A finished (or half-built) dish stacked on a plate, drawn from the side.
function drawPlateStack(ctx, items, x, y, s) {
  // Plate.
  ctx.fillStyle = COLORS.plate;
  ctx.beginPath();
  ctx.ellipse(x, y, s * 0.62, s * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#cfc9bb';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Stack the ingredients bottom-up, each a thin layer.
  let top = y - s * 0.1;
  for (const kind of items) {
    top -= s * 0.16;
    drawIngredient(ctx, kind, x, top, s * 0.9);
  }
  return top;
}

function drawHeader(ctx, state) {
  ctx.fillStyle = COLORS.header;
  ctx.fillRect(0, 0, CANVAS_W, 56);
  text(ctx, '🍔 SIZZLE RUSH', 24, 30, 26, COLORS.gold, 'left', 800);
  text(ctx, 'the lunch-rush kitchen game', 268, 32, 14, '#c9a86a', 'left', 600);
  const urgent = state.screen === 'playing' && state.timeLeft <= 30;
  text(ctx, `⏱ ${fmtTime(state.timeLeft)}`, 640, 30, 28, urgent ? COLORS.red : COLORS.cream, 'center', 800);
  text(ctx, `SCORE ${state.score}`, 1010, 24, 18, COLORS.cream, 'right', 800);
  text(ctx, `🪙 ${state.coins}   SERVED ${state.served}   COMBO x${Math.max(1, state.combo)}`, 1256, 44, 14, '#c9a86a', 'right', 600);
}

function drawBoard(ctx, state) {
  ctx.fillStyle = COLORS.board;
  ctx.fillRect(0, 56, CANVAS_W, 128);
  text(ctx, 'ORDER BOARD', 24, 78, 15, '#8a6a3f', 'left', 800);
  if (!state.tickets.length) {
    text(ctx, 'No orders yet — the rush is coming…', 24, 128, 18, '#8a6a3f', 'left', 600);
    return;
  }
  state.tickets.forEach((ticket, i) => {
    const x = 24 + i * 408;
    const y = 66;
    const w = 392;
    const h = 108;
    const remain = Math.max(0, ticket.expiresAt - state.elapsed);
    const urgent = remain <= 10;
    ctx.fillStyle = COLORS.ticket;
    roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.strokeStyle = urgent ? COLORS.red : COLORS.ticketEdge;
    ctx.lineWidth = urgent ? 3 : 2;
    ctx.stroke();
    text(ctx, `#${ticket.id}  ${ticket.name}`, x + 14, y + 22, 19, COLORS.text, 'left', 800);
    ticket.needs.forEach((kind, j) => drawIngredient(ctx, kind, x + 30 + j * 44, y + 58, 30));
    // Countdown bar.
    const frac = remain / 45;
    ctx.fillStyle = '#e8dcc2';
    roundRect(ctx, x + 14, y + 86, w - 28, 10, 5);
    ctx.fill();
    ctx.fillStyle = urgent ? COLORS.red : (frac > 0.5 ? COLORS.green : '#e8a13c');
    if (frac > 0) {
      roundRect(ctx, x + 14, y + 86, (w - 28) * frac, 10, 5);
      ctx.fill();
    }
    text(ctx, `${Math.ceil(remain)}s`, x + w - 14, y + 22, 15, urgent ? COLORS.red : '#8a6a3f', 'right', 800);
  });
}

function drawStation(ctx, station, state, highlight) {
  const { x, y, w, h } = station;
  ctx.save();
  if (highlight) {
    ctx.shadowColor = COLORS.gold;
    ctx.shadowBlur = 18;
  }
  if (station.kind === 'bin') {
    ctx.fillStyle = COLORS.counter;
    roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.fillStyle = COLORS.counterTop;
    roundRect(ctx, x, y, w, 16, 8);
    ctx.fill();
    drawIngredient(ctx, station.ingredient, x + w / 2, y + 40, 44);
    text(ctx, station.ingredient.toUpperCase(), x + w / 2, y + 76, 13, COLORS.cream, 'center', 800);
  } else if (station.kind === 'grill') {
    ctx.fillStyle = COLORS.grill;
    roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.strokeStyle = '#2c2c33';
    ctx.lineWidth = 3;
    for (let i = 1; i < 5; i += 1) {
      ctx.beginPath();
      ctx.moveTo(x + 12, y + (i * h) / 5);
      ctx.lineTo(x + w - 12, y + (i * h) / 5);
      ctx.stroke();
    }
    state.grill.forEach((patty, i) => {
      const px = x + 52 + i * 100;
      const py = y + 46;
      const frac = Math.min(1, patty.cooked / GRILL_SECONDS);
      ctx.fillStyle = patty.burnt ? '#1c1c1c' : '#8a5a2b';
      roundRect(ctx, px - 38, py - 14, 76, 28, 10);
      ctx.fill();
      ctx.fillStyle = patty.burnt ? COLORS.red : COLORS.gold;
      roundRect(ctx, px - 38, py + 20, 76 * frac, 6, 3);
      ctx.fill();
      if (patty.burnt) text(ctx, 'BURNT!', px, py - 26, 12, COLORS.red, 'center', 800);
      else if (frac >= 1) text(ctx, 'READY', px, py - 26, 12, COLORS.gold, 'center', 800);
    });
    text(ctx, 'GRILL', x + w / 2, y + h - 12, 13, '#cfc9bb', 'center', 800);
  } else if (station.kind === 'trash') {
    ctx.fillStyle = '#5a3a3a';
    roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    text(ctx, '🗑', x + w / 2, y + 38, 30, COLORS.cream, 'center', 400);
    text(ctx, 'TRASH', x + w / 2, y + 78, 13, COLORS.cream, 'center', 800);
  } else if (station.kind === 'plate') {
    const match = matchingTicket(state.plate, state.tickets);
    ctx.fillStyle = match ? '#3f6b34' : COLORS.counter;
    roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
    if (state.plate.length) {
      drawPlateStack(ctx, state.plate, x + w / 2, y + h - 34, 62);
    } else {
      ctx.fillStyle = COLORS.plate;
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h - 34, 62, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, 'empty plate', x + w / 2, y + 46, 14, '#c9a86a', 'center', 600);
    }
    text(ctx, match ? '✓ READY TO SERVE' : 'ASSEMBLY PLATE', x + w / 2, y + 20, 14, match ? COLORS.gold : COLORS.cream, 'center', 800);
    if (match) text(ctx, match.name, x + w / 2, y + 40, 13, COLORS.gold, 'center', 600);
  } else if (station.kind === 'window') {
    ctx.fillStyle = COLORS.window;
    roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.fillStyle = '#1d3849';
    roundRect(ctx, x + 14, y + 14, w - 28, 78, 8);
    ctx.fill();
    text(ctx, '🔔', x + w / 2, y + 52, 30, COLORS.gold, 'center', 400);
    text(ctx, 'SERVING WINDOW', x + w / 2, y + 116, 16, COLORS.cream, 'center', 800);
    text(ctx, 'bring the finished plate here', x + w / 2, y + 142, 13, '#9fc3d8', 'center', 600);
  }
  ctx.restore();
}

function drawChef(ctx, state) {
  const { x, y, facing, walkPhase, moving } = state.chef;
  const bob = moving ? Math.sin(walkPhase) * 3 : 0;
  ctx.save();
  ctx.translate(x, y + bob);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 26 - bob, 26, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body (white apron).
  ctx.fillStyle = '#f7f3ea';
  roundRect(ctx, -22, -8, 44, 36, 12);
  ctx.fill();
  ctx.fillStyle = '#e5484d';
  ctx.fillRect(-22, 8, 44, 6);
  // Head.
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath();
  ctx.arc(0, -22, 17, 0, Math.PI * 2);
  ctx.fill();
  // Chef hat.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-10, -36, 9, 0, Math.PI * 2);
  ctx.arc(0, -40, 11, 0, Math.PI * 2);
  ctx.arc(10, -36, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-16, -38, 32, 8);
  // Eyes look the way the chef faces.
  ctx.fillStyle = '#2b1d12';
  ctx.beginPath();
  ctx.arc(-6 + facing * 2, -22, 2.4, 0, Math.PI * 2);
  ctx.arc(6 + facing * 2, -22, 2.4, 0, Math.PI * 2);
  ctx.fill();
  // Carried item above the hat.
  if (state.carrying) {
    ctx.fillStyle = 'rgba(255,243,214,0.95)';
    roundRect(ctx, -34, -92, 68, 34, 8);
    ctx.fill();
    if (state.carrying === 'plate') {
      drawPlateStack(ctx, ['bun', 'patty', 'cheese'], 0, -66, 26);
      text(ctx, 'PLATE', 0, -84, 9, COLORS.text, 'center', 800);
    } else {
      drawIngredient(ctx, state.carrying, 0, -75, 26);
    }
  }
  ctx.restore();
}

function drawFloor(ctx, state) {
  // Floor tiles.
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, 184, CANVAS_W, CANVAS_H - 184);
  ctx.fillStyle = COLORS.floorTile;
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      if ((row + col) % 2 === 0) ctx.fillRect(24 + col * 156, 308 + row * 80, 150, 74);
    }
  }
  // Counter strip behind the bins.
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 184, CANVAS_W, 12);
}

function drawBottomBar(ctx, state, input) {
  ctx.fillStyle = COLORS.header;
  ctx.fillRect(0, 640, CANVAS_W, 80);
  const hint = state.screen === 'playing'
    ? 'WASD / arrows or click to walk  •  E or click a station to use it  •  grill the patty, stack the plate, serve at the window  •  M mute'
    : 'Press ENTER or click START to play';
  text(ctx, hint, 24, 668, 15, '#c9a86a', 'left', 600);
  if (state.message && state.elapsed < state.message.until) {
    const color = state.messageKind === 'good' ? '#8be28b' : state.messageKind === 'bad' ? '#ff9a9a' : COLORS.cream;
    text(ctx, state.message.text, 640, 700, 17, color, 'center', 800);
  }
}

function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(43,29,18,0.72)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = COLORS.board;
  roundRect(ctx, 290, 150, 700, 400, 18);
  ctx.fill();
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 4;
  ctx.stroke();
  text(ctx, '🍔', 640, 210, 64, COLORS.text, 'center', 400);
  text(ctx, 'SIZZLE RUSH', 640, 272, 46, COLORS.text, 'center', 800);
  text(ctx, 'the lunch-rush kitchen game', 640, 312, 19, '#8a6a3f', 'center', 600);
  text(ctx, 'Tickets fly in on the order board. Grab ingredients,', 640, 356, 17, COLORS.text, 'center', 600);
  text(ctx, 'grill the patty, stack the plate — and serve it', 640, 382, 17, COLORS.text, 'center', 600);
  text(ctx, 'at the window before the ticket runs out!', 640, 408, 17, COLORS.text, 'center', 600);
  ctx.fillStyle = COLORS.red;
  roundRect(ctx, 490, 440, 300, 56, 12);
  ctx.fill();
  text(ctx, '▶  START SHIFT  (Enter)', 640, 469, 19, '#ffffff', 'center', 800);
  text(ctx, 'WASD / arrows or click to walk  •  E to use a station', 640, 522, 14, '#8a6a3f', 'center', 600);
}

function drawGameOver(ctx, state) {
  ctx.fillStyle = 'rgba(43,29,18,0.78)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = COLORS.board;
  roundRect(ctx, 340, 140, 600, 420, 18);
  ctx.fill();
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 4;
  ctx.stroke();
  text(ctx, 'SHIFT OVER!', 640, 196, 40, COLORS.text, 'center', 800);
  text(ctx, state.overReason, 640, 236, 17, '#8a6a3f', 'center', 600);
  const stars = '★'.repeat(state.rating) + '☆'.repeat(3 - state.rating);
  text(ctx, stars, 640, 286, 40, COLORS.gold, 'center', 400);
  text(ctx, `Dishes served:  ${state.served}`, 640, 342, 20, COLORS.text, 'center', 700);
  text(ctx, `Tickets missed:  ${state.missed}`, 640, 372, 20, COLORS.text, 'center', 700);
  text(ctx, `Best combo:  x${state.bestCombo}      Coins earned:  🪙 ${state.coins}`, 640, 402, 20, COLORS.text, 'center', 700);
  text(ctx, `FINAL SCORE:  ${state.score}`, 640, 446, 24, COLORS.red, 'center', 800);
  ctx.fillStyle = COLORS.red;
  roundRect(ctx, 490, 478, 300, 52, 12);
  ctx.fill();
  text(ctx, '↻  PLAY AGAIN  (Enter)', 640, 505, 18, '#ffffff', 'center', 800);
}

export function render(ctx, state, input) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  drawHeader(ctx, state);
  drawBoard(ctx, state);
  drawFloor(ctx, state);
  for (const station of STATIONS) drawStation(ctx, station, state, false);
  if (state.screen !== 'title') drawChef(ctx, state);
  drawBottomBar(ctx, state, input);
  if (state.screen === 'title') drawTitle(ctx, state);
  if (state.screen === 'over') drawGameOver(ctx, state);
}
