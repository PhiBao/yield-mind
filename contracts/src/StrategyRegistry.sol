pragma solidity ^0.8.26;

import {IStrategyRegistry, Strategy} from "./interfaces/IStrategyRegistry.sol";

contract StrategyRegistry is IStrategyRegistry {
    error Unauthorized();
    error InvalidBps();
    error InvalidRiskLevel();
    error StrategyNotFound();

    address public vault;
    address public owner;

    mapping(address => Strategy) public strategies;

    modifier onlyVault() {
        if (msg.sender != vault) revert Unauthorized();
        _;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    constructor(address _vault) {
        vault = _vault;
        owner = msg.sender;
    }

    function setStrategy(address user, Strategy calldata strategy) external {
        if (msg.sender != user && msg.sender != owner) revert Unauthorized();
        if (strategy.allocationBps > 10000) revert InvalidBps();
        if (strategy.riskLevel > 10) revert InvalidRiskLevel();

        strategies[user] = strategy;
        emit StrategyUpdated(user, strategy.allocationBps, strategy.riskLevel);
    }

    function getStrategy(address user) external view returns (Strategy memory) {
        Strategy memory s = strategies[user];
        if (!s.active && user != owner) revert StrategyNotFound();
        return s;
    }

    function setUserRebalance(address user, uint256 newAllocationBps) external onlyVault {
        if (newAllocationBps > 10000) revert InvalidBps();
        strategies[user].allocationBps = newAllocationBps;
        emit RebalanceTriggered(user, newAllocationBps);
    }

    function setVault(address _vault) external onlyOwner {
        vault = _vault;
    }

    function toggleStrategy(address user) external onlyOwner {
        strategies[user].active = !strategies[user].active;
    }
}
