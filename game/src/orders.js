// Order tickets: what the order board shows, how new orders arrive, and
// how a finished plate is matched against an open ticket.

import { MENU, MAX_TICKETS, TICKET_SECONDS } from './config.js';
import { pick } from './random.js';

let ticketSeq = 0;

export function makeTicket(rng, now) {
  ticketSeq += 1;
  const dish = pick(rng, MENU);
  return {
    id: ticketSeq,
    name: dish.name,
    needs: dish.needs.slice(),
    bornAt: now,
    expiresAt: now + TICKET_SECONDS,
    warned: false,
  };
}

// Count how many of each ingredient a list holds, so a plate and a ticket
// can be compared as multisets (two cheeses are not one cheese).
export function countOf(list) {
  const counts = {};
  for (const item of list) counts[item] = (counts[item] || 0) + 1;
  return counts;
}

export function plateMatchesTicket(plate, ticket) {
  if (plate.length !== ticket.needs.length) return false;
  const a = countOf(plate);
  const b = countOf(ticket.needs);
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) if ((a[key] || 0) !== (b[key] || 0)) return false;
  return true;
}

// Which open ticket, if any, does this plate finish? The oldest match wins.
export function matchingTicket(plate, tickets) {
  for (const ticket of tickets) {
    if (plateMatchesTicket(plate, ticket)) return ticket;
  }
  return null;
}

// Spawn a new ticket when the board has room and the spawn clock says so.
// Returns the ticket or null.
export function maybeSpawnTicket(state, rng) {
  if (state.tickets.length >= MAX_TICKETS) return null;
  if (state.elapsed < state.nextOrderAt) return null;
  const ticket = makeTicket(rng, state.elapsed);
  state.tickets.push(ticket);
  state.nextOrderAt = state.elapsed + 12;
  return ticket;
}

// Drop expired tickets; returns the ones that expired this update.
export function expireTickets(state) {
  const expired = [];
  state.tickets = state.tickets.filter((ticket) => {
    if (state.elapsed >= ticket.expiresAt) {
      expired.push(ticket);
      return false;
    }
    return true;
  });
  return expired;
}
