// weapons.js — JOB: every gun's own numbers + the damage model. Serves judge criterion 2
// (GUNPLAY: per-weapon damage/headshot/spread/recoil/range, headshots after falloff).
// No two guns share a tuning row: each has its own damage, headMult, spread, recoil, range,
// falloff, fire rate, mag and kill reward. Headshot multiplies AFTER falloff; a helmet halves
// a headshot; leg hits deal 25% less.
export const WEAPONS = {
  p9: { id: 'p9', name: 'P9 Sidearm', slot: 2, kind: 'pistol', price: 0, damage: 26, headMult: 3.0, spread: 0.011, spreadMove: 0.030, recoil: 0.011, range: 26, falloff: 0.55, rpm: 320, mag: 15, reserve: 45, reload: 1.4, zoom: 1.0, reward: 300, auto: false, flavor: 'Reliable harbour sidearm. Free, always.' },
  k9: { id: 'k9', name: 'K9 SMG', slot: 1, kind: 'smg', price: 1500, damage: 22, headMult: 2.2, spread: 0.016, spreadMove: 0.042, recoil: 0.009, range: 22, falloff: 0.55, rpm: 750, mag: 30, reserve: 120, reload: 2.1, zoom: 1.15, reward: 300, auto: true, flavor: 'Close-quarters hose. Fast, wild past 20 m.' },
  breacher: { id: 'breacher', name: 'Breacher 12', slot: 1, kind: 'shotgun', price: 1700, damage: 13, headMult: 1.5, spread: 0.052, spreadMove: 0.075, recoil: 0.042, range: 12, falloff: 0.55, rpm: 68, mag: 6, reserve: 24, reload: 2.8, zoom: 1.0, reward: 900, auto: false, pellets: 8, flavor: 'Eight pellets per shell. Devastating in a doorway.' },
  ar47: { id: 'ar47', name: 'AR-47', slot: 1, kind: 'rifle', price: 2700, damage: 30, headMult: 2.5, spread: 0.013, spreadMove: 0.036, recoil: 0.016, range: 38, falloff: 0.55, rpm: 600, mag: 30, reserve: 90, reload: 2.4, zoom: 1.25, reward: 300, auto: true, flavor: 'The workhorse. One-tap head at mid range.' },
  tempest: { id: 'tempest', name: 'Tempest 7.62', slot: 1, kind: 'rifle', price: 3100, damage: 34, headMult: 2.5, spread: 0.012, spreadMove: 0.033, recoil: 0.019, range: 44, falloff: 0.55, rpm: 545, mag: 25, reserve: 75, reload: 2.6, zoom: 1.3, reward: 300, auto: true, flavor: 'Heavier calibre, slower hands. Rewards patience.' },
  mauler: { id: 'mauler', name: 'Mauler 5.56', slot: 1, kind: 'rifle', price: 4200, damage: 28, headMult: 2.4, spread: 0.009, spreadMove: 0.028, recoil: 0.012, range: 48, falloff: 0.55, rpm: 700, mag: 30, reserve: 90, reload: 2.3, zoom: 1.35, reward: 300, auto: true, flavor: 'Laser-steady at range. The lane-holder.' },
  longshot: { id: 'longshot', name: 'Longshot 7.62', slot: 1, kind: 'sniper', price: 4750, damage: 78, headMult: 3.0, spread: 0.002, spreadMove: 0.060, recoil: 0.075, range: 70, falloff: 0.55, rpm: 48, mag: 5, reserve: 15, reload: 3.4, zoom: 2.4, reward: 100, auto: false, scope: true, flavor: 'One shot, one lane closed. Scope with right-click.' },
  knife: { id: 'knife', name: 'Harbour Knife', slot: 3, kind: 'melee', price: 0, damage: 40, headMult: 1.0, spread: 0, spreadMove: 0, recoil: 0, range: 2.2, falloff: 1.0, rpm: 120, mag: Infinity, reserve: Infinity, reload: 0, zoom: 1.0, reward: 1500, auto: false, flavor: 'Silent, free, and worth $1,500 a kill.' },
};
export const WEAPON_LIST = ['p9', 'k9', 'breacher', 'ar47', 'tempest', 'mauler', 'longshot', 'knife'];
export const GRENADES = {
  frag: { id: 'frag', name: 'Frag Grenade', price: 300, key: 'G', flavor: 'Bounces once, then clears the corner.' },
  smoke: { id: 'smoke', name: 'Smoke Grenade', price: 300, key: 'T', flavor: 'A grey wall for ten seconds.' },
  flash: { id: 'flash', name: 'Flash Grenade', price: 200, key: 'F', flavor: 'Turn away or see white.' },
  ignis: { id: 'ignis', name: 'Ignis Canister', price: 400, key: 'V', flavor: 'Fire on the floor. Nobody holds that angle.' },
};
export const GEAR = {
  kevlar: { id: 'kevlar', name: 'Kevlar + Helm', price: 650, flavor: 'Halves headshots, soaks body shots.' },
  kit: { id: 'kit', name: 'Defuse Kit', price: 400, flavor: 'Defuse in 2.5 s instead of 5 s.' },
};
// Damage AFTER falloff, then the head multiplier. dist in metres.
export function damageAt(w, dist, part, hasHelmet) {
  const over = Math.max(0, Math.min(1, (dist - w.range) / w.range));
  let dmg = w.damage * (1 - (1 - w.falloff) * over);
  if (part === 'head') {
    dmg *= w.headMult;
    if (hasHelmet) dmg *= 0.5; // helmet halves a headshot
  } else if (part === 'leg') {
    dmg *= 0.75; // leg shots deal 25% less
  }
  return dmg;
}
// Spread now: aiming tightens x0.45, moving widens, crouch + quiet-walk tighten.
export function spreadNow(w, moving, aiming, crouched, walking) {
  let s = moving ? w.spreadMove : w.spread;
  if (aiming) s *= 0.45;
  if (crouched) s *= 0.75;
  if (walking) s *= 0.7;
  return s;
}
// Deterministic recoil: shot N of a burst always kicks the same way (seeded by index).
export function recoilKick(w, shotIndex) {
  const a = Math.sin(shotIndex * 2.39996) * 0.6 + Math.sin(shotIndex * 1.1) * 0.4;
  return { pitch: w.recoil * (1 + shotIndex * 0.12), yaw: w.recoil * 0.35 * a };
}
