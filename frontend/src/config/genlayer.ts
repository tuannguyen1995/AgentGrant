import { studionet } from 'genlayer-js/chains';

// Canonical Deployed Contract on GenLayer StudioNet (Chain ID: 61999)
export const DEFAULT_CONTRACT_ADDRESS = "0x11d1890338F6f2ed0400387DdfA8Bd84CE936A28";

export const GENLAYER_STUDIONET = {
  ...studionet,
  id: 61999,
  name: "Genlayer Studio Network",
  rpcUrls: {
    default: { http: ["https://studio.genlayer.com/api"] },
    public: { http: ["https://studio.genlayer.com/api"] },
  },
  blockExplorers: {
    default: { name: "GenLayer Explorer", url: "https://genlayer-explorer.vercel.app" },
  },
  nativeCurrency: {
    name: "GEN Token",
    symbol: "GEN",
    decimals: 18,
  },
};

export const CHAIN_ID_DECIMAL = 61999;
// 61999 in hex is 0xF22F (also compatible with 0xF1EF in some studio builds)
export const CHAIN_ID_HEX = "0x" + (61999).toString(16); // 0xf22f
