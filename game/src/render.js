// render.js — turns game state into DOM. One full re-render per state
// change, plus a "last played" flash card that slides in with CSS.
import { SUITS, CARD_DEFS } from './cards.js';
import { describeIntent } from './ai.js';

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined && text !== null) e.textContent = text;
  return e;
}

function hpBar(side) {
  const wrap = el('div', 'hpbar');
  const pct = Math.max(0, (side.hp / side.maxHp) * 100);
  const fill = el('div', 'hpfill');
  fill.style.width = pct + '%';
  if (pct <= 33) fill.classList.add('low');
  wrap.appendChild(fill);
  const label = el('span', 'hplabel', `${side.hp} / ${side.maxHp} HP`);
  wrap.appendChild(label);
  return wrap;
}

function badge(text, cls) {
  return el('span', 'badge ' + cls, text);
}

function cardNode(card, opts = {}) {
  const def = card.def;
  const suit = SUITS[def.suit];
  const node = el('div', 'card suit-' + def.suit + (opts.playable === false ? ' dim' : ''));
  node.style.setProperty('--suit', suit.color);
  node.style.setProperty('--suit-dark', suit.dark);
  node.dataset.cardId = card.id;
  const cost = el('div', 'cost', String(def.cost));
  cost.title = 'Energy cost';
  const glyph = el('div', 'glyph', suit.glyph);
  const name = el('div', 'cname', def.name);
  const suitName = el('div', 'suitname', suit.name.toUpperCase());
  const value = el('div', 'cvalue', effectLine(def));
  const text = el('div', 'ctext', def.text);
  node.append(cost, glyph, name, suitName, value, text);
  if (opts.surge) node.appendChild(el('div', 'surgebadge', 'SURGE +2'));
  if (opts.onClick) node.addEventListener('click', opts.onClick);
  return node;
}

// The big number on the card face: its main effect value.
function effectLine(def) {
  const main = def.effects[0];
  if (main.kind === 'damage') return main.n + ' ⚔';
  if (main.kind === 'block') return main.n + ' ⛨';
  if (main.kind === 'heal') return '+' + main.n + ' ♥';
  if (main.kind === 'draw') return '+' + main.n + ' ▤';
  return '✦';
}

function cardBackNode() {
  const node = el('div', 'card cardback');
  node.appendChild(el('div', 'backglyph', '🔥'));
  node.appendChild(el('div', 'backtext', 'EMBERCLASH'));
  return node;
}

