import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import { createLock } from "./lib/store";

const TOKENS = ["USDC", "ETH", "DAI", "SABLIER"];
const DURATIONS = [
  { label: "5 minutes", min: 5 },
  { label: "1 hour", min: 60 },
  { label: "1 day", min: 1440 },
  { label: "30 days", min: 43200 },
  { label: "1 year", min: 525600 },
];

function CreateLock(props) {
  const { activeWallet, mode } = props;
  const navigate = useNavigate();
  const [recipient, setRecipient] = useState("");
  const [token, setToken] = useState("USDC");
  const [amount, setAmount] = useState("1000");
  const [duration, setDuration] = useState(5);
  const [curve, setCurve] = useState("linear");
  const [label, setLabel] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!activeWallet) return alert("Switch to DEMO mode or connect wallet first.");
    if (!recipient || recipient.length < 10) return alert("Enter a valid recipient address (0x...)");
    if (Number(amount) <= 0) return alert("Amount must be positive");

    const end = new Date(Date.now() + duration * 60 * 1000).toISOString();
    const lock = createLock({
      creator_wallet: activeWallet, recipient_wallet: recipient, token_symbol: token,
      amount_total: amount, end_time: end, unlock_curve: curve, mode, label,
    });
    navigate(`/app/lock/${lock.id}`);
  };

  return (
    <div className="hero">
      <Header {...props} />
      <div className="create-page">
        <p className="section-tag">CREATE LOCK · {mode.toUpperCase()}</p>
        <h1 className="dash-title">New vesting stream</h1>

        <form onSubmit={submit} className="create-form">
          <label>RECIPIENT WALLET</label>
          <div className="row">
            <input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="0x..." />
            <button type="button" className="secondary" onClick={() => setRecipient("0xbeefca5e000000000000000000000000000beef1")}>Use demo address</button>
          </div>

          <div className="two-col">
            <div>
              <label>TOKEN</label>
              <select value={token} onChange={(e) => setToken(e.target.value)}>
                {TOKENS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label>AMOUNT</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>

          <label>UNLOCK DURATION</label>
          <div className="duration-pills">
            {DURATIONS.map((d) => (
              <button type="button" key={d.min} className={duration === d.min ? "duration-pill active" : "duration-pill"} onClick={() => setDuration(d.min)}>{d.label}</button>
            ))}
          </div>
          <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
          <p className="hint">Minutes. Tokens fully unlock after this duration.</p>

          <label>UNLOCK CURVE</label>
          <div className="curve-row">
            <button type="button" className={curve === "linear" ? "curve-card active" : "curve-card"} onClick={() => setCurve("linear")}>
              <h3>Linear</h3><p>Unlocks smoothly over time</p>
            </button>
            <button type="button" className={curve === "cliff" ? "curve-card active" : "curve-card"} onClick={() => setCurve("cliff")}>
              <h3>Cliff</h3><p>All tokens unlock at the end</p>
            </button>
          </div>

          <label>LABEL (OPTIONAL)</label>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Team vesting Q1 2026" />

          <button type="submit" className="submit-btn">🔒 Lock & Start Stream</button>
        </form>
      </div>
    </div>
  );
}
export default CreateLock;