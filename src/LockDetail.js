import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "./Header";
import { getLock, withdraw, cancelLock } from "./lib/store";
import { shortAddress } from "./lib/wallet";

function LockDetail(props) {
  const { id } = useParams();
  const { activeWallet } = props;
  const navigate = useNavigate();
  const [lock, setLock] = useState(() => getLock(id));
  const [, force] = useState(0);

  useEffect(() => {
    const t = setInterval(() => { setLock(getLock(id)); force((x) => x + 1); }, 1000);
    return () => clearInterval(t);
  }, [id]);

  if (!lock) return <div className="hero"><Header {...props} /><div className="empty-state"><h2>Lock not found</h2></div></div>;

  const isRecipient = activeWallet && activeWallet.toLowerCase() === lock.recipient_wallet;
  const isCreator = activeWallet && activeWallet.toLowerCase() === lock.creator_wallet;
  const remaining = Math.max(0, new Date(lock.end_time).getTime() - Date.now());
  const fmt = (ms) => {
    const s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return `${d}d ${String(h).padStart(2,"0")}h ${String(m).padStart(2,"0")}m ${String(sec).padStart(2,"0")}s`;
  };

  const doWithdraw = () => {
    try { const r = withdraw(lock.id, activeWallet); setLock(r.lock); alert(`Withdrew ${r.withdrawn_now.toFixed(4)} ${lock.token_symbol}`); }
    catch (e) { alert(e.message); }
  };
  const doCancel = () => {
    try { setLock(cancelLock(lock.id, activeWallet)); alert("Lock cancelled"); }
    catch (e) { alert(e.message); }
  };

  return (
    <div className="hero">
      <Header {...props} />
      <div className="detail-page">
        <button className="back-btn" onClick={() => navigate(-1)}>← BACK</button>

        <div className="detail-top">
          <div>
            <p className="section-tag">STREAM · {lock.id.slice(0,12)}</p>
            <h1 className="dash-title">{lock.label}</h1>
            <p className="dash-wallet">{lock.unlock_curve} · {lock.mode} mode</p>
          </div>
          <span className={`status-pill ${lock.status}`}>{lock.status}</span>
        </div>

        <div className="detail-numbers">
          <div className="big-num"><p>LOCKED</p><h2>{lock.locked_amount.toFixed(6)}</h2><p className="hint">{lock.token_symbol}</p></div>
          <div className="big-num green"><p>STREAMED</p><h2>{lock.unlocked_amount.toFixed(6)}</h2><p className="hint">unlocked so far</p></div>
          <div className="big-num blue"><p>WITHDRAWABLE</p><h2>{lock.withdrawable_amount.toFixed(6)}</h2><p className="hint">available to claim</p></div>
        </div>

        <div className="detail-progress">
          <div className="progress-bar big"><div className="progress" style={{ width: `${lock.progress_pct.toFixed(4)}%` }}></div></div>
          <div className="time-row">
            <span>START: {new Date(lock.start_time).toLocaleString()}</span>
            <span>{lock.progress_pct.toFixed(4)}%</span>
            <span>END: {new Date(lock.end_time).toLocaleString()}</span>
          </div>
          <p className="countdown">⏱ Remaining: <strong>{fmt(remaining)}</strong></p>
        </div>

        <div className="detail-actions">
          <button onClick={doWithdraw} disabled={!isRecipient || lock.withdrawable_amount <= 0 || lock.status !== "active"}>
            ↓ Withdraw {lock.withdrawable_amount.toFixed(4)} {lock.token_symbol}
          </button>
          <button className="secondary" onClick={doCancel} disabled={!isCreator || lock.status !== "active"}>✕ Cancel Stream</button>
        </div>

        <div className="meta-card">
          <p className="section-tag">METADATA</p>
          <div className="meta-grid">
            <div><span>Creator</span><span>{shortAddress(lock.creator_wallet)}</span></div>
            <div><span>Recipient</span><span>{shortAddress(lock.recipient_wallet)}</span></div>
            <div><span>Token</span><span>{lock.token_symbol}</span></div>
            <div><span>Total</span><span>{Number(lock.amount_total).toFixed(6)}</span></div>
            <div><span>Withdrawn</span><span>{Number(lock.withdrawn_amount).toFixed(6)}</span></div>
            <div><span>Curve</span><span>{lock.unlock_curve}</span></div>
            <div><span>Created</span><span>{new Date(lock.created_at).toLocaleString()}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default LockDetail;