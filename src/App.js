import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Landing from "./Landing";
import Dashboard from "./Dashboard";
import CreateLock from "./CreateLock";
import LockDetail from "./LockDetail";
import { DEMO_WALLET } from "./lib/wallet";
import { seedDemoIfEmpty } from "./lib/store";
import "./App.css";

function App() {
  const [mode, setMode] = useState(localStorage.getItem("cryolock.mode") || "demo");
  const [wallet, setWallet] = useState(null);

  useEffect(() => { localStorage.setItem("cryolock.mode", mode); }, [mode]);
  useEffect(() => { seedDemoIfEmpty(DEMO_WALLET); }, []);

  const activeWallet = mode === "demo" ? DEMO_WALLET : wallet;
  const ctx = { mode, setMode, wallet, setWallet, activeWallet };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing {...ctx} />} />
        <Route path="/app" element={<Dashboard {...ctx} />} />
        <Route path="/app/create" element={<CreateLock {...ctx} />} />
        <Route path="/app/lock/:id" element={<LockDetail {...ctx} />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;