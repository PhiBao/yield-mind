pragma solidity ^0.8.26;

import {IERC4626} from "./interfaces/IERC4626.sol";
import {IStrategyRegistry} from "./interfaces/IStrategyRegistry.sol";

contract Vault is IERC4626 {
    error Unauthorized();
    error InvalidAmount();
    error InsufficientShares();
    error InsufficientAssets();
    error ZeroAddress();
    error TransferFailed();

    address public immutable asset;
    address public agent;
    IStrategyRegistry public strategyRegistry;

    uint256 public totalAssets_;
    uint256 public totalSupply_;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public shareAllowance;

    modifier onlyAgent() {
        if (msg.sender != agent) revert Unauthorized();
        _;
    }

    event AgentUpdated(address indexed oldAgent, address indexed newAgent);

    constructor(address _asset, address _agent, address _strategyRegistry) {
        if (_asset == address(0)) revert ZeroAddress();
        if (_agent == address(0)) revert ZeroAddress();
        asset = _asset;
        agent = _agent;
        strategyRegistry = IStrategyRegistry(_strategyRegistry);
    }

    function setAgent(address _agent) external onlyAgent {
        if (_agent == address(0)) revert ZeroAddress();
        emit AgentUpdated(agent, _agent);
        agent = _agent;
    }

    function deposit(uint256 assets, address receiver) external returns (uint256 shares) {
        if (assets == 0) revert InvalidAmount();
        shares = convertToShares(assets);
        if (shares == 0) revert InvalidAmount();

        bool ok = IERC20(asset).transferFrom(msg.sender, address(this), assets);
        if (!ok) revert TransferFailed();

        _mint(receiver, shares);
        totalAssets_ += assets;

        emit Deposit(msg.sender, receiver, assets, shares);
    }

    function mint(uint256 shares, address receiver) external returns (uint256 assets) {
        if (shares == 0) revert InvalidAmount();
        assets = convertToAssets(shares);
        if (assets == 0) revert InvalidAmount();

        bool ok = IERC20(asset).transferFrom(msg.sender, address(this), assets);
        if (!ok) revert TransferFailed();

        _mint(receiver, shares);
        totalAssets_ += assets;

        emit Deposit(msg.sender, receiver, assets, shares);
    }

    function withdraw(uint256 assets, address receiver, address owner) external returns (uint256 shares) {
        if (assets == 0) revert InvalidAmount();
        shares = convertToShares(assets);
        if (shares == 0) revert InsufficientAssets();

        _spendAllowance(owner, msg.sender, shares);
        _burn(owner, shares);
        totalAssets_ -= assets;

        bool ok = IERC20(asset).transfer(receiver, assets);
        if (!ok) revert TransferFailed();

        emit Withdraw(msg.sender, receiver, owner, assets, shares);
    }

    function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets) {
        if (shares == 0) revert InvalidAmount();
        assets = convertToAssets(shares);
        if (assets == 0) revert InsufficientShares();

        _spendAllowance(owner, msg.sender, shares);
        _burn(owner, shares);
        totalAssets_ -= assets;

        bool ok = IERC20(asset).transfer(receiver, assets);
        if (!ok) revert TransferFailed();

        emit Withdraw(msg.sender, receiver, owner, assets, shares);
    }

    function rebalance(address user, uint256 newAllocationBps) external onlyAgent {
        uint256 userAssets = convertToAssets(balanceOf[user]);
        if (userAssets == 0) revert InsufficientAssets();

        strategyRegistry.setUserRebalance(user, newAllocationBps);

        emit RebalanceExecuted(user, newAllocationBps, userAssets);
    }

    function getUserPosition(address user) external view returns (uint256 shares, uint256 assets) {
        shares = balanceOf[user];
        assets = convertToAssets(shares);
    }

    function decimals() public pure returns (uint8) {
        return 6;
    }

    function totalAssets() external view returns (uint256) {
        return totalAssets_;
    }

    function totalSupply() external view returns (uint256) {
        return totalSupply_;
    }

    function convertToShares(uint256 assets) public view returns (uint256) {
        uint256 supply = totalSupply_;
        if (supply == 0) return assets;
        return (assets * supply) / totalAssets_;
    }

    function convertToAssets(uint256 shares) public view returns (uint256) {
        uint256 supply = totalSupply_;
        if (supply == 0) return shares;
        return (shares * totalAssets_) / supply;
    }

    function previewDeposit(uint256 assets) external view returns (uint256) {
        return convertToShares(assets);
    }

    function previewMint(uint256 shares) external view returns (uint256) {
        return convertToAssets(shares);
    }

    function previewWithdraw(uint256 assets) external view returns (uint256) {
        return convertToShares(assets);
    }

    function previewRedeem(uint256 shares) external view returns (uint256) {
        return convertToAssets(shares);
    }

    function _mint(address to, uint256 shares) internal {
        balanceOf[to] += shares;
        totalSupply_ += shares;
    }

    function _burn(address from, uint256 shares) internal {
        balanceOf[from] -= shares;
        totalSupply_ -= shares;
    }

    function _spendAllowance(address owner, address spender, uint256 shares) internal {
        if (owner == spender) return;
        uint256 allowed = shareAllowance[owner][spender];
        if (allowed != type(uint256).max) {
            shareAllowance[owner][spender] = allowed - shares;
        }
    }
}

interface IERC20 {
    function transferFrom(address, address, uint256) external returns (bool);
    function transfer(address, uint256) external returns (bool);
    function approve(address, uint256) external returns (bool);
}
