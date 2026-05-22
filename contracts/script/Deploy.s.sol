pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {Vault} from "../src/Vault.sol";
import {StrategyRegistry} from "../src/StrategyRegistry.sol";

contract DeployScript is Script {
    address constant USDC_ARBITRUM_ONE = 0xaf88d065e77c8cC2239327C5EDb3A432268e5831;
    address constant USDC_ARBITRUM_SEPOLIA = 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d;

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        console.log("Deployer address:", deployer);
        console.log("Deployer balance (ETH):", deployer.balance);

        vm.startBroadcast(deployerKey);

        StrategyRegistry registry = new StrategyRegistry(address(0));
        Vault vault = new Vault(USDC_ARBITRUM_SEPOLIA, deployer, address(registry));
        registry.setVault(address(vault));

        vm.stopBroadcast();

        console.log("");
        console.log("=== DEPLOYMENT COMPLETE ===");
        console.log("Vault:              ", address(vault));
        console.log("StrategyRegistry:   ", address(registry));
        console.log("Asset (USDC):        ", USDC_ARBITRUM_SEPOLIA);
        console.log("Agent (deployer):     ", deployer);
        console.log("");
        console.log("Run verification:");
        console.log("forge verify-contract", address(vault), "src/Vault.sol:Vault --chain arbitrum-sepolia");
        console.log("forge verify-contract", address(registry), "src/StrategyRegistry.sol:StrategyRegistry --chain arbitrum-sepolia");
        console.log("");
        console.log("To verify the vault->registry link, run:");
        console.log("cast call", address(vault), '"strategyRegistry()(address)" --rpc-url arbitrum_sepolia');
        console.log("cast call", address(registry), '"vault()(address)" --rpc-url arbitrum_sepolia');
    }
}
