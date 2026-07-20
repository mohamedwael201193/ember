import { describe, expect, it, vi } from "vitest";
import { sha256Hex } from "./canonicalize.js";
import { fetchAndRehash, pinJson } from "./ipfs.js";

describe("IPFS proof transport", () => {
  it("pins exact JSON bytes with Bearer authentication", async () => {
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      expect(init?.headers).toMatchObject({ authorization: "Bearer pinata-test" });
      expect(init?.body).toBe('{"missionId":"1","version":1}');
      return new Response(JSON.stringify({ IpfsHash: "QmProof" }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    }) as unknown as typeof fetch;

    const result = await pinJson("pinata-test", { missionId: "1", version: 1 }, fetcher);
    expect(result.cid).toBe("QmProof");
    expect(result.sha256).toBe(sha256Hex(result.bytes));
  });

  it("fetches and accepts only the expected content hash", async () => {
    const bytes = new TextEncoder().encode('{"proof":true}');
    const fetcher = vi.fn(
      async () => new Response(bytes, { status: 200 })
    ) as unknown as typeof fetch;

    await expect(
      fetchAndRehash("https://gateway.example/ipfs", "QmProof", sha256Hex(bytes), fetcher)
    ).resolves.toEqual(bytes);
    await expect(
      fetchAndRehash("https://gateway.example/ipfs", "QmProof", "0".repeat(64), fetcher)
    ).rejects.toThrow("content hash mismatch");
  });
});
