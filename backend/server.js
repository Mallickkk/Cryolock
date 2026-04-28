const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());           // ✅ AFTER app is created
app.use(express.json());

const DB_FILE = path.join(__dirname, "db.json");
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

// ===== File-based persistence =====
function readDB() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, "utf-8")); }
  catch { return { locks: [], activity: [] }; }
}
function writeDB(data) { fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2)); }

// Seed if empty
(function seed() {
  const db = readDB();
  if (db.locks.length === 0) {
    const now = Date.now();
    db.locks.push({
      id: uid(),
      creator_wallet: "0xdem0cafe000000000000000000000000000000d0",
      recipient_wallet: "0xbeefca5e000000000000000000000000000beef1",
      token_symbol: "USDC",
      amount_total: 5000,
      withdrawn_amount: 0,
      start_time: new Date(now).toISOString(),
      end_time: new Date(now + 30 * 60 * 1000).toISOString(),
      unlock_curve: "linear",
      status: "active",
      mode: "demo",
      label: "Team vesting Q1",
      created_at: new Date(now).toISOString(),
    });
    writeDB(db);
    console.log("✅ Seeded demo lock");
  }
})();

// ===== Math =====
function computeUnlocked(lock) {
  const start = new Date(lock.start_time).getTime();
  const end = new Date(lock.end_time).getTime();
  const now = Date.now();
  const total = Number(lock.amount_total);
  if (now <= start) return 0;
  if (now >= end) return total;
  if (lock.unlock_curve === "cliff") return 0;
  return total * ((now - start) / (end - start));
}
function enrich(lock) {
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

// ===== Routes =====
app.get("/", (req, res) => res.json({ service: "Cryolock API", status: "ok", endpoints: ["/api/locks", "/api/stats", "/api/activity"] }));

app.get("/api/locks", (req, res) => {
  const w = (req.query.wallet || "").toLowerCase();
  const db = readDB();
  const filtered = !w ? db.locks : db.locks.filter(l => l.creator_wallet === w || l.recipient_wallet === w);
  res.json(filtered.map(enrich));
});

app.get("/api/locks/:id", (req, res) => {
  const lock = readDB().locks.find(l => l.id === req.params.id);
  if (!lock) return res.status(404).json({ error: "Not found" });
  res.json(enrich(lock));
});

app.post("/api/locks", (req, res) => {
  const db = readDB();
  const lock = {
    id: uid(),
    creator_wallet: req.body.creator_wallet.toLowerCase(),
    recipient_wallet: req.body.recipient_wallet.toLowerCase(),
    token_symbol: req.body.token_symbol.toUpperCase(),
    amount_total: Number(req.body.amount_total),
    withdrawn_amount: 0,
    start_time: new Date().toISOString(),
    end_time: req.body.end_time,
    unlock_curve: req.body.unlock_curve || "linear",
    status: "active",
    mode: req.body.mode || "demo",
    label: req.body.label || `${req.body.token_symbol} Vesting`,
    created_at: new Date().toISOString(),
  };
  db.locks.unshift(lock);
  db.activity.unshift({ id: uid(), type: "created", lock_id: lock.id, wallet: lock.creator_wallet, amount: lock.amount_total, token_symbol: lock.token_symbol, timestamp: new Date().toISOString() });
  writeDB(db);
  res.json(enrich(lock));
});

app.post("/api/locks/:id/withdraw", (req, res) => {
  const db = readDB();
  const lock = db.locks.find(l => l.id === req.params.id);
  if (!lock) return res.status(404).json({ error: "Not found" });
  if (lock.status !== "active") return res.status(400).json({ error: `Lock is ${lock.status}` });
  if (req.body.wallet.toLowerCase() !== lock.recipient_wallet) return res.status(403).json({ error: "Only recipient can withdraw" });

  const unlocked = computeUnlocked(lock);
  const withdrawable = Math.max(0, unlocked - Number(lock.withdrawn_amount || 0));
  if (withdrawable <= 0) return res.status(400).json({ error: "Nothing to withdraw yet" });

  lock.withdrawn_amount = Number(lock.withdrawn_amount || 0) + withdrawable;
  if (lock.withdrawn_amount >= Number(lock.amount_total) - 1e-9) lock.status = "completed";
  db.activity.unshift({ id: uid(), type: "withdraw", lock_id: lock.id, wallet: req.body.wallet.toLowerCase(), amount: withdrawable, token_symbol: lock.token_symbol, timestamp: new Date().toISOString() });
  writeDB(db);
  res.json({ withdrawn_now: withdrawable, lock: enrich(lock) });
});

app.post("/api/locks/:id/cancel", (req, res) => {
  const db = readDB();
  const lock = db.locks.find(l => l.id === req.params.id);
  if (!lock) return res.status(404).json({ error: "Not found" });
  if (lock.status !== "active") return res.status(400).json({ error: `Lock is ${lock.status}` });
  if (req.body.wallet.toLowerCase() !== lock.creator_wallet) return res.status(403).json({ error: "Only creator can cancel" });
  lock.status = "cancelled";
  db.activity.unshift({ id: uid(), type: "cancelled", lock_id: lock.id, wallet: req.body.wallet.toLowerCase(), amount: 0, token_symbol: lock.token_symbol, timestamp: new Date().toISOString() });
  writeDB(db);
  res.json(enrich(lock));
});

app.get("/api/stats", (req, res) => {
  const w = (req.query.wallet || "").toLowerCase();
  const locks = readDB().locks.filter(l => !w || l.creator_wallet === w || l.recipient_wallet === w).map(enrich);
  let total_locked = 0, total_unlocked = 0, total_withdrawn = 0, active = 0;
  locks.forEach(l => {
    total_locked += l.locked_amount;
    total_unlocked += l.unlocked_amount;
    total_withdrawn += Number(l.withdrawn_amount);
    if (l.status === "active") active++;
  });
  res.json({ total_streams: locks.length, active_streams: active, total_locked, total_unlocked, total_withdrawn });
});

app.get("/api/activity", (req, res) => {
  const w = (req.query.wallet || "").toLowerCase();
  const all = readDB().activity.filter(a => !w || a.wallet === w);
  res.json(all.slice(0, 25));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Cryolock API running on port ${PORT}`));
