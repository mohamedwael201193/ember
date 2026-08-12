# Safe smoke test

Workflow: **EMBER MCP Smoke Test**  
ID: `vewqfp44zmpa9dtctlrdr`  
Path: Manual → `web3/check-balance` on Base Sepolia (`84532`)  
Spend: **none** (no USDC transfer)

## Steps

1. Connect Org A MCP  
2. `execute_workflow` with a unique `idempotency_key`  
3. `get_execution` until `success`  
4. Confirm `transactionHashes` empty / no USDC  
5. Match `executionId` in KeeperHub Runs UI  

Example verified execution (DX pass): `dy0alz2vlnujwimbbx8b0`
