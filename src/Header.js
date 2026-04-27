import { Link } from "react-router-dom";
import { useEffect } from "react";
import { Lock } from "lucide-react";
import { connectMetaMask, shortAddress, hasMetaMask } from "./lib/wallet";

export default function Header({ mode, setMode, wallet, setWallet }) {
  useEffect(() => {
    if (!hasMetaMask()) return;
    const handler = (a) => setWallet(a[0] || null);
    window.ethereum.on("accountsChanged", handler);
    return () => window.ethereum.removeListener("accountsChanged", handler);
  }, [setWallet]);

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
        <div className="logo-icon">
          <Lock size={16} strokeWidth={2.5} color="black" />
        </div>
        <h2>CRYOLOCK</h2>
        <span className="logo-version">V1</span>
      </Link>
      <div className="nav-links">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/app" className="nav-link">Dashboard</Link>
        <Link to="/app/create" className="nav-link">Create Lock</Link>
      </div>
      <div className="nav-right">
        <div className="mode-toggle">
          <button className={mode === "demo" ? "mode-pill active" : "mode-pill"} onClick={() => setMode("demo")}>⚡ DEMO</button>
          <button className={mode === "onchain" ? "mode-pill active" : "mode-pill"} onClick={() => setMode("onchain")}>ON-CHAIN</button>
        </div>
        {mode === "demo" ? (
          <button className="status-btn demo-active" disabled><span className="dot-pulse"></span>Demo Active</button>
        ) : wallet ? (
          <button className="status-btn connected" onClick={() => setWallet(null)}><span className="dot-pulse"></span>{shortAddress(wallet)}</button>
        ) : (
          <button className="status-btn" onClick={handleConnect}>Connect Wallet</button>
        )}
      </div>
    </div>
  );
}