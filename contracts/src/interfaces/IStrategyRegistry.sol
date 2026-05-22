pragma solidity ^0.8.26;

struct Strategy {
    uint256 allocationBps;
    uint8 riskLevel;
    uint256 rebalanceThreshold;
    bool active;
}

interface IStrategyRegistry {
    function setStrategy(address user, Strategy calldata strategy) external;
    function getStrategy(address user) external view returns (Strategy memory);
    function setUserRebalance(address user, uint256 newAllocationBps) external;
    event StrategyUpdated(address indexed user, uint256 allocationBps, uint8 riskLevel);
    event RebalanceTriggered(address indexed user, uint256 newAllocationBps);
}
