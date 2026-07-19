import { describe, expect, it } from "vitest";
import { canonicalSha256, deterministicJson, sha256Hex } from "./canonicalize.js";

describe("canonical JSON", () => {
  it("sorts object keys recursively and hashes stable bytes", () => {
    const left = { z: [true, { b: 2, a: 1 }], a: "ember" };
    const right = { a: "ember", z: [true, { a: 1, b: 2 }] };
    expect(deterministicJson(left)).toBe('{"a":"ember","z":[true,{"a":1,"b":2}]}');
    expect(canonicalSha256(left)).toBe(canonicalSha256(right));
    expect(sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
  });

  it("rejects non-finite numbers", () => {
    expect(() => deterministicJson(Number.NaN)).toThrow(TypeError);
  });
});
