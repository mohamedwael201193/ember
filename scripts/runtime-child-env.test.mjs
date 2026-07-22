import { describe, expect, it } from "vitest";
import {
  OBSERVER_ENV_KEYS,
  PAYDAY_ENV_KEYS,
  SENTINEL_ENV_KEYS,
  buildChildEnv
} from "./runtime-child-env.mjs";

const source = {
  PATH: "/usr/bin",
  KH_API_BASE: "https://app.keeperhub.com",
  KH_API_KEY_PRIMARY_EXECUTOR: "executor-secret",
  KH_API_KEY_PRIMARY_OBSERVER: "observer-secret",
  KH_API_KEY_STANDBY: "standby-secret",
  PINATA_JWT: "pinata-secret",
  DEPLOYER_PRIVATE_KEY: "deployer-secret",
  SENTINEL_POLL_SECONDS: "120",
  SENTINEL_SHARED_SECRET: "sentinel-secret",
  PRIMARY_OBSERVER_SHARED_SECRET: "observer-hmac"
};

describe("combined runtime child environment isolation", () => {
  it("gives Observer only its Org A observer credential", () => {
    const env = buildChildEnv(source, OBSERVER_ENV_KEYS, { PORT: "8788" }, [
      "DEPLOYER_PRIVATE_KEY",
      "KH_API_KEY_PRIMARY_EXECUTOR",
      "KH_API_KEY_STANDBY",
      "PINATA_JWT"
    ]);
    expect(env.KH_API_KEY_PRIMARY_OBSERVER).toBe("observer-secret");
    expect(env.KH_API_KEY_PRIMARY_EXECUTOR).toBeUndefined();
    expect(env.KH_API_KEY_STANDBY).toBeUndefined();
    expect(env.PINATA_JWT).toBeUndefined();
  });

  it("keeps Org B and proof credentials out of PAYDAY", () => {
    const env = buildChildEnv(
      source,
      PAYDAY_ENV_KEYS,
      { PORT: "8789", RESCUE_JOURNAL_DIR: "/tmp/payday" },
      ["DEPLOYER_PRIVATE_KEY", "KH_API_KEY_PRIMARY_OBSERVER", "KH_API_KEY_STANDBY", "PINATA_JWT"]
    );
    expect(env.KH_API_KEY_PRIMARY_EXECUTOR).toBe("executor-secret");
    expect(env.KH_API_KEY_PRIMARY_OBSERVER).toBeUndefined();
    expect(env.KH_API_KEY_STANDBY).toBeUndefined();
    expect(env.PINATA_JWT).toBeUndefined();
  });

  it("keeps both Org A API keys out of Sentinel", () => {
    const env = buildChildEnv(
      source,
      SENTINEL_ENV_KEYS,
      { PORT: 8787, PRIMARY_OBSERVER_URL: "http://127.0.0.1:8788" },
      ["DEPLOYER_PRIVATE_KEY", "KH_API_KEY_PRIMARY_EXECUTOR", "KH_API_KEY_PRIMARY_OBSERVER"]
    );
    expect(env.KH_API_KEY_STANDBY).toBe("standby-secret");
    expect(env.KH_API_KEY_PRIMARY_EXECUTOR).toBeUndefined();
    expect(env.KH_API_KEY_PRIMARY_OBSERVER).toBeUndefined();
    expect(env.SENTINEL_POLL_SECONDS).toBe("120");
    expect(env.PORT).toBe("8787");
  });
});
