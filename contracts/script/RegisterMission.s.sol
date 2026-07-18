// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.28;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {Continuity} from "../src/Continuity.sol";

contract RegisterMission is Script {
    function run() external {
        Continuity continuity = Continuity(vm.envAddress("CONTINUITY_ADDRESS"));
        bytes32 workflowHash = vm.envBytes32("WORKFLOW_HASH");
        uint64 startAt = uint64(vm.envUint("MISSION_START_AT"));
        uint64 cadenceSeconds = uint64(vm.envUint("CADENCE_SECONDS"));
        uint128 budget = uint128(vm.envUint("PAYROLL_BUDGET_USDC"));
        address beneficiary = vm.envAddress("EMPLOYEE_ADDRESS");
        address standby = vm.envAddress("ORG_B_WALLET_ADDRESS");
        uint128 maxFeePerRescue = uint128(vm.envUint("X402_MAX_FEE_USDC"));
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        vm.startBroadcast(deployerKey);
        uint256 missionId = continuity.registerMission(
            workflowHash, startAt, cadenceSeconds, budget, beneficiary, standby, maxFeePerRescue
        );
        vm.stopBroadcast();
        console2.log("missionId", missionId);
    }
}
