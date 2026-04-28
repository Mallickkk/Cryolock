import { BrowserProvider, formatEther } from "ethers";

export const DEMO_WALLET = "0xdem0cafe000000000000000000000000000000d0";
export const SEPOLIA_HEX = "0xaa36a7";

export const shortAddress = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");

export const hasMetaMask = () => typeof window !== "undefined" && !!window.ethereum;

export async function connectMetaMask() {
  if (!hasMetaMask()) throw new Error("MetaMask not detected. Install from metamask.io");
  const provider = new BrowserProvider(window.ethereum);
  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_HEX }],
    });
  } catch { /* ignore */ }
  await provider.getNetwork();
  return accounts[0];
}

export async function getBalance(address) {
  if (!hasMetaMask()) return null;
  const provider = new BrowserProvider(window.ethereum);
  const bal = await provider.getBalance(address);
  return formatEther(bal);
}

export async function signMessage(message, address) {
  if (!hasMetaMask()) throw new Error("MetaMask not detected");
  const sig = await window.ethereum.request({
    method: "personal_sign",
    params: [message, address],
  });
  return sig;
}
