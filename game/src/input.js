// input.js — JOB: keyboard + mouse, nothing else. Serves judge criterion 1 (mouse look,
// keyboard movement) and criterion 2 (crouch, quiet-walk, jump). Pointer lock is requested
// on click; staged screenshot runs (?shot=) never need it. Keys: WASD move, Shift walk-quiet,
// Ctrl/C crouch, Space jump, R reload, B buy, E plant/defuse, G/T/F/V grenades, 1/2/3 slots,
// Tab scoreboard, Esc pause, right mouse ADS.
export function makeInput(canvas) {
  const keys = {};
  const st = {
    keys, mouseDX: 0, mouseDY: 0, firing: false, aiming: false,
    pressed: {}, // edge-triggered keys, consumed by the sim each tick
    locked: false,
  };
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    keys[e.code] = true;
    st.pressed[e.code] = true;
    if (e.code === 'Tab') e.preventDefault();
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; st.firing = false; });
  canvas.addEventListener('click', () => {
    if (!st.locked && document.pointerLockElement !== canvas) {
      try { canvas.requestPointerLock(); } catch { /* staged runs have no pointer lock */ }
    }
  });
  document.addEventListener('pointerlockchange', () => { st.locked = document.pointerLockElement === canvas; });
  document.addEventListener('mousemove', (e) => {
    if (!st.locked) return;
    st.mouseDX += e.movementX || 0;
    st.mouseDY += e.movementY || 0;
  });
  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) { st.firing = true; st.pressed.Mouse0 = true; }
    if (e.button === 2) st.aiming = true;
  });
  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) st.firing = false;
    if (e.button === 2) st.aiming = false;
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  st.consumeMouse = () => { const dx = st.mouseDX, dy = st.mouseDY; st.mouseDX = 0; st.mouseDY = 0; return { dx, dy }; };
  st.wasPressed = (code) => { const v = !!st.pressed[code]; if (v) st.pressed[code] = false; return v; };
  st.clearPressed = () => { for (const k in st.pressed) st.pressed[k] = false; };
  return st;
}
