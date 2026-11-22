// engine.js — pure turn-based duel rules. No DOM, no I/O: the whole game
// state machine lives here so it can be unit-tested in Node.
//
// SURGE: playing a second card of a suit you already played this turn
// boosts it (+2 damage/block/heal, +1 draw/burn/energy). That is the
// decision at the heart of every hand: chain one suit, or spread out.
import { buildDeck, CARD_DEFS } from './cards.js';
import { mulberry32, shuffle } from './random.js';

export const MAX_HP = 30;
export const HAND_SIZE = 5;
export const MAX_HAND = 7;
export const ENERGY_PER_TURN = 3;

function makeSide(name, title) {
  return {
    name, title, hp: MAX_HP, maxHp: MAX_HP, block: 0, burn: 0,
    energy: 0, deck: [], hand: [], discard: [], playedSuits: [],
  };
}

export function createGame(seed = 1) {
  const rand = mulberry32(seed);
  const state = {
    seed, rand, phase: 'title', turn: 1, winner: null,
    player: makeSide('You', 'Ember Duelist'),
    enemy: makeSide('Ash Warden', 'Ash Warden'),
    log: ['The duel begins. The Ash Warden waits.'],
    lastPlayed: null, // {by, defId, surged, text}
    stats: { damageDealt: 0, damageTaken: 0, cardsPlayed: 0, healed: 0, turns: 0 },
    score: 0,
  };
  state.player.deck = buildDeck(rand, shuffle);
  state.enemy.deck = buildDeck(rand, shuffle);
  return state;
}

export function startGame(state) {
  state.phase = 'play';
  state.turn = 1;
  drawCards(state, state.player, HAND_SIZE);
  drawCards(state, state.enemy, HAND_SIZE);
  beginPlayerTurn(state, 0); // opening hand is exactly 5; later turns draw 2
  pushLog(state, 'Turn 1 — your move. Play cards, then End Turn.');
  return state;
}

export function drawCards(state, side, n) {
  for (let i = 0; i < n; i++) {
    if (side.hand.length >= MAX_HAND) break;
    if (side.deck.length === 0) {
      if (side.discard.length === 0) break;
      side.deck = shuffle(side.discard, state.rand);
      side.discard = [];
      pushLog(state, `${side.name} reshuffle${side.name === 'You' ? '' : 's'} the discard pile.`);
    }
    side.hand.push(side.deck.pop());
  }
}

function pushLog(state, text) {
  state.log.push(text);
  if (state.log.length > 40) state.log.splice(0, state.log.length - 40);
}

function applyBurnTick(state, side) {
  if (side.burn > 0) {
    const dmg = side.burn * 2;
    side.burn -= 1;
    dealDamage(state, side === state.player ? state.enemy : state.player, side, dmg, true);
    pushLog(state, `${side.name} burn${side.name === 'You' ? '' : 's'} for ${dmg}.`);
  }
}

function beginPlayerTurn(state, draw = 2) {
  const p = state.player;
  p.block = 0;
  p.energy = ENERGY_PER_TURN;
  p.playedSuits = [];
  applyBurnTick(state, p);
  if (state.phase !== 'play') return;
  drawCards(state, p, draw);
}

function beginEnemyTurn(state) {
  const e = state.enemy;
  e.block = 0;
  e.energy = ENERGY_PER_TURN;
  e.playedSuits = [];
  applyBurnTick(state, e);
}

// Damage flows through Block first; returns HP actually lost.
export function dealDamage(state, attacker, target, amount, isBurn = false) {
  let left = amount;
  if (target.block > 0) {
    const absorbed = Math.min(target.block, left);
    target.block -= absorbed;
    left -= absorbed;
  }
  if (left > 0) {
    target.hp = Math.max(0, target.hp - left);
    if (target === state.enemy) state.stats.damageDealt += left;
    if (target === state.player) state.stats.damageTaken += left;
  }
  if (target.hp <= 0) {
    state.phase = target === state.enemy ? 'won' : 'lost';
    state.winner = target === state.enemy ? 'player' : 'enemy';
    finishGame(state);
  }
  return left;
}

