export type MissionHealthState =
  | "WARMING_UP"
  | "OK"
  | "DEGRADED"
  | "MISSION_DOWN"
  | "RESCUING"
  | "RECOVERED";

export interface PublicConfig {
  network: string;
  chainId: number;
  missionId: string;
  continuity?: string;
  workflowHash?: string;
  orgAWorkflowId?: string;
  orgBReplayWorkflowId?: string;
  runtimeUrl: string;
  explorerBase: string;
  ipfsGateway: string;
}

export interface CheckResponse {
  missionId?: string | null;
  state?: MissionHealthState;
  missedSlots?: number[];
  receiptBacked?: boolean;
  receiptVerifiedPayments?: number;
  network?: string;
  chainId?: number;
  nextSlotAt?: number;
  [key: string]: unknown;
}

export interface ServiceReadiness {
  name: string;
  ok: boolean;
  detail?: unknown;
}

export interface DashboardSnapshot {
  checkedAt: string;
  config: PublicConfig;
  health: unknown;
  ready: unknown;
  status: unknown;
  check: CheckResponse | null;
  checkStatus: number;
  serviceReadiness: ServiceReadiness[];
}

export interface RescueJournal {
  version?: number;
  missionId?: string;
  rescueId?: string;
  status?: "IN_PROGRESS" | "COMPLETED" | "ABORTED";
  unpaidSlots?: number[];
  replays?: Array<{
    slot: number;
    executionId?: string;
    txHash?: string;
  }>;
  proofCid?: string;
  proofHash?: string;
  proofSha256?: string;
  proofIpfsUri?: string;
  anchorTxHash?: string;
  stepsCompleted?: string[];
  [key: string]: unknown;
}

export interface MainnetEvidence {
  continuity: string;
  missionId: string;
  chainId: number;
  network: string;
  paydaySlots: Array<{
    slot: number;
    executionId: string;
    transactionHash: string;
    explorer?: string;
  }>;
  rescue?: RescueJournal;
  proofCid?: string;
  anchorTx?: string;
  rescueId?: string;
  balances?: {
    orgA?: string;
    orgB?: string;
    employee?: string;
    continuity?: string;
  };
}
