#![no_std]

extern crate alloc;

use alloc::vec;
use alloc::vec::Vec;
use alloy_primitives::{Address, U256};
use stylus_sdk::prelude::*;
use stylus_sdk::stylus_core::host::{BlockAccess, HostAccess, MessageAccess};

sol_storage! {
    #[entrypoint]
    pub struct AgentExecutor {
        address owner;
        address vault;
        address strategy_registry;

        mapping(address => uint256) user_allocation_bps;
        mapping(address => uint256) user_risk_level;
        mapping(address => uint256) user_last_rebalance;
    }
}

#[public]
impl AgentExecutor {
    pub fn init(&mut self, vault: Address, registry: Address) -> Result<(), Vec<u8>> {
        self.owner.set(self.vm().msg_sender());
        self.vault.set(vault);
        self.strategy_registry.set(registry);
        Ok(())
    }

    pub fn owner(&self) -> Result<Address, Vec<u8>> {
        Ok(self.owner.get())
    }

    pub fn vault(&self) -> Result<Address, Vec<u8>> {
        Ok(self.vault.get())
    }

    pub fn compute_optimal_allocation(
        &self,
        user: Address,
        volatility: U256,
        current_apy: U256,
        risk_tolerance: U256,
    ) -> Result<U256, Vec<u8>> {
        let base_allocation = self.user_allocation_bps.get(user);
        if base_allocation == U256::ZERO {
            return Ok(U256::from(5000));
        }

        let volatility_adjustment = if volatility > U256::from(5000) {
            U256::from(500)
        } else {
            U256::ZERO
        };

        let apy_boost = if current_apy > U256::from(1000) {
            risk_tolerance * U256::from(100)
        } else {
            U256::ZERO
        };

        let mut optimal = base_allocation;

        if risk_tolerance > U256::ZERO {
            optimal = optimal.saturating_add(apy_boost);
            optimal = optimal.saturating_sub(volatility_adjustment);
        }

        if optimal > U256::from(10000) {
            optimal = U256::from(10000);
        }

        Ok(optimal)
    }

    pub fn validate_rebalance(
        &self,
        user: Address,
        proposed_allocation: U256,
    ) -> Result<bool, Vec<u8>> {
        if proposed_allocation > U256::from(10000) {
            return Ok(false);
        }

        let last = self.user_last_rebalance.get(user);
        let current: u64 = self.vm().block_timestamp();
        let elapsed = current.saturating_sub(last.to::<u64>());

        if elapsed < 3600 {
            return Ok(false);
        }

        let current_alloc = self.user_allocation_bps.get(user);
        let diff = if proposed_allocation > current_alloc {
            proposed_allocation - current_alloc
        } else {
            current_alloc - proposed_allocation
        };

        if diff < U256::from(500) {
            return Ok(false);
        }

        Ok(true)
    }

    pub fn execute_rebalance(
        &mut self,
        user: Address,
        allocation_bps: U256,
    ) -> Result<(), Vec<u8>> {
        if self.vm().msg_sender() != self.vault.get() {
            return Err("unauthorized".into());
        }

        let valid = self.validate_rebalance(user, allocation_bps)?;
        if !valid {
            return Err("rebalance conditions not met".into());
        }

        self.user_allocation_bps.insert(user, allocation_bps);
        self.user_last_rebalance.insert(user, U256::from(self.vm().block_timestamp()));

        Ok(())
    }

    pub fn user_allocation(&self, user: Address) -> Result<U256, Vec<u8>> {
        Ok(self.user_allocation_bps.get(user))
    }

    pub fn user_risk_level(&self, user: Address) -> Result<U256, Vec<u8>> {
        Ok(self.user_risk_level.get(user))
    }
}