export function render(state, handlers) {
  const root = document.getElementById('app');
  root.innerHTML = '';
  const p = state.player;
  const e = state.enemy;

  // ---- top bar ----
  const top = el('div', 'topbar');
  top.append(
    el('div', 'brand', '🔥 EMBERCLASH'),
    el('div', 'turninfo', `Turn ${state.turn}  ·  Score ${state.score}`),
  );
  const btns = el('div', 'topbtns');
  const snd = el('button', 'tbtn', handlers.muted ? '🔇 Sound off' : '🔊 Sound on');
  snd.addEventListener('click', handlers.onToggleSound);
  const help = el('button', 'tbtn', '? How to play');
  help.addEventListener('click', handlers.onHelp);
  const restart = el('button', 'tbtn', '↺ Restart');
  restart.addEventListener('click', handlers.onRestart);
  btns.append(snd, help, restart);
  top.appendChild(btns);
  root.appendChild(top);

  // ---- enemy row ----
  const enemyRow = el('div', 'enemyrow');
  const eInfo = el('div', 'sideinfo');
  const eAvatar = el('div', 'avatar enemy-avatar', '🧙');
  const eName = el('div', 'sidename', 'ASH WARDEN');
  eInfo.append(eAvatar, eName, hpBar(e));
  if (e.block > 0) eInfo.appendChild(badge(`⛨ Block ${e.block}`, 'block'));
  if (e.burn > 0) eInfo.appendChild(badge(`🔥 Burn ${e.burn}`, 'burn'));
  enemyRow.appendChild(eInfo);

  const eHand = el('div', 'ehand');
  const intent = el('div', 'intent', '💭 ' + describeIntent(state));
  eHand.appendChild(intent);
  const backs = el('div', 'backs');
  for (let i = 0; i < e.hand.length; i++) backs.appendChild(cardBackNode());
  const eCounts = el('div', 'counts', `Hand ${e.hand.length} · Deck ${e.deck.length} · Discard ${e.discard.length}`);
  eHand.append(backs, eCounts);
  enemyRow.appendChild(eHand);
  root.appendChild(enemyRow);

  // ---- middle: log + played card + end turn ----
  const mid = el('div', 'midrow');
  const logBox = el('div', 'log');
  const recent = state.log.slice(-5);
  for (const line of recent) logBox.appendChild(el('div', 'logline', line));
  mid.appendChild(logBox);

  const played = el('div', 'played');
  if (state.lastPlayed) {
    const def = CARD_DEFS[state.lastPlayed.defId];
    const who = state.lastPlayed.by === 'player' ? 'You played' : 'Warden played';
    played.appendChild(el('div', 'playedlabel', who));
    const mini = cardNode({ id: 'last', defId: state.lastPlayed.defId, def }, { surge: state.lastPlayed.surged });
    mini.classList.add('mini');
    played.appendChild(mini);
  } else {
    played.appendChild(el('div', 'playedlabel', 'No card played yet'));
  }
  mid.appendChild(played);

  const controls = el('div', 'controls');
  const energy = el('div', 'energy', `⚡ Energy ${p.energy} / ${3}`);
  controls.appendChild(energy);
  const surgeHint = el('div', 'surgehint', 'Chain a suit twice in one turn for SURGE +2!');
  controls.appendChild(surgeHint);
  const endBtn = el('button', 'endbtn', 'End Turn ⏎');
  endBtn.disabled = state.phase !== 'play';
  endBtn.addEventListener('click', handlers.onEndTurn);
  controls.appendChild(endBtn);
  const hint = el('div', 'keyhint', 'Keys: 1–5 play a card · Enter ends turn · R restarts');
  controls.appendChild(hint);
  mid.appendChild(controls);
  root.appendChild(mid);

  // ---- player row ----
  const playerRow = el('div', 'playerrow');
  const pInfo = el('div', 'sideinfo');
  const pAvatar = el('div', 'avatar player-avatar', '🧝');
  pInfo.append(pAvatar, el('div', 'sidename', 'YOU — EMBER DUELIST'), hpBar(p));
  if (p.block > 0) pInfo.appendChild(badge(`⛨ Block ${p.block}`, 'block'));
  if (p.burn > 0) pInfo.appendChild(badge(`🔥 Burn ${p.burn}`, 'burn'));
  playerRow.appendChild(pInfo);

  const handBox = el('div', 'handbox');
  const hand = el('div', 'hand');
  p.hand.forEach((card, i) => {
    const playable = state.phase === 'play' && card.def.cost <= p.energy;
    const surged = p.playedSuits.includes(card.def.suit);
    const node = cardNode(card, {
      playable,
      surge: surged && playable,
      onClick: () => handlers.onPlayCard(i),
    });
    node.title = `Press ${i + 1} to play`;
    hand.appendChild(node);
  });
  const pCounts = el('div', 'counts', `Hand ${p.hand.length} · Deck ${p.deck.length} · Discard ${p.discard.length}`);
  handBox.append(hand, pCounts);
  playerRow.appendChild(handBox);
  root.appendChild(playerRow);

  // ---- overlays: title / win / loss / help ----
  if (state.phase === 'title') root.appendChild(titleOverlay(handlers));
  if (state.phase === 'won') root.appendChild(endOverlay(state, true, handlers));
  if (state.phase === 'lost') root.appendChild(endOverlay(state, false, handlers));
  if (state.showHelp) root.appendChild(helpOverlay(handlers));
}

function overlay(cls) {
  const o = el('div', 'overlay ' + cls);
  const panel = el('div', 'panel');
  o.appendChild(panel);
  return { o, panel };
}

