// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.28;

import "../src/Continuity.sol";
import "./Continuity.t.sol";
import "forge-std/StdInvariant.sol";

/// @dev Lightweight invariant harness — recorded escrow is always backed by contract USDC.
contract ContinuityInvariantTest is StdInvariant {
    TestUSDC private usdc;
    Continuity private continuity;
    Standby private standby;
    uint256 private missionId;

    function setUp() public {
        usdc = new TestUSDC();
        continuity = new Continuity(usdc);
        standby = new Standby();
        usdc.mint(address(this), 10_000_000);
        usdc.approve(address(continuity), type(uint256).max);
        missionId = continuity.registerMission(
            keccak256("workflow"), uint64(block.timestamp), 300, 5_000_000, address(0xBEEF), address(standby), 500_000
        );
        continuity.fund(missionId, 1_000_000);
        targetContract(address(continuity));
    }

    function invariant_escrowIsBackedByUsdc() public view {
        (,,,, uint128 escrowBalance,,,,) = continuity.missions(missionId);
        require(escrowBalance <= usdc.balanceOf(address(continuity)), "escrow is not backed");
    }
}
