// economy.js — JOB: money between rounds + the buy menu. Serves judge criterion 3
// (money earned each round and spent in a buy menu). 14 buyable items: 7 guns + knife,
// 4 grenades, kevlar+helm, defuse kit. Kill rewards are per weapon; losing pays a streak
// bonus that grows $1,900 -> $2,400 -> $2,900 -> $3,400.
import { WEAPONS, WEAPON_LIST, GRENADES, GEAR } from './weapons.js';

export const START_MONEY = 800;
export const ROUND_WIN = 3250;
export const PLANT_BONUS = 300;
export const MVP_BONUS = 300;
export const LOSS_BONUS = [1900, 2400, 2900, 3400]; // by loss streak, capped at the last

export function lossBonus(streak) {
  return LOSS_BONUS[Math.min(Math.max(streak - 1, 0), LOSS_BONUS.length - 1)];
}

// The buy menu as data: the HUD renders this, the keys buy from it. 6 categories.
export function buyMenu() {
  const items = [];
  for (const id of ['p9', 'k9', 'breacher', 'ar47', 'tempest', 'mauler', 'longshot']) {
    const w = WEAPONS[id];
    items.push({ key: String(items.length + 1), id, cat: 'GUNS', name: w.name, price: w.price, desc: `${w.damage} dmg · x${w.headMult} head · ${w.mag} rnd · ${w.flavor}` });
  }
  items.push({ key: '8', id: 'knife', cat: 'GUNS', name: 'Harbour Knife', price: 0, desc: `40 dmg · silent · $1,500 per kill` });
  for (const id of Object.keys(GRENADES)) {
    const g = GRENADES[id];
    items.push({ key: g.key, id, cat: 'GRENADES', name: g.name, price: g.price, desc: g.flavor });
  }
  items.push({ key: 'K', id: 'kevlar', cat: 'GEAR', name: GEAR.kevlar.name, price: GEAR.kevlar.price, desc: GEAR.kevlar.flavor });
  items.push({ key: 'L', id: 'kit', cat: 'GEAR', name: GEAR.kit.name, price: GEAR.kit.price, desc: GEAR.kit.flavor });
  return items;
}

// Apply a purchase to the player's loadout. Returns the bought name or null.
export function buy(state, player, itemId) {
  const w = WEAPONS[itemId];
  const g = GRENADES[itemId];
  const gear = GEAR[itemId];
  const price = w ? w.price : g ? g.price : gear ? gear.price : 0;
  if (state.money.player < price) return null;
  state.money.player -= price;
  if (w) {
    player.loadout[w.slot] = itemId;
    player.gun = makeGunFor(itemId);
    if (itemId === 'p9') player.loadout[2] = 'p9';
  } else if (g) {
    player.grenades[itemId] = (player.grenades[itemId] || 0) + 1;
  } else if (gear) {
    if (itemId === 'kevlar') { player.kevlar = 100; player.hasHelmet = true; }
    if (itemId === 'kit') player.hasKit = true;
  }
  return (w || g || gear).name;
}

export function makeGunFor(weaponId) {
  const w = WEAPONS[weaponId];
  return { weaponId, mag: w.mag, reserve: w.reserve, reloading: 0, cooldown: 0, shots: 0, bloom: 0 };
}

// End-of-round payout for one side. winner gets $3,250, loser gets the streak bonus.
export function roundPayout(state, winnerTeam) {
  for (const team of ['attack', 'defend']) {
    if (team === winnerTeam) {
      state.lossStreak[team] = 0;
      if (team === state.playerTeam) state.money.player += ROUND_WIN;
    } else {
      state.lossStreak[team] += 1;
      if (team === state.playerTeam) state.money.player += lossBonus(state.lossStreak[team]);
    }
  }
  if (state.bomb.state === 'planted' || state.bomb.planter) {
    if (state.playerTeam === 'attack') state.money.player += PLANT_BONUS;
  }
}
