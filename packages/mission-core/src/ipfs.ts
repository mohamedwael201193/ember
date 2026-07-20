import { sha256Hex } from "./canonicalize.js";

export interface PinResult {
  cid: string;
  bytes: Uint8Array;
  sha256: string;
}

async function checkedResponse(response: Response): Promise<Response> {
  if (!response.ok) throw new Error(`IPFS request failed with HTTP ${response.status}`);
  return response;
}

export async function pinJson(
  pinataJwt: string,
  value: unknown,
  fetcher: typeof fetch = fetch
): Promise<PinResult> {
  const body = JSON.stringify(value);
  const response = await checkedResponse(
    await fetcher("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      signal: AbortSignal.timeout(60_000),
      headers: { authorization: `Bearer ${pinataJwt}`, "content-type": "application/json" },
      body
    })
  );
  const result: unknown = await response.json();
  if (
    !result ||
    typeof result !== "object" ||
    !("IpfsHash" in result) ||
    typeof result.IpfsHash !== "string"
  ) {
    throw new Error("Pinata response does not contain IpfsHash");
  }
  const bytes = new TextEncoder().encode(body);
  return { cid: result.IpfsHash, bytes, sha256: sha256Hex(bytes) };
}

export async function fetchAndRehash(
  gateway: string,
  cid: string,
  expectedSha256: string,
  fetcher: typeof fetch = fetch
): Promise<Uint8Array> {
  const bytes = new Uint8Array(
    await (
      await checkedResponse(
        await fetcher(`${gateway.replace(/\/$/, "")}/${cid}`, {
          signal: AbortSignal.timeout(60_000)
        })
      )
    ).arrayBuffer()
  );
  if (sha256Hex(bytes) !== expectedSha256) throw new Error("IPFS content hash mismatch");
  return bytes;
}