function titleOverlay(handlers) {
  const { o, panel } = overlay('title');
  panel.append(
    el('div', 'bigtitle', '🔥 EMBERCLASH'),
    el('div', 'subtitle', 'A duel of ember, stone, bloom and gale'),
    el('p', 'tagline', 'Outplay the Ash Warden. Chain a suit twice in one turn to SURGE — every second card of the same suit hits +2 harder. Reduce the Warden to 0 HP before he does the same to you.'),
  );
  const deckPreview = el('div', 'deckpreview');
  deckPreview.appendChild(el('div', 'dphead', 'YOUR 24-CARD DECK'));
  const counts = {};
  for (const defId of Object.keys(CARD_DEFS)) counts[defId] = 0;
  // Deck list is fixed; count from the module's list via a sample render.
  const sample = ['ember-strike', 'ember-slash', 'cinder-burst', 'ignite', 'stone-wall', 'bulwark', 'riposte', 'bloom-mend', 'lifebloom', 'thorn-gift', 'gale-gust', 'windfall', 'cyclone'];
  for (const defId of sample) {
    const def = CARD_DEFS[defId];
    const suit = SUITS[def.suit];
    deckPreview.appendChild(el('div', 'dpline', `${suit.glyph} ${def.name} — ${def.cost}⚡ · ${def.text}`));
  }
  panel.appendChild(deckPreview);
  const start = el('button', 'bigbtn', '▶  Begin the Duel');
  start.addEventListener('click', handlers.onStart);
  panel.appendChild(start);
  panel.appendChild(el('div', 'keyhint', 'Mouse or keyboard: 1–5 play a card · Enter ends turn · R restarts'));
  return o;
}

function endOverlay(state, won, handlers) {
  const { o, panel } = overlay(won ? 'win' : 'loss');
  panel.append(
    el('div', 'bigtitle', won ? '🏆 VICTORY!' : '💀 DEFEAT'),
    el('div', 'subtitle', won ? 'The Ash Warden falls. The ember is yours.' : 'The Ash Warden stands. The ember fades… this time.'),
    el('div', 'scoreline', `SCORE  ${state.score}`),
  );
  const stats = el('div', 'endstats');
  stats.append(
    el('div', 'statline', `Turns played: ${state.stats.turns}`),
    el('div', 'statline', `Damage dealt: ${state.stats.damageDealt}`),
    el('div', 'statline', `Damage taken: ${state.stats.damageTaken}`),
    el('div', 'statline', `Cards played: ${state.stats.cardsPlayed}`),
    el('div', 'statline', `HP healed: ${state.stats.healed}`),
    el('div', 'statline', `Your HP left: ${state.player.hp} / ${state.player.maxHp}`),
  );
  panel.appendChild(stats);
  const again = el('button', 'bigbtn', '↺  Play Again');
  again.addEventListener('click', handlers.onRestart);
  panel.appendChild(again);
  return o;
}

function helpOverlay(handlers) {
  const { o, panel } = overlay('help');
  panel.append(
    el('div', 'bigtitle small', 'HOW TO PLAY'),
    el('p', 'tagline', 'You and the Ash Warden each have 30 HP. Each turn you gain 3 Energy and draw 2 cards. Click a card (or press 1–5) to play it if you can afford its Energy cost. Then press End Turn and the Warden answers.'),
    el('p', 'tagline', '⚡ SURGE: play two cards of the same suit in one turn and the second one gains +2 damage, Block or healing (or +1 draw / burn / energy). Chain Ember to burn the Warden down; chain Stone to turtle; chain Bloom to outlast him.'),
    el('p', 'tagline', '🛡️ Block absorbs damage until your next turn, then fades. 🔥 Burn deals 2 damage per stack at the start of a turn, then one stack burns away. 💭 The Warden shows his intent — read it and counter it.'),
    el('p', 'tagline', 'Win by reducing the Warden to 0 HP. Lose if he does it to you first. Your score rewards HP left, fast wins and damage dealt.'),
  );
  const close = el('button', 'bigbtn', 'Got it — back to the table');
  close.addEventListener('click', handlers.onCloseHelp);
  panel.appendChild(close);
  return o;
}
