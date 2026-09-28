// Soft two-note notification chime generated with the Web Audio API (no audio file).
// Browsers block audio until a user gesture, so the AudioContext is created/resumed
// lazily on the first pointerdown/keydown and every failure is swallowed silently.

const MIN_GAP_MS = 5000;
const STORAGE_PREFIX = 'notify_sound_muted_';

let ctx = null;
let unlocked = false;
let lastPlayedAt = 0;
let listenersAttached = false;

const getCtx = () => {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  } catch {
    ctx = null;
  }
  return ctx;
};

const unlock = () => {
  unlocked = true;
  try {
    const c = getCtx();
    if (c && c.state === 'suspended') c.resume().catch(() => {});
  } catch { /* ignore */ }
  window.removeEventListener('pointerdown', unlock, true);
  window.removeEventListener('keydown', unlock, true);
};

export const initNotifySound = () => {
  if (listenersAttached || typeof window === 'undefined') return;
  listenersAttached = true;
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);
};

export const isNotifySoundMuted = role => {
  try { return localStorage.getItem(STORAGE_PREFIX + role) === '1'; } catch { return false; }
};

export const setNotifySoundMuted = (role, muted) => {
  try {
    if (muted) localStorage.setItem(STORAGE_PREFIX + role, '1');
    else localStorage.removeItem(STORAGE_PREFIX + role);
  } catch { /* ignore */ }
};

export const playNotifySound = () => {
  try {
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
    if (!unlocked) return;
    const now = Date.now();
    if (now - lastPlayedAt < MIN_GAP_MS) return;
    const c = getCtx();
    if (!c) return;
    if (c.state === 'suspended') c.resume().catch(() => {});
    if (c.state !== 'running' && c.state !== 'suspended') return;
    lastPlayedAt = now;

    const start = c.currentTime + 0.01;
    const master = c.createGain();
    master.gain.value = 0.12;
    master.connect(c.destination);

    // E6 then A6 — a gentle rising chime, ~0.3 s total
    [[1318.5, 0], [1760, 0.12]].forEach(([freq, offset]) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = start + offset;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(1, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      osc.connect(gain);
      gain.connect(master);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  } catch { /* fail silently */ }
};
