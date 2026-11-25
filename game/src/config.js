// Sizzle Rush — kitchen configuration: canvas size, stations, menu and rules.
// Every tunable number of the game lives here so the other files stay logic-only.

export const CANVAS_W = 1280;
export const CANVAS_H = 720;

export const SHIFT_SECONDS = 150;
export const MAX_TICKETS = 3;
export const TICKET_SECONDS = 45;
export const ORDER_EVERY_SECONDS = 12;
export const GRILL_SECONDS = 5;
export const BURN_AFTER_SECONDS = 13;
export const GRILL_SLOTS = 2;

export const CHEF_SPEED = 300; // px per second
export const CHEF_RADIUS = 26;

// Ingredient kinds. A patty is raw until it has spent GRILL_SECONDS on the grill.
export const INGREDIENTS = {
  bun: { label: 'BUN', color: '#e8b25c', dark: '#b97f2e' },
  patty: { label: 'PATTY', color: '#8a5a2b', dark: '#5e3a17' },
  lettuce: { label: 'LETTUCE', color: '#5fbf4a', dark: '#3a8a2c' },
  tomato: { label: 'TOMATO', color: '#e5484d', dark: '#a92a2e' },
  cheese: { label: 'CHEESE', color: '#f5c542', dark: '#c99a1e' },
  sauce: { label: 'SAUCE', color: '#f08a1d', dark: '#b35f0a' },
};

// The menu: each dish is a name plus the multiset of ingredients it needs.
export const MENU = [
  { name: 'Classic Stack', needs: ['bun', 'patty', 'lettuce', 'tomato'] },
  { name: 'Cheesy Melt', needs: ['bun', 'patty', 'cheese', 'cheese'] },
  { name: 'Garden Fresh', needs: ['bun', 'lettuce', 'tomato', 'cheese', 'sauce'] },
  { name: 'Double Trouble', needs: ['bun', 'patty', 'patty', 'cheese', 'sauce'] },
  { name: 'Saucy Star', needs: ['bun', 'patty', 'sauce', 'lettuce'] },
  { name: 'Sunny Side', needs: ['bun', 'patty', 'tomato', 'tomato', 'cheese'] },
];

// Stations on the kitchen floor. Bins hand out one ingredient per interact;
// the grill cooks raw patties; the plate is where a dish is assembled;
// the window is where a finished plate is served; the trash clears a hand
// or a burnt patty.
export const STATIONS = [
  { id: 'bun', kind: 'bin', ingredient: 'bun', x: 36, y: 196, w: 118, h: 92 },
  { id: 'patty', kind: 'bin', ingredient: 'patty', x: 166, y: 196, w: 118, h: 92 },
  { id: 'lettuce', kind: 'bin', ingredient: 'lettuce', x: 296, y: 196, w: 118, h: 92 },
  { id: 'tomato', kind: 'bin', ingredient: 'tomato', x: 426, y: 196, w: 118, h: 92 },
  { id: 'cheese', kind: 'bin', ingredient: 'cheese', x: 556, y: 196, w: 118, h: 92 },
  { id: 'sauce', kind: 'bin', ingredient: 'sauce', x: 686, y: 196, w: 118, h: 92 },
  { id: 'grill', kind: 'grill', x: 836, y: 190, w: 210, h: 104 },
  { id: 'trash', kind: 'trash', x: 1078, y: 190, w: 166, h: 104 },
  { id: 'plate', kind: 'plate', x: 470, y: 380, w: 340, h: 150 },
  { id: 'window', kind: 'window', x: 900, y: 380, w: 344, h: 180 },
];

// Walkable floor (the chef is clamped to this rectangle).
export const FLOOR = { x: 24, y: 308, w: 1232, h: 316 };

export const COLORS = {
  wall: '#3d2b1f',
  floor: '#c98f5f',
  floorTile: '#bd8252',
  counter: '#6b4a2f',
  counterTop: '#8a5f3c',
  header: '#2b1d12',
  board: '#f7ead2',
  ticket: '#fff8e7',
  ticketEdge: '#d9b380',
  plate: '#f4f1ea',
  grill: '#4a4a52',
  grillHot: '#7a3b1e',
  window: '#274b63',
  text: '#2b1d12',
  cream: '#fff3d6',
  gold: '#f5c542',
  red: '#e5484d',
  green: '#4caf50',
};
