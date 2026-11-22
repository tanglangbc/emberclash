// cards.js — the whole card pool of EMBERCLASH. Four suits, told apart by
// colour AND shape: Ember (red, flame), Stone (slate blue, shield), Bloom
// (green, flower), Gale (violet, swirl). Every card is an original design.
export const SUITS = {
  ember: { name: 'Ember', glyph: '🔥', color: '#e2483d', dark: '#8f1d16', text: '#ffd9d4' },
  stone: { name: 'Stone', glyph: '🛡️', color: '#5b7fa6', dark: '#2c435e', text: '#d8e6f5' },
  bloom: { name: 'Bloom', glyph: '❀', color: '#3f9e57', dark: '#1e5230', text: '#d8f5de' },
  gale: { name: 'Gale', glyph: '🌀', color: '#8a5fc0', dark: '#452a6e', text: '#e9dcf7' },
};

// effect kinds: damage, block, heal, draw, burn, energy
export const CARD_DEFS = {
  'ember-strike': { name: 'Ember Strike', suit: 'ember', cost: 1, effects: [{ kind: 'damage', n: 6 }], text: 'Deal 6 damage.' },
  'ember-slash': { name: 'Ember Slash', suit: 'ember', cost: 2, effects: [{ kind: 'damage', n: 10 }], text: 'Deal 10 damage.' },
  'cinder-burst': { name: 'Cinder Burst', suit: 'ember', cost: 3, effects: [{ kind: 'damage', n: 14 }], text: 'Deal 14 damage.' },
  'ignite': { name: 'Ignite', suit: 'ember', cost: 2, effects: [{ kind: 'damage', n: 5 }, { kind: 'burn', n: 2 }], text: 'Deal 5 damage. Burn 2.' },
  'stone-wall': { name: 'Stone Wall', suit: 'stone', cost: 1, effects: [{ kind: 'block', n: 7 }], text: 'Gain 7 Block.' },
  'bulwark': { name: 'Bulwark', suit: 'stone', cost: 2, effects: [{ kind: 'block', n: 11 }], text: 'Gain 11 Block.' },
  'riposte': { name: 'Riposte', suit: 'stone', cost: 2, effects: [{ kind: 'block', n: 6 }, { kind: 'damage', n: 5 }], text: 'Gain 6 Block. Deal 5 damage.' },
  'bloom-mend': { name: 'Bloom Mend', suit: 'bloom', cost: 1, effects: [{ kind: 'heal', n: 6 }], text: 'Restore 6 HP.' },
  'lifebloom': { name: 'Lifebloom', suit: 'bloom', cost: 2, effects: [{ kind: 'heal', n: 10 }], text: 'Restore 10 HP.' },
  'thorn-gift': { name: 'Thorn Gift', suit: 'bloom', cost: 2, effects: [{ kind: 'heal', n: 5 }, { kind: 'damage', n: 5 }], text: 'Restore 5 HP. Deal 5 damage.' },
  'gale-gust': { name: 'Gale Gust', suit: 'gale', cost: 1, effects: [{ kind: 'draw', n: 2 }], text: 'Draw 2 cards.' },
  'windfall': { name: 'Windfall', suit: 'gale', cost: 2, effects: [{ kind: 'draw', n: 2 }, { kind: 'energy', n: 1 }], text: 'Draw 2 cards. Gain 1 Energy.' },
  'cyclone': { name: 'Cyclone', suit: 'gale', cost: 2, effects: [{ kind: 'damage', n: 4 }, { kind: 'draw', n: 1 }], text: 'Deal 4 damage. Draw 1 card.' },
};

// 24-card starter deck: the same list both duelists draw from.
export const DECK_LIST = [
  'ember-strike', 'ember-strike', 'ember-strike', 'ember-strike',
  'ember-slash', 'ember-slash', 'cinder-burst', 'ignite', 'ignite',
  'stone-wall', 'stone-wall', 'stone-wall', 'stone-wall',
  'bulwark', 'bulwark', 'riposte',
  'bloom-mend', 'bloom-mend', 'lifebloom', 'thorn-gift',
  'gale-gust', 'gale-gust', 'windfall', 'cyclone',
];

let nextCardId = 1;
export function makeCard(defId) {
  return { id: nextCardId++, defId, def: CARD_DEFS[defId] };
}
export function buildDeck(rand, shuffleFn) {
  return shuffleFn(DECK_LIST.map(makeCard), rand);
}
