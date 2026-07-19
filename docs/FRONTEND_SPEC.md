# EMBER dashboard specification

Frontend implementation is intentionally deferred. This document fixes the
information architecture, API boundary, event model, and visual direction so a
React + Vite client can be built without redesigning the backend.

## Design read

Operations dashboard for technical judges and mission operators. The language
is precise, evidence-first, and moderately dense. Use IBM Carbon for accessible
status, data, notification, and table patterns. Avoid decorative dashboard
cards, neon effects, and simulated terminal windows.

Design dials:

- Design variance: 4
- Motion intensity: 3
- Visual density: 7

Use one neutral theme per user preference, one amber accent for continuity
actions, and semantic Carbon status colors. Motion communicates state changes
only and honors reduced motion.

## Security boundary

The browser receives no KeeperHub key, HMAC secret, Pinata JWT, wallet key, or
deployer key. React must not call `/check`, `/rescue`, or Observer directly.
A server-side BFF added during the frontend phase signs control-plane requests
and returns only the DTOs defined below. Public chain, IPFS, and explorer reads
may be performed directly.

## React + Vite architecture

- React 19 + TypeScript strict mode
- Vite
- `@carbon/react` and `@carbon/styles`
- TanStack Query for server state, retry, and cache invalidation
- React Router for route state
- Zod for runtime DTO validation
- Local reducer for filters and selected evidence only
- No global store unless cross-route draft state becomes necessary
- Vitest + Testing Library + Playwright

Suggested source boundaries:

```text
src/
  app/            router, providers, error boundary
  api/            generated OpenAPI client, DTO validators
  events/         event decoder and reconnect policy
  features/
    overview/
    mission/
    executions/
    rescues/
    proofs/
    operations/
  components/     shared accessible presentation components
  styles/         Carbon overrides and semantic tokens
```

## Navigation

Desktop side navigation, mobile drawer:

1. Overview
2. Mission
3. Executions
4. Rescues
5. Proofs
6. Operations

External links open BaseScan, IPFS, and KeeperHub in a new tab with the domain
shown in the accessible label.

## Component hierarchy

```text
AppShell
  GlobalHeader
    MissionIdentity
    NetworkGuard
    ConnectionState
  SideNavigation
  RouteBoundary
    OverviewPage
      MissionStateBanner
      SlotTimeline
      LatestExecution
      LatestRescue
      ProofIntegrity
    MissionPage
      MissionParameters
      BudgetSummary
      WorkflowHash
      StandbyIdentity
    ExecutionsPage
      ExecutionFilters
      ExecutionDataTable
      ReceiptDrawer
    RescuesPage
      RescueTimeline
      ReplayDataTable
      JournalStepList
    ProofsPage
      ProofHashComparison
      IpfsDocumentViewer
      AnchorTransaction
    OperationsPage
      ServiceReadiness
      MetricsSummary
      ChaosEvidenceList
```

## State model

Mission state is one of:

`WARMING_UP | OK | DEGRADED | MISSION_DOWN | RESCUING | RECOVERED`

Every screen supports:

- Initial loading with shape-matched skeletons
- Empty state with the missing prerequisite named
- Stale state with last successful timestamp
- Recoverable network error with retry
- Invalid DTO error that blocks display of untrusted data
- Partial chain confirmation state

TanStack Query keys:

```text
mission/{network}/{missionId}
executions/{workflowId}/{filters}
rescue/{missionId}/{rescueId}
proof/{missionId}/{rescueId}
services/readiness
```

## Event contract

The future BFF may expose WebSocket events at `/v1/events`. The browser treats
events as cache invalidations, not authoritative state. Every event is followed
by an authenticated HTTP refetch.

Envelope:

```json
{
  "version": 1,
  "eventId": "uuid",
  "occurredAt": "2026-07-22T03:00:00.000Z",
  "missionId": "1",
  "type": "mission.state.changed",
  "data": {}
}
```

Event names:

- `mission.state.changed`
- `execution.terminal`
- `rescue.started`
- `rescue.replay.completed`
- `rescue.completed`
- `proof.pinned`
- `proof.anchored`
- `service.readiness.changed`

Reconnect uses exponential backoff with jitter, capped at 30 seconds. The
client sends the last event ID and performs a full refetch after any gap.

## DTOs

Canonical service HTTP schemas are in
`docs/openapi/ember-services.openapi.yaml`. UI-specific aggregate DTOs are:

```typescript
interface DashboardSnapshot {
  network: "base-sepolia" | "base";
  missionId: string;
  state: MissionHealthState;
  checkedAt: string;
  nextSlotAt: number;
  missedSlots: number[];
  receiptVerifiedPayments: number;
  latestExecution?: ExecutionSummary;
  latestRescue?: RescueSummary;
  serviceReadiness: ServiceReadiness[];
}

interface RescueSummary {
  rescueId: string;
  status: "IN_PROGRESS" | "COMPLETED" | "ABORTED";
  missedRuns: number;
  replayedRuns: number;
  feeMode: "X402" | "MPP" | "ESCROW_FALLBACK";
  proofCid?: string;
  proofHash?: `0x${string}`;
  anchorTransaction?: `0x${string}`;
}
```

Optional fields are omitted, never sent as `null`, unless OpenAPI explicitly
marks them nullable.

## Wireframes

Overview:

```text
+------------------------------------------------------------------+
| EMBER / Mission 1       Base Sepolia        Connected             |
+----------------+-------------------------------------------------+
| Overview       | MISSION OK                                      |
| Mission        | Last verified payment  03:07:38 UTC             |
| Executions     | Next slot              03:12:34 UTC             |
| Rescues        +-----------------------------------------------+ |
| Proofs         | Slot timeline: paid | paid | rescued | next   | |
| Operations     +-----------------------------------------------+ |
|                | Latest rescue          Proof integrity          |
|                | 2 missed, 2 replayed   IPFS = chain = local     |
+----------------+-------------------------------------------------+
```

Rescue detail:

```text
+------------------------------------------------------------------+
| Rescue live2slots / COMPLETED                                    |
+------------------------------------------------------------------+
| Detect | Lock | Verify hash | Reconcile | Replay | Pin | Anchor   |
+------------------------------------------------------------------+
| Slot             Execution             Transaction       Receipt  |
| 1784683914       sbpn2...              0x698d...         Valid    |
| 1784684214       3ff5e...              0x5701...         Valid    |
+------------------------------------------------------------------+
| Proof CID | Local SHA-256 | Stored hash | Anchor transaction     |
+------------------------------------------------------------------+
```

At widths below 768 px, navigation becomes a drawer, tables become labeled
record lists, and the slot timeline scrolls horizontally. No critical value is
communicated by color alone.

## Accessibility and performance gates

- WCAG 2.2 AA minimum
- Keyboard access for every control and data drawer
- Visible focus ring
- Text alternatives for state icons
- UTC timestamps with localized display available
- LCP below 2.5 seconds, INP below 200 ms, CLS below 0.1
- No animation of layout dimensions
- No secrets or full raw error bodies in telemetry
