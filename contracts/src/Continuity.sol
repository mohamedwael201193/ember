// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.28;

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract Continuity {
    enum FeeMode {
        NONE,
        X402,
        MPP,
        ESCROW_FALLBACK
    }

    struct Mission {
        bytes32 workflowHash;
        uint64 startAt;
        uint64 cadenceSeconds;
        uint128 budget;
        uint128 escrowBalance;
        uint128 maxFeePerRescue;
        address beneficiary;
        address standby;
        bool exists;
    }

    struct RescueProof {
        bytes32 proofHash;
        string ipfsUri;
        uint64 missedRuns;
        uint64 replayedRuns;
        FeeMode feeMode;
        string feeReference;
        bool feeClaimed;
    }

    IERC20 public immutable usdc;
    address public immutable owner;
    uint256 public missionCount;
    uint256 private unlocked = 1;

    mapping(uint256 missionId => Mission) public missions;
    mapping(uint256 missionId => mapping(bytes32 rescueId => RescueProof)) private rescueProofs;

    event MissionRegistered(
        uint256 indexed missionId,
        bytes32 indexed workflowHash,
        address indexed beneficiary,
        address standby,
        uint64 startAt,
        uint64 cadenceSeconds,
        uint128 budget,
        uint128 maxFeePerRescue
    );
    event Funded(uint256 indexed missionId, address indexed funder, uint256 amount);
    event ProofAnchored(
        uint256 indexed missionId,
        bytes32 indexed rescueId,
        bytes32 proofHash,
        FeeMode feeMode,
        string ipfsUri,
        string feeReference
    );
    event FeeClaimed(uint256 indexed missionId, bytes32 indexed rescueId, address indexed standby, uint256 amount);
    event StandbyChanged(uint256 indexed missionId, address indexed previousStandby, address indexed newStandby);

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner");
        _;
    }

    modifier onlyStandby(uint256 missionId) {
        require(missions[missionId].exists, "unknown mission");
        require(msg.sender == missions[missionId].standby, "only standby");
        _;
    }

    modifier nonReentrant() {
        require(unlocked == 1, "reentrant call");
        unlocked = 2;
        _;
        unlocked = 1;
    }

    constructor(IERC20 usdc_) {
        require(address(usdc_) != address(0), "zero token");
        usdc = usdc_;
        owner = msg.sender;
    }

    function registerMission(
        bytes32 workflowHash,
        uint64 startAt,
        uint64 cadenceSeconds,
        uint128 budget,
        address beneficiary,
        address standby,
        uint128 maxFeePerRescue
    ) external onlyOwner returns (uint256 missionId) {
        require(workflowHash != bytes32(0), "zero workflow hash");
        // Mission start is an operator-declared UTC anchor; slight validator skew is acceptable.
        // Slither timestamp: the mission schedule is intentionally anchored to chain time.
        // forge-lint: disable-start(block-timestamp)
        // slither-disable-next-line timestamp
        require(startAt >= block.timestamp, "past start");
        // forge-lint: disable-end(block-timestamp)
        require(cadenceSeconds > 0, "zero cadence");
        require(budget > 0, "zero budget");
        require(beneficiary != address(0) && standby != address(0), "zero address");
        require(maxFeePerRescue > 0, "zero fee cap");

        missionId = ++missionCount;
        missions[missionId] = Mission({
            workflowHash: workflowHash,
            startAt: startAt,
            cadenceSeconds: cadenceSeconds,
            budget: budget,
            escrowBalance: 0,
            maxFeePerRescue: maxFeePerRescue,
            beneficiary: beneficiary,
            standby: standby,
            exists: true
        });
        emit MissionRegistered(
            missionId, workflowHash, beneficiary, standby, startAt, cadenceSeconds, budget, maxFeePerRescue
        );
    }

    // Slither reentrancy: this path is protected by nonReentrant. The exact balance
    // equality is intentional so fee-on-transfer/rebasing tokens are rejected.
    // slither-disable-start reentrancy-no-eth,reentrancy-balance,incorrect-equality
    function fund(uint256 missionId, uint256 amount) external nonReentrant {
        Mission storage mission = missions[missionId];
        require(mission.exists, "unknown mission");
        require(amount > 0, "zero amount");
        require(amount <= type(uint128).max, "amount overflow");
        uint256 beforeBalance = usdc.balanceOf(address(this));
        require(usdc.transferFrom(msg.sender, address(this), amount), "transfer failed");
        require(usdc.balanceOf(address(this)) == beforeBalance + amount, "unsupported token");
        // casting to 'uint128' is safe because amount was checked against type(uint128).max
        // forge-lint: disable-next-line(unsafe-typecast)
        mission.escrowBalance += uint128(amount);
        emit Funded(missionId, msg.sender, amount);
    }
    // slither-disable-end reentrancy-no-eth,reentrancy-balance,incorrect-equality

    function anchorProof(
        uint256 missionId,
        bytes32 rescueId,
        bytes32 proofHash,
        string calldata ipfsUri,
        uint64 missedRuns,
        uint64 replayedRuns,
        FeeMode feeMode,
        string calldata feeReference
    ) external onlyStandby(missionId) {
        require(rescueId != bytes32(0) && proofHash != bytes32(0), "zero proof data");
        require(bytes(ipfsUri).length > 0, "empty ipfs uri");
        require(feeMode != FeeMode.NONE, "unset fee mode");
        require(replayedRuns <= missedRuns, "invalid replay count");
        RescueProof storage proof = rescueProofs[missionId][rescueId];
        require(proof.proofHash == bytes32(0), "rescue anchored");
        if (feeMode == FeeMode.X402 || feeMode == FeeMode.MPP) {
            require(bytes(feeReference).length > 0, "missing fee reference");
        }

        rescueProofs[missionId][rescueId] = RescueProof({
            proofHash: proofHash,
            ipfsUri: ipfsUri,
            missedRuns: missedRuns,
            replayedRuns: replayedRuns,
            feeMode: feeMode,
            feeReference: feeReference,
            feeClaimed: false
        });
        emit ProofAnchored(missionId, rescueId, proofHash, feeMode, ipfsUri, feeReference);
    }

    function claimFee(uint256 missionId, bytes32 rescueId, uint256 amount)
        external
        onlyStandby(missionId)
        nonReentrant
    {
        Mission storage mission = missions[missionId];
        RescueProof storage proof = rescueProofs[missionId][rescueId];
        require(proof.proofHash != bytes32(0), "proof missing");
        require(proof.feeMode == FeeMode.ESCROW_FALLBACK, "external fee selected");
        require(!proof.feeClaimed, "fee claimed");
        require(amount > 0 && amount <= mission.maxFeePerRescue, "fee cap");
        require(amount <= mission.escrowBalance, "insufficient escrow");

        proof.feeClaimed = true;
        // casting to 'uint128' is safe because amount was checked against escrowBalance (uint128)
        // forge-lint: disable-next-line(unsafe-typecast)
        mission.escrowBalance -= uint128(amount);
        require(usdc.transfer(msg.sender, amount), "transfer failed");
        emit FeeClaimed(missionId, rescueId, msg.sender, amount);
    }

    function setStandby(uint256 missionId, address newStandby) external onlyOwner {
        Mission storage mission = missions[missionId];
        require(mission.exists, "unknown mission");
        require(newStandby != address(0), "zero standby");
        address previousStandby = mission.standby;
        mission.standby = newStandby;
        emit StandbyChanged(missionId, previousStandby, newStandby);
    }

    function rescueProof(uint256 missionId, bytes32 rescueId) external view returns (RescueProof memory) {
        return rescueProofs[missionId][rescueId];
    }
}
