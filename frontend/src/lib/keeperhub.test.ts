import { describe, expect, it } from "vitest";
import {
  basescanTxUrl,
  ipfsGatewayUrl,
  keeperHubExecutionUrl,
  keeperHubWorkflowUrl
} from "./keeperhub";

describe("KeeperHub deep links", () => {
  it("builds workflow URLs", () => {
    expect(keeperHubWorkflowUrl("5goaid2zjgzyb32661se3")).toBe(
      "https://app.keeperhub.com/workflows/5goaid2zjgzyb32661se3"
    );
    expect(keeperHubWorkflowUrl(null)).toBeNull();
  });

  it("builds execution URLs with and without workflow", () => {
    expect(keeperHubExecutionUrl("5goaid2zjgzyb32661se3", "667ekg3qk5f45127eqjyy")).toBe(
      "https://app.keeperhub.com/workflows/5goaid2zjgzyb32661se3/executions/667ekg3qk5f45127eqjyy"
    );
    expect(keeperHubExecutionUrl(undefined, "667ekg3qk5f45127eqjyy")).toBe(
      "https://app.keeperhub.com/executions/667ekg3qk5f45127eqjyy"
    );
    expect(keeperHubExecutionUrl("wf", null)).toBeNull();
  });

  it("builds BaseScan and IPFS URLs", () => {
    expect(basescanTxUrl("https://basescan.org", "0xabc")).toBe("https://basescan.org/tx/0xabc");
    expect(ipfsGatewayUrl("https://ipfs.io/ipfs/", "QmTest")).toBe("https://ipfs.io/ipfs/QmTest");
    expect(ipfsGatewayUrl("https://ipfs.io", "QmTest")).toBe("https://ipfs.io/ipfs/QmTest");
  });
});
