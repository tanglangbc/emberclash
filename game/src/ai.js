// ai.js — the Ash Warden's brain. Readable and counterable: it shows its
// intent, then plays greedily by a simple score. It prefers lethal damage,
// heals and blocks when hurt, and otherwise spends its energy on the best
// damage-per-energy it holds.
import { CARD_DEFS } from './cards.js';

function cardValue(state, card, forEnemy) {
  const def = CARD_DEFS[card.defId];
  const me = state.enemy;
  const foe = state.player;
  let v = 0;
  for (const fx of def.effects) {
    if (fx.kind === 'damage') {
      v += fx.n * 1.15;
      if (foe.hp - fx.n <= 0) v += 100; // lethal
      if (foe.hp <= 8) v += 6; // smell blood
    } else if (fx.kind === 'block') {
      v += me.hp < 15 ? fx.n * 1.1 : fx.n * 0.55;
    } else if (fx.kind === 'heal') {
      const missing = me.maxHp - me.hp;
      v += missing <= 0 ? 0 : Math.min(fx.n, missing) * (me.hp < 12 ? 1.3 : 0.8);
    } else if (fx.kind === 'draw') {
      v += fx.n * 2.5;
    } else if (fx.kind === 'burn') {
      v += fx.n * 3;
    } else if (fx.kind === 'energy') {
      v += fx.n * 3;
    }
  }
  // Surge bonus: chaining a suit it already played this turn is worth more.
  if (me.playedSuits.includes(def.suit)) v += 3;
  return v / Math.max(1, def.cost);
}

// Pick card ids to play this enemy turn, in order. Ids, not indexes: the
// hand shifts as cards leave it, so the engine looks each one up fresh.
export function chooseEnemyPlays(state) {
  const me = state.enemy;
  const picks = [];
  let energy = me.energy;
  const hand = me.hand.slice();
  // Greedy: repeatedly take the best value-per-energy card we can afford.
  for (let round = 0; round < 4; round++) {
    let best = -1;
    let bestScore = 0;
    for (let i = 0; i < hand.length; i++) {
      const card = hand[i];
      if (!card || CARD_DEFS[card.defId].cost > energy) continue;
      const score = cardValue(state, card, true);
      if (score > bestScore) { bestScore = score; best = i; }
    }
    if (best < 0) break;
    picks.push(hand[best].id);
    energy -= CARD_DEFS[hand[best].defId].cost;
    hand.splice(best, 1);
    // The surge from a played card changes later values; stop when the
    // remaining cards are all poor value.
    if (bestScore < 1.5 && round >= 1) break;
  }
  return picks;
}

// The intent the player sees during their turn: the single card the Warden
// most wants to play next, described in plain words.
export function describeIntent(state) {
  const me = state.enemy;
  if (me.hand.length === 0) return 'is out of cards';
  let best = null;
  let bestScore = -1;
  for (const card of me.hand) {
    const score = cardValue(state, card, true);
    if (score > bestScore) { bestScore = score; best = card; }
  }
  if (!best) return 'is biding its time';
  const def = CARD_DEFS[best.defId];
  const main = def.effects[0];
  if (main.kind === 'damage') return `plans: ${def.name} — ${main.n} damage`;
  if (main.kind === 'block') return `plans: ${def.name} — ${main.n} Block`;
  if (main.kind === 'heal') return `plans: ${def.name} — heal ${main.n}`;
  if (main.kind === 'draw') return `plans: ${def.name} — draw ${main.n}`;
  return `plans: ${def.name}`;
}
