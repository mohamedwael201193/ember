# Agent prompts (copy-paste)

Safe by default. Prompts that can spend money are marked **WARNING** and require explicit human confirmation.

Use with KeeperHub MCP connected. Prefer naming the MCP server (`keeperhub-org-a` / `keeperhub-org-b`) when both are configured.

---

## 1. Connect / verify

```text
Call tools_documentation. Summarize the safe workflow inspect → validate → execute → get_execution loop. Do not execute anything.
```

```text
Confirm which KeeperHub organization this MCP connection can see. List up to 10 workflow names and IDs. Do not execute.
```

---

## 2. Inspect EMBER (repo)

```text
Open the EMBER repo README and docs/WHAT_IS_EMBER.md. In 8 bullets explain: problem, KeeperHub role, EMBER role, Org A vs Org B, proof, and local demo vs live observer. Do not invent merged PRs or live spends.
```

---

## 3. Inspect KeeperHub (read-only)

```text
Inspect the EMBER primary payroll workflow in KeeperHub. Do not execute anything. Show workflow ID, organization, nodes, trigger type, action type, wallet integration, network, enabled flag, and the latest successful execution if list_executions is available.
```

Known primary ID: `5goaid2zjgzyb32661se3` (`payday-stream-mainnet`).

```text
Inspect Org B replay workflow pvhwggqr8318wac68jb62 on the Org B MCP server only. Do not execute. Report name, nodes, network, amount, enabled flag, and description.
```

---

## 4. Validate workflow

```text
Validate the EMBER primary workflow 5goaid2zjgzyb32661se3 with KeeperHub MCP. Do not enable schedules or create writes. Report every error/warning and how to fix it.
```

---

## 5. Safe test (no USDC spend)

```text
Run the EMBER smoke workflow only: vewqfp44zmpa9dtctlrdr. Use a unique idempotency_key. Wait for execution completion via get_execution. Return executionId, status, logs, and confirm there is no USDC transfer. Do not run payroll workflows.
```

---

## 6. Read execution

```text
Get execution <EXECUTION_ID> via get_execution. Summarize status, node outcomes, errors, transactionHashes, and whether this was a read or write path. Do not re-execute.
```

---

## 7. Explain failure

```text
Explain why KeeperHub execution <EXECUTION_ID> failed using get_execution logs. Propose a fix. Do not retry writes unless I explicitly confirm.
```

---

## 8. Build new workflow

```text
Using list_action_schemas and ai_generate_workflow, propose a Base Sepolia read-only balance-check workflow. Do not create it until I say "create". Prefer disabled after create. Do not enable schedules.
```

---

## 9. Two-org EMBER recovery setup

```text
Inspect both Ember KeeperHub organizations (keeperhub-org-a and keeperhub-org-b) and explain which is primary and which is standby. List the primary payroll and replay workflow IDs. Do not execute anything.
```

```text
Explain how EMBER uses Org A for primary payday and Org B for standby replay. Confirm one MCP connection cannot see both orgs. Do not execute.
```

---

## 10. Troubleshoot MCP

```text
I cannot see EMBER workflows. Diagnose: auth method, org scoping, wrong key type (kh_ vs wfb_), and whether I need a second MCP server for Org B. Do not execute workflows.
```

---

## 11. Run local verification

```text
From the EMBER repo root, tell me the exact commands for pnpm setup, pnpm doctor, pnpm test, and pnpm build. Explain what DEVELOPMENT_MODE=1 means. Do not request secrets.
```

---

## 12. Verify production

```text
Verify production without writes: GET https://ember-web-seven.vercel.app/ and https://ember-api-8qzg.onrender.com/healthz and /readyz. Summarize status. Do not trigger KeeperHub spends.
```

---

## 13. Prepare demo

```text
Prepare a ≤2:30 demo path using docs/DEMO_RUNBOOK.md and docs/FINAL_FILMING_CHECKLIST.md. Prefer MCP inspect + validate + smoke, KeeperHub canvas/Runs for Org A, certified mainnet evidence for payment story, and Org B only for rescue narrative. No new mainnet spends.
```

---

## WARNING — spend paths (human confirmation required)

Only use after an explicit typed confirmation such as: `I CONFIRM MAINNET WRITE`.

```text
WARNING: This can move real USDC. Only if I already typed I CONFIRM MAINNET WRITE: execute primary workflow 5goaid2zjgzyb32661se3 once with a unique idempotency_key, poll get_execution, and return executionId + transactionHashes. Otherwise refuse.
```

```text
WARNING: Rescue replay can move real USDC on Org B. Only if I already typed I CONFIRM ORG B REPLAY: execute pvhwggqr8318wac68jb62 once with a unique idempotency_key and poll get_execution. Otherwise refuse.
```

Never enable a recurring production schedule from a prompt unless the operator explicitly requests schedule enablement in writing.
