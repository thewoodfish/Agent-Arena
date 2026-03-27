/// Agent NFT module for Agent Arena on OneChain.
/// Each agent is a first-class Sui/OneChain object owned by a player's wallet.
module agent_arena::agent {
    use one::object::{Self, UID, ID};
    use one::transfer;
    use one::tx_context::{Self, TxContext};
    use one::event;
    use std::string::{Self, String};

    // ─── Error constants ───────────────────────────────────────────────────────
    const EINVALID_PARAM: u64 = 1;
    const ENOT_OWNER: u64 = 2;

    // ─── Structs ───────────────────────────────────────────────────────────────

    /// An agent NFT — a first-class OneChain object owned by a player.
    public struct Agent has key, store {
        id: UID,
        name: String,
        owner: address,
        /// 0 = attacker, 1 = defender, 2 = tactician
        strategy: u8,
        aggression: u8,
        risk_tolerance: u8,
        defense_weight: u8,
        adaptability: u8,
        power_rating: u8,
        wins: u64,
        losses: u64,
    }

    // ─── Events ────────────────────────────────────────────────────────────────

    public struct AgentCreated has copy, drop {
        agent_id: ID,
        owner: address,
        name: String,
        power_rating: u8,
    }

    public struct AgentUpdated has copy, drop {
        agent_id: ID,
        owner: address,
    }

    // ─── View helpers ──────────────────────────────────────────────────────────

    /// Compute power rating: (aggression*35 + risk*20 + defense*20 + adapt*25) / 100
    public fun compute_power_rating(
        aggression: u8,
        risk_tolerance: u8,
        defense_weight: u8,
        adaptability: u8,
    ): u8 {
        let a = (aggression as u64);
        let r = (risk_tolerance as u64);
        let d = (defense_weight as u64);
        let ad = (adaptability as u64);
        ((a * 35 + r * 20 + d * 20 + ad * 25) / 100 as u8)
    }

    // Accessors for Arena module
    public fun owner(agent: &Agent): address { agent.owner }
    public fun id(agent: &Agent): ID { object::uid_to_inner(&agent.id) }
    public fun wins(agent: &Agent): u64 { agent.wins }
    public fun losses(agent: &Agent): u64 { agent.losses }
    public fun power_rating(agent: &Agent): u8 { agent.power_rating }

    // ─── Entry functions ───────────────────────────────────────────────────────

    /// Mint a new Agent NFT and transfer it to the sender's wallet.
    public entry fun create_agent(
        name: vector<u8>,
        strategy: u8,
        aggression: u8,
        risk_tolerance: u8,
        defense_weight: u8,
        adaptability: u8,
        ctx: &mut TxContext,
    ) {
        assert!(strategy <= 2, EINVALID_PARAM);
        assert!(aggression <= 100, EINVALID_PARAM);
        assert!(risk_tolerance <= 100, EINVALID_PARAM);
        assert!(defense_weight <= 100, EINVALID_PARAM);
        assert!(adaptability <= 100, EINVALID_PARAM);

        let sender = tx_context::sender(ctx);
        let power = compute_power_rating(aggression, risk_tolerance, defense_weight, adaptability);
        let agent_name = string::utf8(name);

        let agent = Agent {
            id: object::new(ctx),
            name: agent_name,
            owner: sender,
            strategy,
            aggression,
            risk_tolerance,
            defense_weight,
            adaptability,
            power_rating: power,
            wins: 0,
            losses: 0,
        };

        event::emit(AgentCreated {
            agent_id: object::uid_to_inner(&agent.id),
            owner: sender,
            name: agent_name,
            power_rating: power,
        });

        // Transfer NFT object directly to the sender's wallet
        transfer::transfer(agent, sender);
    }

    /// Update an agent's strategy params. Requires the caller to own the Agent object.
    public entry fun update_strategy(
        agent: &mut Agent,
        strategy: u8,
        aggression: u8,
        risk_tolerance: u8,
        defense_weight: u8,
        adaptability: u8,
        ctx: &mut TxContext,
    ) {
        assert!(strategy <= 2, EINVALID_PARAM);
        assert!(aggression <= 100, EINVALID_PARAM);
        assert!(risk_tolerance <= 100, EINVALID_PARAM);
        assert!(defense_weight <= 100, EINVALID_PARAM);
        assert!(adaptability <= 100, EINVALID_PARAM);
        assert!(agent.owner == tx_context::sender(ctx), ENOT_OWNER);

        agent.strategy = strategy;
        agent.aggression = aggression;
        agent.risk_tolerance = risk_tolerance;
        agent.defense_weight = defense_weight;
        agent.adaptability = adaptability;
        agent.power_rating = compute_power_rating(aggression, risk_tolerance, defense_weight, adaptability);

        event::emit(AgentUpdated {
            agent_id: object::uid_to_inner(&agent.id),
            owner: agent.owner,
        });
    }

    /// Record a win — called by the arena after match completion.
    public fun record_win(agent: &mut Agent) {
        agent.wins = agent.wins + 1;
    }

    /// Record a loss — called by the arena after match completion.
    public fun record_loss(agent: &mut Agent) {
        agent.losses = agent.losses + 1;
    }
}
