// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {MockUSDC} from "../src/MockUSDC.sol";
import {Vault} from "../src/Vault.sol";
import {StrategyRegistry} from "../src/StrategyRegistry.sol";

contract DeployRHC is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        console.log("Chain ID:", block.chainid);
        console.log("Deployer:", deployer);
        console.log("Balance (ETH): %s", deployer.balance);

        vm.startBroadcast(deployerKey);

        // 1. Deploy mock USDC
        MockUSDC usdc = new MockUSDC();
        console.log("MockUSDC:", address(usdc));

        // 2. Mint test USDC to deployer
        usdc.mint(deployer, 1_000_000_000_000); // 1M USDC (6 decimals)
        console.log("Minted 1M USDC to deployer");

        // 3. Deploy registry + vault
        StrategyRegistry registry = new StrategyRegistry(address(0));
        Vault vault = new Vault(address(usdc), deployer, address(registry));
        registry.setVault(address(vault));

        vm.stopBroadcast();

        console.log("");
        console.log("=== RHC DEPLOYMENT DONE ===");
        console.log("MockUSDC:            %s", address(usdc));
        console.log("Vault:               %s", address(vault));
        console.log("StrategyRegistry:    %s", address(registry));
        console.log("Agent (deployer):    %s", deployer);
    }
}
