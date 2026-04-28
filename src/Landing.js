import { Link } from "react-router-dom";
import { Timer, Shield, Layers, Lock } from "lucide-react";
import Header from "./Header";
import "./App.css";

const WATCH_IMG = "https://static.prod-images.emergentagent.com/jobs/100ad24e-79e4-4d91-8b64-5d826f03d6fc/images/e165373a9dfafa511268ca41c0d1ec3e97bf94aec38285ed4a3cd7361e443d53.png";

function Landing(props) {
  return (
    <div className="hero">
      <Header {...props} />
      <div className="hero-content">
        <p className="badge"><span className="dot-pulse"></span>POWERED BY SABLIER V2 · SEPOLIA TESTNET</p>
        <h1>Lock crypto.<br/>Stream unlocks<br/><span>in real-time.</span></h1>
        <p className="desc">A programmable token vesting dApp built on the Sablier protocol. Create unlock schedules and track streaming in real-time.</p>
        <div className="buttons">
          <Link to="/app"><button>Launch App →</button></Link>
          <Link to="/app/create"><button className="secondary">Create a Lock →</button></Link>
        </div>
        <div className="stats-row">
          <div className="stat"><h2>552K+</h2><p>STREAMS CREATED</p></div>
          <div className="stat"><h2>28+</h2><p>EVM CHAINS</p></div>
          <div className="stat"><h2>297K+</h2><p>USERS SERVED</p></div>
          <div className="stat"><h2>$1B+</h2><p>VALUE LOCKED</p></div>
        </div>
      </div>

      <div className="section">
        <p className="section-tag">01 / WHY CRYOLOCK</p>
        <h2 className="section-title">I built CryoLock to simplify how token vesting works without needing deep blockchain knowledge.</h2>
        <div className="grid">
          <div className="card large card-with-image" style={{ backgroundImage: `url(${WATCH_IMG})` }}>
            <div className="card-inner">
              <Timer className="card-icon blue" size={32} />
              <h3>Real-time streams</h3>
              <p className="card-desc">Watch token unlocks flow second-by-second with smooth animated progress bars. Pick between linear unlock curves or cliff vesting.</p>
              <p className="card-tag">LINEAR · CLIFF · CUSTOM</p>
            </div>
          </div>

          <div className="card small">
            <Shield className="card-icon green" size={32} />
            <h3>Trustless & transparent</h3>
            <p className="card-desc">Every lock on-chain. No admin keys, no backdoors. Pure smart-contract escrow.</p>
            <p className="card-tag">IMMUTABLE</p>
          </div>

          <div className="card small">
            <Layers className="card-icon blue" size={32} />
            <h3>Demo Mode</h3>
            <p className="card-desc">Explore every feature without a wallet. Simulated locks with live countdowns.</p>
            <p className="card-tag">NO METAMASK NEEDED</p>
          </div>

          <div className="card large">
            <Lock className="card-icon green" size={32} />
            <h3>Token vesting for every team</h3>
            <p className="card-desc">Perfect for employee token grants, DAO contributor vesting, airdrop cliffs, and locked liquidity. Import any ERC-20 on Sepolia testnet.</p>
            <p className="card-tag">ERC-20 COMPATIBLE · ETH · USDC · DAI · CUSTOM</p>
          </div>
        </div>
      </div>

      <div className="section">
        <p className="section-tag">02 / HOW IT WORKS</p>
        <h2 className="section-title">Three steps to stream tokens.</h2>
        <div className="steps">
          <div className="step"><span>01</span><h3>Connect & configure</h3><p>Connect MetaMask (or Demo). Set recipient, token, amount, duration and curve.</p></div>
          <div className="step"><span>02</span><h3>Lock & stream</h3><p>Tokens go into contract. Unlocks begin streaming per-second.</p></div>
          <div className="step"><span>03</span><h3>Withdraw anytime</h3><p>Recipient withdraws anytime. Creator can cancel remaining.</p></div>
        </div>
        <Link to="/app"><button className="cta">Open the app →</button></Link>
      </div>

      <div className="footer">
        <p>© 2026 CRYOLOCK · B.Tech Full-Stack Project</p>
        <p>Built on Sablier V2 · React · ethers.js · localStorage demo backend</p>
      </div>
    </div>
  );
}
export default Landing;
