// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.28;

import {Script} from "forge-std/Script.sol";
import {Continuity, IERC20} from "../src/Continuity.sol";

contract DeployContinuity is Script {
    function run() external returns (Continuity continuity) {
        address usdc = vm.envAddress("USDC_ADDRESS");
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerKey);
        continuity = new Continuity(IERC20(usdc));
        vm.stopBroadcast();
    }
}
