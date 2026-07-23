#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../contracts"
set -a
# shellcheck disable=SC1091
source ../.env
set +a

export CONTINUITY_ADDRESS="${CONTINUITY_ADDRESS_MAINNET:-0x068bB96e849F0DE3D49944Ec0F4aEd3D6B165770}"
export WORKFLOW_HASH="${WORKFLOW_HASH_MAINNET}"
export USDC_ADDRESS="${USDC_ADDRESS_BASE}"
export RPC_URL="${BASE_RPC_URL_FALLBACK:-https://mainnet.base.org}"

NOW="$(date +%s)"
# Start two cadence windows ahead so registration clears past-start checks.
export MISSION_START_AT="$((NOW + CADENCE_SECONDS * 2))"

echo "CONTINUITY_ADDRESS=$CONTINUITY_ADDRESS"
echo "WORKFLOW_HASH=$WORKFLOW_HASH"
echo "MISSION_START_AT=$MISSION_START_AT"
echo "CADENCE_SECONDS=$CADENCE_SECONDS"
echo "PAYROLL_BUDGET_USDC=$PAYROLL_BUDGET_USDC"
echo "EMPLOYEE_ADDRESS=$EMPLOYEE_ADDRESS"
echo "ORG_B_WALLET_ADDRESS=$ORG_B_WALLET_ADDRESS"
echo "X402_MAX_FEE_USDC=$X402_MAX_FEE_USDC"
echo "ESCROW_FUND_USDC=$ESCROW_FUND_USDC"

~/.foundry/bin/forge script script/RegisterMission.s.sol \
  --rpc-url "$RPC_URL" \
  --broadcast \
  --private-key "$DEPLOYER_PRIVATE_KEY" \
  -vv | tee /tmp/ember-mainnet-register.log

# Parse mission id from console output if present; default to 1 for first mission.
MISSION_ID="$(grep -Eo 'missionId[[:space:]]+[0-9]+' /tmp/ember-mainnet-register.log | awk '{print $2}' | tail -n1 || true)"
if [[ -z "${MISSION_ID}" ]]; then
  MISSION_ID="$(~/.foundry/bin/cast call "$CONTINUITY_ADDRESS" 'missionCount()(uint256)' --rpc-url "$RPC_URL")"
fi
export MISSION_ID
echo "MISSION_ID=$MISSION_ID"

~/.foundry/bin/forge script script/FundMission.s.sol \
  --rpc-url "$RPC_URL" \
  --broadcast \
  --private-key "$DEPLOYER_PRIVATE_KEY" \
  -vv | tee /tmp/ember-mainnet-fund.log

echo "REGISTER_START_AT=$MISSION_START_AT"
echo "REGISTERED_MISSION_ID=$MISSION_ID"
