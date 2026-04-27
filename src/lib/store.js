// Tiny localStorage-based store + streaming math
// In demo mode this acts as a complete backend

const KEY_LOCKS = "cryolock.locks";
const KEY_ACTIVITY = "cryolock.activity";

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

function readLocks() {
  try { return JSON.parse(localStorage.getItem(KEY_LOCKS)) || []; }
  catch { return []; }
}
function writeLocks(arr) { localStorage.setItem(KEY_LOCKS, JSON.stringify(arr)); }

function readActivity() {
  try { return JSON.parse(localStorage.getItem(KEY_ACTIVITY)) || []; }
  catch { return []; }
}
function writeActivity(arr) { localStorage.setItem(KEY_ACTIVITY, JSON.stringify(arr)); }

function logActivity(entry) {
  const all = readActivity();
  all.unshift({ id: uid(), timestamp: new Date().toISOString(), ...entry });
  writeActivity(all.slice(0, 100));
}

// ===== Streaming math =====
export function computeUnlocked(lock, at = new Date()) {
  const start = new Date(lock.start_time).getTime();
  const end = new Date(lock.end_time).getTime();
  const now = at.getTime();
  const total = Number(lock.amount_total);

  if (now <= start) return 0;
  if (now >= end) return total;
  if (lock.unlock_curve === "cliff") return 0;
  return total * ((now - start) / (end - start));
}

export function enrichLock(lock) {
  const unlocked = computeUnlocked(lock);
  const withdrawn = Number(lock.withdrawn_amount || 0);
  const total = Number(lock.amount_total);
  return {
    ...lock,
    unlocked_amount: unlocked,
    withdrawable_amount: Math.max(0, unlocked - withdrawn),
    locked_amount: Math.max(0, total - unlocked),
    progress_pct: total === 0 ? 0 : (unlocked / total) * 100,
  };
}

// ===== CRUD =====
export function createLock(payload) {
  const start = new Date();
  const lock = {
    id: uid(),
    creator_wallet: payload.creator_wallet.toLowerCase(),
    recipient_wallet: payload.recipient_wallet.toLowerCase(),
    token_symbol: payload.token_symbol.toUpperCase(),
    amount_total: Number(payload.amount_total),
    withdrawn_amount: 0,
    start_time: start.toISOString(),
    end_time: payload.end_time,
    unlock_curve: payload.unlock_curve || "linear",
    status: "active",
    mode: payload.mode || "demo",
    label: payload.label || `${payload.token_symbol.toUpperCase()} Vesting`,
    created_at: start.toISOString(),
  };
  const all = readLocks();
  all.unshift(lock);
  writeLocks(all);
  logActivity({ type: "created", lock_id: lock.id, wallet: lock.creator_wallet, amount: lock.amount_total, token_symbol: lock.token_symbol });
  return enrichLock(lock);
}

export function listLocks(wallet) {
  const w = wallet?.toLowerCase();
  return readLocks()
    .filter((l) => !w || l.creator_wallet === w || l.recipient_wallet === w)
    .map(enrichLock);
}

export function getLock(id) {
  const lock = readLocks().find((l) => l.id === id);
  return lock ? enrichLock(lock) : null;
}

export function withdraw(id, wallet) {
  const all = readLocks();
  const i = all.findIndex((l) => l.id === id);
  if (i === -1) throw new Error("Lock not found");
  const lock = all[i];
  if (lock.status !== "active") throw new Error(`Lock is ${lock.status}`);
  if (wallet.toLowerCase() !== lock.recipient_wallet) throw new Error("Only recipient can withdraw");

  const unlocked = computeUnlocked(lock);
  const withdrawable = Math.max(0, unlocked - Number(lock.withdrawn_amount || 0));
  if (withdrawable <= 0) throw new Error("Nothing to withdraw yet");

  lock.withdrawn_amount = Number(lock.withdrawn_amount || 0) + withdrawable;
  if (lock.withdrawn_amount >= Number(lock.amount_total) - 1e-9) lock.status = "completed";

  all[i] = lock;
  writeLocks(all);
  logActivity({ type: "withdraw", lock_id: id, wallet: wallet.toLowerCase(), amount: withdrawable, token_symbol: lock.token_symbol });
  return { withdrawn_now: withdrawable, lock: enrichLock(lock) };
}

export function cancelLock(id, wallet) {
  const all = readLocks();
  const i = all.findIndex((l) => l.id === id);
  if (i === -1) throw new Error("Lock not found");
  const lock = all[i];
  if (lock.status !== "active") throw new Error(`Lock is ${lock.status}`);
  if (wallet.toLowerCase() !== lock.creator_wallet) throw new Error("Only creator can cancel");
  lock.status = "cancelled";
  all[i] = lock;
  writeLocks(all);
  logActivity({ type: "cancelled", lock_id: id, wallet: wallet.toLowerCase(), amount: 0, token_symbol: lock.token_symbol });
  return enrichLock(lock);
}

export function getStats(wallet) {
  const locks = listLocks(wallet);
  let total_locked = 0, total_unlocked = 0, total_withdrawn = 0, active = 0;
  locks.forEach((l) => {
    total_locked += l.locked_amount;
    total_unlocked += l.unlocked_amount;
    total_withdrawn += Number(l.withdrawn_amount);
    if (l.status === "active") active++;
  });
  return { total_streams: locks.length, active_streams: active, total_locked, total_unlocked, total_withdrawn };
}

export function getActivity(wallet) {
  const w = wallet?.toLowerCase();
  return readActivity().filter((a) => !w || a.wallet === w).slice(0, 25);
}

// Pre-seed a couple of demo locks the first time
export function seedDemoIfEmpty(demoWallet) {
  if (readLocks().length > 0) return;
  const now = Date.now();
  const five_min = new Date(now + 5 * 60 * 1000).toISOString();
  const thirty_min = new Date(now + 30 * 60 * 1000).toISOString();
  createLock({
    creator_wallet: demoWallet,
    recipient_wallet: "0xbeefca5e000000000000000000000000000beef1",
    token_symbol: "USDC", amount_total: 5000, end_time: five_min,
    unlock_curve: "linear", mode: "demo", label: "Team vesting Q1",
  });
  createLock({
    creator_wallet: "0xbeefca5e000000000000000000000000000beef1",
    recipient_wallet: demoWallet,
    token_symbol: "ETH", amount_total: 2.5, end_time: thirty_min,
    unlock_curve: "linear", mode: "demo", label: "Investor lock",
  });
}