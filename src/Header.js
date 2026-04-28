import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { connectMetaMask, shortAddress, hasMetaMask, getBalance } from "./lib/wallet";

export default function Header({ mode, setMode, wallet, setWallet }) {
  const [apiOnline, setApiOnline] = useState(false);
  const [balance, setBalance] = useState(null);
  const API_BASE = (process.env.REACT_APP_API_URL || "https://cryolock-backend-tyxe.onrender.com").replace(/\/+$/, "");

  // Ping backend every 5 seconds
useEffect(() => {
  const check = async () => {
    const endpoint = `${API_BASE}/api/stats`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    try {
      // Preferred path: normal CORS request with real HTTP status.
      const r = await fetch(endpoint, { signal: controller.signal, cache: "no-store" });
      setApiOnline(r.ok);
      return;
    } catch {
      // Fallback: if CORS policy blocks readable responses, no-cors still tells us if host is reachable.
      try {
        await fetch(endpoint, { mode: "no-cors", signal: controller.signal, cache: "no-store" });
        setApiOnline(true);
      } catch {
        setApiOnline(false);
      }
    } finally {
      clearTimeout(timeout);
    }
  };

  check();
  const t = setInterval(check, 5000);
  return () => clearInterval(t);
}, [API_BASE]);
  // Listen for MetaMask account changes
  useEffect(() => {
    if (!hasMetaMask()) return;
    const handler = (a) => setWallet(a[0] || null);
    window.ethereum.on("accountsChanged", handler);
    return () => window.ethereum.removeListener("accountsChanged", handler);
  }, [setWallet]);

  // Fetch ETH balance when wallet connects in onchain mode
  useEffect(() => {
    if (mode !== "onchain" || !wallet) { setBalance(null); return; }
    getBalance(wallet).then(setBalance).catch(() => setBalance(null));
  }, [wallet, mode]);

  const handleConnect = async () => {
    if (mode === "demo") return alert("Demo mode is active — no wallet needed. Switch to ON-CHAIN to connect MetaMask.");
    try {
      const addr = await connectMetaMask();
      setWallet(addr);
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="nav">
      <Link to="/" className="logo-link">
        <div className="logo-icon"><Lock size={16} strokeWidth={2.5} color="black" /></div>
        <h2>CRYOLOCK</h2>
        <span className="logo-version">V1</span>
      </Link>

      <div className="nav-links">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/app" className="nav-link">Dashboard</Link>
        <Link to="/app/create" className="nav-link">Create Lock</Link>
      </div>

      <div className="nav-right">
        {/* API Status indicator */}
        <div className={`api-status ${apiOnline ? "online" : "offline"}`} title={apiOnline ? "Backend connected" : "Backend offline"}>
          <span className={apiOnline ? "dot-pulse" : "dot-grey"}></span>
          API {apiOnline ? "LIVE" : "OFFLINE"}
        </div>

        {/* Mode toggle */}
        <div className="mode-toggle">
          <button className={mode === "demo" ? "mode-pill active" : "mode-pill"} onClick={() => setMode("demo")}>⚡ DEMO</button>
          <button className={mode === "onchain" ? "mode-pill active" : "mode-pill"} onClick={() => setMode("onchain")}>ON-CHAIN</button>
        </div>

        {/* Status button */}
        {mode === "demo" ? (
          <button className="status-btn demo-active" disabled>
            <span className="dot-pulse"></span>Demo Active
          </button>
        ) : wallet ? (
          <button className="status-btn connected" onClick={() => setWallet(null)} title={`${wallet}\nClick to disconnect`}>
            <span className="dot-pulse"></span>
            {balance ? `${Number(balance).toFixed(4)} ETH · ` : ""}{shortAddress(wallet)}
          </button>
        ) : (
          <button className="status-btn" onClick={handleConnect}>Connect Wallet</button>
        )}
      </div>
    </div>
  );
}
