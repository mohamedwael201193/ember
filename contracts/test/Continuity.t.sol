// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.28;

import "../src/Continuity.sol";

contract TestUSDC is IERC20 {
    mapping(address => uint256) public balances;
    mapping(address => mapping(address => uint256)) public allowances;

    function mint(address account, uint256 amount) external {
        balances[account] += amount;
    }

    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balances[msg.sender] >= amount, "insufficient");
        balances[msg.sender] -= amount;
        balances[to] += amount;
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowances[msg.sender][spender] = amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(allowances[from][msg.sender] >= amount, "allowance");
        require(balances[from] >= amount, "insufficient");
        allowances[from][msg.sender] -= amount;
        balances[from] -= amount;
        balances[to] += amount;
        return true;
    }
}

contract Standby {
    function anchor(
        Continuity continuity,
        uint256 missionId,
        bytes32 rescueId,
        Continuity.FeeMode feeMode,
        string calldata feeReference
    ) external {
        continuity.anchorProof(
            missionId, rescueId, keccak256(abi.encodePacked(rescueId)), "ipfs://proof", 2, 2, feeMode, feeReference
        );
    }

    function claim(Continuity continuity, uint256 missionId, bytes32 rescueId, uint256 amount) external {
        continuity.claimFee(missionId, rescueId, amount);
    }
}

contract ContinuityTest {
    TestUSDC private usdc;
    Continuity private continuity;
    Standby private standby;

    function setUp() public {
        usdc = new TestUSDC();
        continuity = new Continuity(usdc);
        standby = new Standby();
        usdc.mint(address(this), 1_000_000);
        usdc.approve(address(continuity), 1_000_000);
    }

    function testExternalPaidRescueCannotClaimEscrow() public {
        uint256 missionId = registerAndFund();
        bytes32 rescueId = keccak256("x402");
        standby.anchor(continuity, missionId, rescueId, Continuity.FeeMode.X402, "settlement-reference");
        (bool succeeded,) =
            address(standby).call(abi.encodeCall(Standby.claim, (continuity, missionId, rescueId, 100_000)));
        require(!succeeded, "external fee was claimable");
    }

    function testEscrowFallbackClaimsExactlyOnce() public {
        uint256 missionId = registerAndFund();
        bytes32 rescueId = keccak256("escrow");
        standby.anchor(continuity, missionId, rescueId, Continuity.FeeMode.ESCROW_FALLBACK, "");
        standby.claim(continuity, missionId, rescueId, 100_000);
        require(usdc.balanceOf(address(standby)) == 100_000, "incorrect fee transfer");
        (bool succeeded,) =
            address(standby).call(abi.encodeCall(Standby.claim, (continuity, missionId, rescueId, 100_000)));
        require(!succeeded, "duplicate fee claim");
    }

    function testRescueAnchoredExactlyOnce() public {
        uint256 missionId = registerAndFund();
        bytes32 rescueId = keccak256("once");
        standby.anchor(continuity, missionId, rescueId, Continuity.FeeMode.MPP, "mpp-ref");
        (bool succeeded,) = address(standby)
            .call(
                abi.encodeCall(Standby.anchor, (continuity, missionId, rescueId, Continuity.FeeMode.MPP, "mpp-ref-2"))
            );
        require(!succeeded, "duplicate anchor");
    }

    function testNonStandbyCannotAnchor() public {
        uint256 missionId = registerAndFund();
        (bool succeeded,) = address(continuity)
            .call(
                abi.encodeCall(
                    Continuity.anchorProof,
                    (
                        missionId,
                        keccak256("rogue"),
                        keccak256("proof"),
                        "ipfs://x",
                        uint64(1),
                        uint64(1),
                        Continuity.FeeMode.ESCROW_FALLBACK,
                        ""
                    )
                )
            );
        require(!succeeded, "non-standby anchored");
    }

    function testClaimAboveMaxFeeReverts() public {
        uint256 missionId = registerAndFund();
        bytes32 rescueId = keccak256("cap");
        standby.anchor(continuity, missionId, rescueId, Continuity.FeeMode.ESCROW_FALLBACK, "");
        (bool succeeded,) =
            address(standby).call(abi.encodeCall(Standby.claim, (continuity, missionId, rescueId, 100_001)));
        require(!succeeded, "over-cap claim");
    }

    function testSetStandbyTransfersAuthority() public {
        uint256 missionId = registerAndFund();
        Standby nextStandby = new Standby();
        continuity.setStandby(missionId, address(nextStandby));
        bytes32 rescueId = keccak256("handoff");
        (bool oldOk,) = address(standby)
            .call(
                abi.encodeCall(
                    Standby.anchor, (continuity, missionId, rescueId, Continuity.FeeMode.ESCROW_FALLBACK, "")
                )
            );
        require(!oldOk, "old standby still authoritative");
        nextStandby.anchor(continuity, missionId, rescueId, Continuity.FeeMode.ESCROW_FALLBACK, "");
    }

    function testWorkflowHashImmutableAfterRegister() public {
        uint256 missionId = registerAndFund();
        (bytes32 workflowHash,,,,,,,,) = continuity.missions(missionId);
        require(workflowHash == keccak256("workflow"), "hash mismatch");
    }

    function registerAndFund() private returns (uint256) {
        uint256 missionId = continuity.registerMission(
            keccak256("workflow"), uint64(block.timestamp), 300, 500_000, address(0xBEEF), address(standby), 100_000
        );
        continuity.fund(missionId, 500_000);
        return missionId;
    }
}
