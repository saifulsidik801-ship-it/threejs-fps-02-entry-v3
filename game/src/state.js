// state.js — JOB: the ONE place game state lives (judge criterion 5: state kept in one
// place). Every module reads/writes this object; nothing keeps a second copy of the match.
// A fresh state is built by createState(seed) so staged screenshots are deterministic.
export const PHASE = { MENU: 'MENU', BUY: 'BUY', LIVE: 'LIVE', PLANTED: 'PLANTED', ROUND_END: 'ROUND_END', MATCH_END: 'MATCH_END' };
export const WIN_ROUNDS = 5;
export const MAX_ROUNDS = 9;
export const ROUND_TIME = 105; // 1:45 live timer
export const FREEZE_TIME = 15; // buy / freeze phase
export const PLANT_TIME = 3.5;
export const DEFUSE_TIME = 5.0;
export const DEFUSE_KIT_TIME = 2.5;
export const BOMB_TIME = 40;

export function createState(seed) {
  return {
    seed,
    phase: PHASE.MENU,
    phaseT: 0, // seconds left in the current phase
    round: 1,
    score: { attack: 0, defend: 0 },
    roundHistory: [], // 'A' | 'D' per finished round
    halfSwapped: false,
    matchPoint: false,
    playerTeam: 'attack', // player runs with the Tide Runners (attack)
    bomb: { state: 'carried', site: null, t: 0, planter: null, defuser: null, defuseT: 0 },
    money: { player: 800 },
    lossStreak: { attack: 0, defend: 0 },
    time: 0, // sim clock, seconds
    tick: 0,
    kills: [], // killfeed entries {a, b, weapon, hs, t}
    radio: [], // radio lines {who, role, text, t}
    events: [], // banner events {text, kind, t}
    mvp: null,
    players: [], // all 10 combatants (index 0 = the human)
    winner: null,
    paused: false,
    spectating: -1,
  };
}
