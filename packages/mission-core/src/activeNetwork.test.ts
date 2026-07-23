import { describe, expect, it } from "vitest";
import { resolveActiveNetwork, resolveActiveNetworkConfig } from "./activeNetwork.js";

describe("resolveActiveNetwork", () => {
  it("defaults to sepolia", () => {
    expect(resolveActiveNetwork({})).toBe("sepolia");
  });

  it("selects mainnet config from mainnet env keys", () => {
    const config = resolveActiveNetworkConfig({
      EMBER_NETWORK: "mainnet",
      CHAIN_ID_MAINNET: "8453",
      CONTINUITY_ADDRESS_MAINNET: "0xmain",
      MISSION_ID_MAINNET: "1",
      WORKFLOW_HASH_MAINNET: "0xhash",
      USDC_ADDRESS_BASE: "0xusdc",
      BASE_RPC_URL: "https://example.invalid/rpc",
      BASE_RPC_URL_FALLBACK: "https://mainnet.base.org"
    });
    expect(config.network).toBe("mainnet");
    expect(config.chainId).toBe(8453);
    expect(config.continuityAddress).toBe("0xmain");
    expect(config.usdcAddress).toBe("0xusdc");
    expect(config.rpcUrls).toEqual([
      "https://example.invalid/rpc",
      "https://mainnet.base.org"
    ]);
  });
});
