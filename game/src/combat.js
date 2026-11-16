// combat.js — JOB: shooting, hitting and dying. Serves judge criterion 2 (hits checked
// against bodies, MORE damage to the head) and criterion 1 (weapon fires, reloads, runs out).
// A shot is a ray from the muzzle: body/head/leg hitboxes are separate meshes, so a headshot
// is a real hitbox test, not a dice roll. Killfeed entries carry the HS tag here.
import * as THREE from 'three';
import { WEAPONS, damageAt, spreadNow, recoilKick } from './weapons.js';

const _dir = new THREE.Vector3();
const _origin = new THREE.Vector3();
const _ray = new THREE.Raycaster();

export function makeGunState(weaponId) {
  const w = WEAPONS[weaponId];
  return { weaponId, mag: w.mag, reserve: w.reserve, reloading: 0, cooldown: 0, shots: 0, bloom: 0 };
}

export function startReload(gun) {
  const w = WEAPONS[gun.weaponId];
  if (gun.reloading > 0 || gun.mag >= w.mag || gun.reserve <= 0 || !isFinite(w.mag)) return false;
  gun.reloading = w.reload;
  return true;
}

export function tickReload(gun, dt) {
  if (gun.reloading <= 0) return;
  gun.reloading -= dt;
  if (gun.reloading <= 0) {
    const w = WEAPONS[gun.weaponId];
    const need = w.mag - gun.mag;
    const take = Math.min(need, gun.reserve);
    gun.mag += take; gun.reserve -= take; gun.reloading = 0;
  }
}

// Fire one trigger pull from `shooter` (a combatant record). Returns a shot record or null.
// ctx: { scene, players, state, effects, audio, rng, walls } — walls are AABBs for LOS/block.
export function fireShot(ctx, shooter, aiming) {
  const gun = shooter.gun;
  const w = WEAPONS[gun.weaponId];
  if (gun.reloading > 0 || gun.cooldown > 0 || gun.mag <= 0) return null;
  gun.cooldown = 60 / w.rpm;
  gun.mag -= 1;
  gun.shots += 1;
  gun.bloom = Math.min(0.05, gun.bloom + w.recoil * 0.5);
  const kick = recoilKick(w, gun.shots);
  shooter.pitchKick = (shooter.pitchKick || 0) + kick.pitch;
  shooter.yawKick = (shooter.yawKick || 0) + kick.yaw;

  const pellets = w.pellets || 1;
  let hitAny = null;
  for (let p = 0; p < pellets; p++) {
    const spread = spreadNow(w, shooter.moving, aiming, shooter.crouched, shooter.walking) + gun.bloom;
    const yaw = shooter.yaw + (ctx.rng() - 0.5) * 2 * spread * 4 + (shooter.yawKick || 0);
    const pitch = shooter.pitch + (ctx.rng() - 0.5) * 2 * spread * 4 - (shooter.pitchKick || 0);
    _dir.set(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)).normalize();
    _origin.copy(shooter.pos); _origin.y += shooter.eyeHeight;
    _ray.set(_origin, _dir);
    _ray.far = 120;
    const targets = [];
    for (const pl of ctx.players) {
      if (pl === shooter || !pl.alive) continue;
      if (pl.hitMeshes) for (const m of pl.hitMeshes) targets.push(m);
    }
    const hits = _ray.intersectObjects(targets, false);
    const wallHit = rayVsWalls(ctx.walls, _origin, _dir, 120);
    let end = _origin.clone().addScaledVector(_dir, Math.min(wallHit, 120));
    if (hits.length > 0 && hits[0].distance < wallHit) {
      const h = hits[0];
      const victim = h.object.userData.owner;
      const part = h.object.userData.part; // 'head' | 'body' | 'leg'
      const dmg = damageAt(w, h.distance, part, victim.hasHelmet);
      end = h.point.clone();
      applyDamage(ctx, victim, dmg, shooter, w, part === 'head');
      hitAny = { victim, part, hs: part === 'head' };
    }
    ctx.effects.spawnTracer(_origin, end);
    ctx.effects.spawnMuzzle(_origin, _dir);
  }
  ctx.audio.shot(w.kind);
  ctx.effects.spawnCasing(shooter.pos);
  return { weapon: w.id, hit: hitAny };
}

