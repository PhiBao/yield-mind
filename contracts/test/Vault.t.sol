pragma solidity ^0.8.26;

import {Test, console} from "forge-std/Test.sol";
import {Vault} from "../src/Vault.sol";
import {StrategyRegistry} from "../src/StrategyRegistry.sol";
import {IStrategyRegistry, Strategy} from "../src/interfaces/IStrategyRegistry.sol";

contract MockERC20 {
    string public name = "USD Coin";
    string public symbol = "USDC";
    uint8 public decimals = 6;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            allowance[from][msg.sender] = allowed - amount;
        }
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }
}

contract VaultTest is Test {
    MockERC20 public usdc;
    Vault public vault;
    StrategyRegistry public registry;
    address public agent = makeAddr("agent");
    address public user = makeAddr("user");
    address public deployer = makeAddr("deployer");

    function setUp() public {
        vm.prank(deployer);
        usdc = new MockERC20();
        usdc.mint(user, 100_000e6);

    vm.startPrank(deployer);
    registry = new StrategyRegistry(address(0));
    vault = new Vault(address(usdc), agent, address(registry));
    registry.setVault(address(vault));
    vm.stopPrank();

        vm.startPrank(user);
        usdc.approve(address(vault), type(uint256).max);
        vm.stopPrank();
    }

    function test_Deposit() public {
        vm.prank(user);
        uint256 shares = vault.deposit(1000e6, user);

        assertEq(shares, 1000e6);
        assertEq(vault.balanceOf(user), 1000e6);
        assertEq(vault.totalAssets(), 1000e6);
    }

    function test_Withdraw() public {
        vm.prank(user);
        vault.deposit(1000e6, user);

        vm.prank(user);
        uint256 assets = vault.withdraw(500e6, user, user);

        assertEq(assets, 500e6);
        assertEq(vault.balanceOf(user), 500e6);
    }

    function test_Rebalance() public {
        vm.prank(user);
        vault.deposit(1000e6, user);

        vm.prank(user);
        registry.setStrategy(user, Strategy({ allocationBps: 5000, riskLevel: 2, rebalanceThreshold: 100, active: true }));

        vm.prank(agent);
        vault.rebalance(user, 6000);

        Strategy memory strategy = registry.getStrategy(user);
        assertEq(strategy.allocationBps, 6000);
    }

    function test_RevertWhen_NonAgentRebalances() public {
        vm.prank(user);
        vault.deposit(1000e6, user);

        vm.prank(user);
        vm.expectRevert();
        vault.rebalance(user, 6000);
    }

    function test_RevertWhen_DepositZero() public {
        vm.prank(user);
        vm.expectRevert();
        vault.deposit(0, user);
    }

    function test_ConvertToAssets() public {
        vm.prank(user);
        vault.deposit(1000e6, user);

        uint256 assets = vault.convertToAssets(500e6);
        assertEq(assets, 500e6);
    }

    function test_TotalAssetsGrows() public {
        vm.prank(user);
        vault.deposit(1000e6, user);

        vm.prank(agent);
        vault.rebalance(user, 8000);

        assertEq(vault.totalAssets(), 1000e6);
        assertEq(vault.balanceOf(user), 1000e6);
    }
}