function finishGame(state) {
  const p = state.player;
  state.stats.turns = state.turn;
  state.score = state.phase === 'won'
    ? p.hp * 10 + Math.max(0, 20 - state.turn) * 15 + state.stats.damageDealt
    : state.stats.damageDealt;
  pushLog(state, state.phase === 'won'
    ? `VICTORY — the Ash Warden falls. Score ${state.score}.`
    : `DEFEAT — the Ash Warden stands. Score ${state.score}.`);
}

// Resolve one card's effects. `surged` boosts the numbers.
export function resolveCard(state, actor, target, card) {
  const def = card.def;
  const surged = actor.playedSuits.includes(def.suit);
  const boost = (n) => n + (surged ? 2 : 0);
  const parts = [];
  for (const fx of def.effects) {
    if (fx.kind === 'damage') {
      const n = boost(fx.n);
      const lost = dealDamage(state, actor, target, n);
      parts.push(`deals ${n} damage${lost < n ? ` (${n - lost} blocked)` : ''}`);
    } else if (fx.kind === 'block') {
      const n = boost(fx.n);
      actor.block += n;
      parts.push(`gains ${n} Block`);
    } else if (fx.kind === 'heal') {
      const n = boost(fx.n);
      const healed = Math.min(n, actor.maxHp - actor.hp);
      actor.hp += healed;
      state.stats.healed += actor === state.player ? healed : 0;
      parts.push(`restores ${healed} HP`);
    } else if (fx.kind === 'draw') {
      const n = fx.n + (surged ? 1 : 0);
      drawCards(state, actor, n);
      parts.push(`draws ${n}`);
    } else if (fx.kind === 'burn') {
      const n = fx.n + (surged ? 1 : 0);
      target.burn += n;
      parts.push(`burns ${target.name} (${n})`);
    } else if (fx.kind === 'energy') {
      const n = fx.n + (surged ? 1 : 0);
      actor.energy += n;
      parts.push(`gains ${n} Energy`);
    }
  }
  if (!actor.playedSuits.includes(def.suit)) actor.playedSuits.push(def.suit);
  state.lastPlayed = { by: actor === state.player ? 'player' : 'enemy', defId: card.defId, surged, text: `${actor.name} played ${def.name}${surged ? ' — SURGE!' : ''}` };
  pushLog(state, `${actor.name} played ${def.name}${surged ? ' — SURGE!' : ''}: ${parts.join(', ')}.`);
  if (actor === state.player) state.stats.cardsPlayed += 1;
  return { surged, parts };
}

// Play a card from the player's hand. Returns {ok, error?}.
export function playCard(state, handIndex) {
  if (state.phase !== 'play') return { ok: false, error: 'not in play' };
  const p = state.player;
  const card = p.hand[handIndex];
  if (!card) return { ok: false, error: 'no such card' };
  if (card.def.cost > p.energy) return { ok: false, error: 'not enough energy' };
  p.energy -= card.def.cost;
  p.hand.splice(handIndex, 1);
  p.discard.push(card);
  resolveCard(state, p, state.enemy, card);
  return { ok: true };
}

// End the player's turn: the enemy acts, then a new player turn starts.
export function endPlayerTurn(state, chooseEnemyPlays) {
  if (state.phase !== 'play') return state;
  beginEnemyTurn(state);
  if (state.phase !== 'play') return state;
  const plays = chooseEnemyPlays(state); // card ids, in order
  for (const cardId of plays) {
    if (state.phase !== 'play') break;
    const e = state.enemy;
    const idx = e.hand.findIndex((c) => c.id === cardId);
    const card = e.hand[idx];
    if (!card || card.def.cost > e.energy) continue;
    e.energy -= card.def.cost;
    e.hand.splice(idx, 1);
    e.discard.push(card);
    resolveCard(state, e, state.player, card);
  }
  if (state.phase !== 'play') return state;
  drawCards(state, state.enemy, 2);
  state.turn += 1;
  beginPlayerTurn(state);
  pushLog(state, `Turn ${state.turn} — your move.`);
  return state;
}

export { CARD_DEFS };
