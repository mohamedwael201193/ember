// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.28;

import {Script} from "forge-std/Script.sol";
import {Continuity, IERC20} from "../src/Continuity.sol";

interface IERC20Approve is IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
}

contract FundMission is Script {
    function run() external {
        Continuity continuity = Continuity(vm.envAddress("CONTINUITY_ADDRESS"));
        IERC20Approve usdc = IERC20Approve(vm.envAddress("USDC_ADDRESS"));
        uint256 missionId = vm.envUint("MISSION_ID");
        uint256 amount = vm.envUint("ESCROW_FUND_USDC");
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        vm.startBroadcast(deployerKey);
        require(usdc.approve(address(continuity), amount), "approve failed");
        continuity.fund(missionId, amount);
        vm.stopBroadcast();
    }
}
