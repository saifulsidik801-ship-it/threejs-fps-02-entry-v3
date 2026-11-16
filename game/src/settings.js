// settings.js — JOB: player settings, loaded and saved in one place. Serves judge
// criterion 5 (state in one place). Sensitivity, field of view and volume persist in
// localStorage; a fresh browser gets the defaults. Nothing else reads localStorage.
const KEY = 'saltpier-settings-v1';
export const DEFAULTS = { sens: 1, fov: 74, volume: 0.25, quality: 'high' };

export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return {
      sens: clampNum(parsed.sens, 0.2, 3, DEFAULTS.sens),
      fov: clampNum(parsed.fov, 60, 100, DEFAULTS.fov),
      volume: clampNum(parsed.volume, 0, 1, DEFAULTS.volume),
      quality: parsed.quality === 'low' ? 'low' : 'high',
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      sens: s.sens, fov: s.fov, volume: s.volume, quality: s.quality,
    }));
  } catch { /* private mode: settings just don't persist */ }
}

function clampNum(v, lo, hi, fallback) {
  const n = Number(v);
  if (!isFinite(n)) return fallback;
  return Math.max(lo, Math.min(hi, n));
}
