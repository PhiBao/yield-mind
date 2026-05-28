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
        uint256 chainId = block.chainid;

        if (chainId != 421614 && chainId != 42161 && chainId != 46630) {
            revert("Unsupported chain");
        }

        // Pick USDC address based on chain
        address usdc;
        string memory chainName;
        if (chainId == 421614) {
            usdc = USDC_ARBITRUM_SEPOLIA;
            chainName = "Arbitrum Sepolia";
        } else if (chainId == 42161) {
            usdc = USDC_ARBITRUM_ONE;
            chainName = "Arbitrum One";
        } else {
            // RHC testnet — set USDC in .env override
            string memory envUsdc = vm.envOr("USDC_ADDRESS", string(""));
            usdc = vm.parseAddress(envUsdc);
            chainName = "Robinhood Testnet";
        }

        console.log("Chain:               %s (%d)", chainName, chainId);
        console.log("Deployer address:", deployer);
        console.log("Deployer balance (ETH):", deployer.balance);

        vm.startBroadcast(deployerKey);

        StrategyRegistry registry = new StrategyRegistry(address(0));
        Vault vault = new Vault(usdc, deployer, address(registry));
        registry.setVault(address(vault));

        vm.stopBroadcast();

        console.log("");
        console.log("=== DEPLOYMENT COMPLETE ===");
        console.log("Vault:              ", address(vault));
        console.log("StrategyRegistry:   ", address(registry));
        console.log("Asset (USDC):        ", usdc);
        console.log("Agent (deployer):     ", deployer);
        console.log("");
    }
}
