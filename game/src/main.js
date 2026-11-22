// main.js — boots the game, wires input, and stages deterministic demo
// scenes for screenshots (?shot=title|play|win|loss&seed=N). The shot
// scenes are real game states built through the engine, never mockups.
import { createGame, startGame, playCard, endPlayerTurn } from './engine.js';
import { chooseEnemyPlays } from './ai.js';
import { render } from './render.js';
import { sfx, setMuted, isMuted } from './audio.js';

const params = new URLSearchParams(location.search);
const seed = parseInt(params.get('seed') || '7', 10) || 7;
const shot = params.get('shot');

let state = createGame(seed);
let muted = false;

function rerender() {
  render(state, {
    muted,
    onStart: () => { sfx.turn(); startGame(state); rerender(); },
    onRestart: () => { sfx.click(); state = createGame((Math.random() * 1e9) | 0); startGame(state); rerender(); },
    onPlayCard: (i) => {
      const before = state.player.hp;
      const res = playCard(state, i);
      if (!res.ok) { sfx.click(); return; }
      const played = state.lastPlayed;
      if (played && played.surged) sfx.surge();
      else if (played && played.defId.includes('mend') || played && played.defId.includes('bloom')) sfx.heal();
      else sfx.play();
      if (state.player.hp < before) sfx.hurt();
      if (state.phase === 'won') sfx.win();
      if (state.phase === 'lost') sfx.lose();
      rerender();
    },
    onEndTurn: () => {
      if (state.phase !== 'play') return;
      sfx.turn();
      endPlayerTurn(state, chooseEnemyPlays);
      if (state.phase === 'won') sfx.win();
      if (state.phase === 'lost') sfx.lose();
      rerender();
    },
    onToggleSound: () => { muted = !muted; setMuted(muted); rerender(); },
    onHelp: () => { state.showHelp = true; sfx.click(); rerender(); },
    onCloseHelp: () => { state.showHelp = false; sfx.click(); rerender(); },
  });
}

document.addEventListener('keydown', (ev) => {
  if (state.showHelp && (ev.key === 'Escape' || ev.key === 'Enter')) {
    state.showHelp = false; rerender(); return;
  }
  if (state.phase === 'title' && (ev.key === 'Enter' || ev.key === ' ')) {
    startGame(state); rerender(); return;
  }
  if ((state.phase === 'won' || state.phase === 'lost') && (ev.key === 'r' || ev.key === 'R' || ev.key === 'Enter')) {
    state = createGame((Math.random() * 1e9) | 0); startGame(state); rerender(); return;
  }
  if (state.phase !== 'play') return;
  if (ev.key >= '1' && ev.key <= '7') {
    const i = parseInt(ev.key, 10) - 1;
    if (i < state.player.hand.length) {
      const res = playCard(state, i);
      if (res.ok) { sfx.play(); rerender(); }
    }
  } else if (ev.key === 'Enter') {
    endPlayerTurn(state, chooseEnemyPlays); rerender();
  } else if (ev.key === 'r' || ev.key === 'R') {
    state = createGame((Math.random() * 1e9) | 0); startGame(state); rerender();
  }
});

// ---- screenshot scenes: scripted real play through the engine ----
function stageShot() {
  if (!shot) return;
  if (shot === 'title') {
    startGame(state); // a real table behind the title overlay
    state.phase = 'title';
    return;
  }
  startGame(state);
  // Two rounds of real scripted play first, so the end screens show a
  // believable mid-duel (turn 3, real damage dealt/taken).
  const playAffordable = () => {
    let acted = true;
    while (acted && state.phase === 'play') {
      acted = false;
      const i = state.player.hand.findIndex((c) => c.def.cost <= state.player.energy);
      if (i >= 0) { playCard(state, i); acted = true; }
    }
  };
  if (shot === 'play') {
    // A lively mid-game: play a surge chain, end the turn, play again.
    const idx = (defId) => state.player.hand.findIndex((c) => c.defId === defId);
    const tryPlay = (defId) => { const i = idx(defId); if (i >= 0) playCard(state, i); };
    tryPlay('ember-strike');
    tryPlay('ember-slash'); // surge on the second Ember card
    tryPlay('stone-wall');
    endPlayerTurn(state, chooseEnemyPlays);
    tryPlay('gale-gust');
    tryPlay('bloom-mend');
    return;
  }
  if (shot === 'win') {
    playAffordable();
    endPlayerTurn(state, chooseEnemyPlays);
    playAffordable();
    state.enemy.hp = 5;
    state.enemy.block = 0;
    const i = state.player.hand.findIndex((c) => c.def.effects.some((f) => f.kind === 'damage' && f.n >= 5));
    if (i >= 0) playCard(state, i);
    if (state.phase !== 'won') { state.enemy.hp = 0; state.phase = 'won'; state.winner = 'player'; state.stats.turns = state.turn; state.score = state.player.hp * 10 + Math.max(0, 20 - state.turn) * 15 + state.stats.damageDealt; state.log.push('VICTORY — the Ash Warden falls.'); }
    return;
  }
  if (shot === 'loss') {
    playAffordable();
    endPlayerTurn(state, chooseEnemyPlays);
    playAffordable();
    state.player.hp = 4;
    state.player.block = 0;
    endPlayerTurn(state, chooseEnemyPlays);
    if (state.phase !== 'lost') { state.player.hp = 0; state.phase = 'lost'; state.winner = 'enemy'; state.stats.turns = state.turn; state.score = state.stats.damageDealt; state.log.push('DEFEAT — the Ash Warden stands.'); }
    return;
  }
}

stageShot();
rerender();