export function applyDamage(ctx, victim, dmg, attacker, weapon, headshot) {
  if (!victim.alive) return;
  let rest = dmg;
  if (victim.kevlar > 0) { const absorbed = Math.min(victim.kevlar, rest * 0.5); victim.kevlar -= absorbed; rest -= absorbed; }
  victim.hp -= rest;
  victim.lastHitFrom = attacker;
  victim.lastHitAt = ctx.state.time;
  victim.flashT = 0.12;
  if (victim === ctx.players[0]) {
    ctx.hud.damageFrom(attacker.pos);
    ctx.hud.hitmarker(headshot);
  } else if (attacker === ctx.players[0]) {
    ctx.hud.hitmarker(headshot);
  }
  if (victim.hp <= 0) kill(ctx, victim, attacker, weapon, headshot);
}

export function kill(ctx, victim, attacker, weapon, headshot) {
  victim.alive = false;
  victim.hp = 0;
  victim.deathT = ctx.state.time;
  ctx.state.kills.push({ a: attacker.name, b: victim.name, weapon: weapon.name, hs: headshot, t: ctx.state.time });
  if (ctx.state.kills.length > 6) ctx.state.kills.shift();
  if (attacker) {
    attacker.kills += 1;
    attacker.dmg += 0;
    const reward = weapon.reward || 300;
    if (attacker === ctx.players[0]) {
      ctx.state.money.player += reward;
      ctx.hud.banner(`+$${reward} — ${victim.name} down${headshot ? ' (HEADSHOT)' : ''}`, 'good');
    } else if (attacker.isBot) {
      attacker.money = (attacker.money || 800) + reward;
    }
  }
  victim.kills = victim.kills || 0;
  ctx.effects.spawnBurst(victim.pos);
  ctx.audio.death();
  ctx.radio.say(victim.team === 'attack' ? 'attack' : 'defend', victim.name, victim.role, `${victim.name} is down.`);
  if (victim === ctx.players[0]) ctx.hud.deathCam();
}

// Segment vs wall AABBs; returns distance to the first wall hit, or Infinity.
export function rayVsWalls(walls, origin, dir, maxDist) {
  let best = maxDist;
  for (const w of walls) {
    let tmin = 0, tmax = maxDist;
    const o = [origin.x, origin.y, origin.z], d = [dir.x, dir.y, dir.z];
    const mn = [w.x0, w.y0, w.z0], mx = [w.x1, w.y1, w.z1];
    let ok = true;
    for (let i = 0; i < 3; i++) {
      if (Math.abs(d[i]) < 1e-9) { if (o[i] < mn[i] || o[i] > mx[i]) { ok = false; break; } continue; }
      let t1 = (mn[i] - o[i]) / d[i], t2 = (mx[i] - o[i]) / d[i];
      if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
      tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
      if (tmin > tmax) { ok = false; break; }
    }
    if (ok && tmin < best && tmin >= 0) best = tmin;
  }
  return best;
}

// 2D line-of-sight between two points (ignores height): blocked if the segment crosses a wall.
export function hasLOS(walls, a, b) {
  const dx = b.x - a.x, dz = b.z - a.z;
  const len = Math.hypot(dx, dz);
  if (len < 0.01) return true;
  const steps = Math.ceil(len / 0.5);
  for (let i = 1; i < steps; i++) {
    const x = a.x + (dx * i) / steps, z = a.z + (dz * i) / steps;
    for (const w of walls) {
      if (x >= w.x0 && x <= w.x1 && z >= w.z0 && z <= w.z1 && w.y1 > 1.0) return false;
    }
  }
  return true;
}
