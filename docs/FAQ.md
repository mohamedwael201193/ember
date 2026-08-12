# FAQ

## Is EMBER a KeeperHub replacement?

No. KeeperHub executes. EMBER preserves continuity when obligations were never requested.

## Do I need an EMBER MCP server?

No. Connect your agent to KeeperHub MCP: `https://app.keeperhub.com/mcp`.

## Can one MCP connection see Org A and Org B?

No. Add two MCP server entries with separate org keys / OAuth sessions.

## Which API key?

Organisation-scoped `kh_…` keys. Not user-scoped `wfb_…`.

## Will `pnpm setup` spend money?

No. Default local demo uses fixtures only.

## Is production UI always a fresh payment?

No. When writes are gated, payment story may be **CERTIFIED MAINNET SNAPSHOT** — real history, not a new spend.

## What is the safe MCP test?

Workflow `vewqfp44zmpa9dtctlrdr` — Base Sepolia balance check. No USDC transfer.

## Where is architecture detail?

[ARCHITECTURE.md](../ARCHITECTURE.md) and [WHAT_IS_EMBER.md](./WHAT_IS_EMBER.md).
