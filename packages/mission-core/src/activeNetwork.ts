export type ActiveNetwork = "mainnet" | "sepolia";

export type ActiveNetworkConfig = {
  network: ActiveNetwork;
  chainId: number;
  continuityAddress: string | undefined;
  missionId: string | undefined;
  workflowHash: string | undefined;
  usdcAddress: string | undefined;
  rpcUrls: string[];
};

function firstDefined(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    if (value !== undefined && value !== "") return value;
  }
  return undefined;
}

export function resolveActiveNetwork(
  env: Record<string, string | undefined> = process.env
): ActiveNetwork {
  const raw = (env.EMBER_NETWORK ?? "sepolia").trim().toLowerCase();
  if (raw === "mainnet" || raw === "8453" || raw === "base") return "mainnet";
  if (raw === "sepolia" || raw === "84532" || raw === "base-sepolia") return "sepolia";
  throw new Error(`EMBER_NETWORK must be mainnet or sepolia (got ${raw})`);
}

export function resolveActiveNetworkConfig(
  env: Record<string, string | undefined> = process.env
): ActiveNetworkConfig {
  const network = resolveActiveNetwork(env);
  if (network === "mainnet") {
    return {
      network,
      chainId: Number(env.CHAIN_ID_MAINNET ?? 8453),
      continuityAddress: firstDefined(env.CONTINUITY_ADDRESS_MAINNET, env.CONTINUITY_ADDRESS_SEPOLIA),
      missionId: firstDefined(env.MISSION_ID_MAINNET, env.MISSION_ID_SEPOLIA),
      workflowHash: firstDefined(env.WORKFLOW_HASH_MAINNET, env.WORKFLOW_HASH_SEPOLIA),
      usdcAddress: firstDefined(env.USDC_ADDRESS_BASE, env.USDC_ADDRESS_BASE_SEPOLIA),
      rpcUrls: [env.BASE_RPC_URL, env.BASE_RPC_URL_FALLBACK].filter(
        (value): value is string => Boolean(value)
      )
    };
  }
  return {
    network,
    chainId: Number(env.CHAIN_ID_REHEARSAL ?? 84532),
    continuityAddress: env.CONTINUITY_ADDRESS_SEPOLIA,
    missionId: env.MISSION_ID_SEPOLIA,
    workflowHash: env.WORKFLOW_HASH_SEPOLIA,
    usdcAddress: env.USDC_ADDRESS_BASE_SEPOLIA,
    rpcUrls: [env.BASE_SEPOLIA_RPC_URL, env.BASE_SEPOLIA_RPC_URL_FALLBACK].filter(
      (value): value is string => Boolean(value)
    )
  };
}
