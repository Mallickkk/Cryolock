import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Header from "./Header";
import { listLocks, getStats, getActivity } from "./lib/store";
import { shortAddress } from "./lib/wallet";

function LockCard({ lock }) {
  const [, force] = useState(0);
  useEffect(() => { const t = setInterval(() => force((x) => x + 1), 1000); return () => clearInterval(t); }, []);
  const remaining = Math.max(0, new Date(lock.end_time).getTime() - Date.now());
  const fmt = (ms) => {
    const s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${String(m).padStart(2,"0")}m ${String(sec).padStart(2,"0")}s`;
  };

  return (
    <div className="lock-card">
      <div className="lock-card-top">
        <div>
          <p className="lock-card-id">STREAM #{lock.id.slice(0,6)}</p>
          <h3>{lock.label}</h3>
        </div>
        <span className={`status-pill ${lock.status}`}>{lock.status}</span>
      </div>
      <div className="lock-card-amounts">
        <div><p className="lc-label">LOCKED</p><p className="lc-val">{lock.locked_amount.toFixed(4)}</p></div>
        <div><p className="lc-label">STREAMED</p><p className="lc-val green">{lock.unlocked_amount.toFixed(4)}</p></div>
        <div><p className="lc-label">WITHDRAWABLE</p><p className="lc-val blue">{lock.withdrawable_amount.toFixed(4)}</p></div>
      </div>
      <div className="progress-bar"><div className="progress" style={{ width: `${lock.progress_pct.toFixed(2)}%` }}></div></div>
      <div className="lock-card-foot">
        <span>{lock.token_symbol} → {shortAddress(lock.recipient_wallet)}</span>
        <span>{lock.status === "active" ? fmt(remaining) : lock.status}</span>
      </div>
      <Link to={`/app/lock/${lock.id}`}><button className="lc-btn">Open Stream →</button></Link>
    </div>
  );
}

function Dashboard(props) {
  const { activeWallet, mode } = props;
  const [, force] = useState(0);
  useEffect(() => { const t = setInterval(() => force((x) => x + 1), 5000); return () => clearInterval(t); }, []);
  const [filter, setFilter] = useState("all");

  if (!activeWallet) {
    return (
      <div className="hero">
        <Header {...props} />
        <div className="empty-state">
          <h2>Connect a wallet to continue</h2>
          <p>Switch to DEMO in the header to explore without MetaMask.</p>
        </div>
      </div>
    );
  }

  const locks = listLocks(activeWallet).filter((l) => {
    if (filter === "incoming") return l.recipient_wallet === activeWallet.toLowerCase();
    if (filter === "outgoing") return l.creator_wallet === activeWallet.toLowerCase();
    return true;
  });
  const stats = getStats(activeWallet);
  const activity = getActivity(activeWallet);

  return (
    <div className="hero">
      <Header {...props} />
      <div className="dashboard">
        <div className="dash-top">
          <div>
            <p className="section-tag">DASHBOARD · {mode.toUpperCase()} MODE</p>
            <h1 className="dash-title">Your streams</h1>
            <p className="dash-wallet">{shortAddress(activeWallet)}</p>
          </div>
          <Link to="/app/create"><button>+ New Lock</button></Link>
        </div>

        <div className="stats">
          <div className="stat-card"><p>ACTIVE STREAMS</p><h2>{stats.active_streams}</h2></div>
          <div className="stat-card"><p>TOTAL LOCKED</p><h2>{stats.total_locked.toFixed(2)}</h2></div>
          <div className="stat-card"><p>TOTAL UNLOCKED</p><h2>{stats.total_unlocked.toFixed(2)}</h2></div>
          <div className="stat-card"><p>TOTAL WITHDRAWN</p><h2>{stats.total_withdrawn.toFixed(2)}</h2></div>
        </div>

        <div className="filter-pills">
          {["all","incoming","outgoing"].map((f) => (
            <button key={f} className={filter === f ? "filter-pill active" : "filter-pill"} onClick={() => setFilter(f)}>{f.toUpperCase()}</button>
          ))}
        </div>

        {locks.length === 0 ? (
          <div className="empty-state">
            <h3>No streams yet</h3>
            <p>Create your first vesting schedule.</p>
            <Link to="/app/create"><button>+ Create First Lock</button></Link>
          </div>
        ) : (
          <div className="locks-grid">{locks.map((l) => <LockCard key={l.id} lock={l} />)}</div>
        )}

        {activity.length > 0 && (
          <div className="activity">
            <p className="section-tag" style={{marginTop:40}}>RECENT ACTIVITY</p>
            <div className="activity-list">
              {activity.slice(0, 8).map((a) => (
                <div key={a.id} className="activity-row">
                  <span className={`activity-type ${a.type}`}>{a.type}</span>
                  <span>{Number(a.amount).toFixed(4)} {a.token_symbol}</span>
                  <span className="activity-wallet">{shortAddress(a.wallet)}</span>
                  <span className="activity-time">{new Date(a.timestamp).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default Dashboard;