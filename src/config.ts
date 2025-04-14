import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { base } from "@reown/appkit/networks";
import { cookieStorage, createStorage } from "@wagmi/core";

// you can get your own projectId from https://cloud.reown.com
// this is required for anything relying on WalletConnect
export const projectId = "33e35e156c18ff190a09b4616b78878c";

if (!projectId) {
  throw new Error("Project ID is not defined");
}

export const networks = [base];

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks,
});

export const config = wagmiAdapter.wagmiConfig;
