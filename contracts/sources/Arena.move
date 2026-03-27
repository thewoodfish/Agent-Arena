/// Arena module — match creation, staking, and result verification on OneChain.
/// Matches are shared objects; stakes are held in escrow as OCT coin balances.
module agent_arena::arena {
    use one::object::{Self, UID, ID};
    use one::coin::{Self, Coin};
    use one::balance::{Self, Balance};
    use one::oct::OCT;
    use one::transfer;
    use one::tx_context::{Self, TxContext};
    use one::event;
    use std::option::{Self, Option};
    use std::vector;
    use agent_arena::agent::{Self, Agent};

    // ─── Error constants ───────────────────────────────────────────────────────
    const ENOT_ADMIN: u64 = 1;
    const EMATCH_NOT_FOUND: u64 = 2;
    const EMATCH_NOT_PENDING: u64 = 3;
    const EMATCH_NOT_ACTIVE: u64 = 4;
    const ESAME_PLAYER: u64 = 5;
    const ENOT_PLAYER: u64 = 6;
    const EWRONG_STAKE: u64 = 7;

    // ─── Structs ───────────────────────────────────────────────────────────────

    /// A shared arena match object. Lives onchain until completed or cancelled.
    public struct Match has key {
        id: UID,
        player1: address,
        player2: address,
        agent1_id: ID,
        agent2_id: Option<ID>,
        stake_amount: u64,
        /// 0=pending, 1=active, 2=complete
        status: u8,
        winner: Option<address>,
        /// SHA-256 hash of engine result for trustless verification
        result_hash: vector<u8>,
        /// Combined OCT stakes held in escrow
        escrow: Balance<OCT>,
    }

    /// Singleton admin capability — held by the deployer.
    public struct AdminCap has key, store {
        id: UID,
    }

    // ─── Events ────────────────────────────────────────────────────────────────

    public struct MatchCreated has copy, drop {
        match_id: ID,
        player1: address,
        agent1_id: ID,
        stake: u64,
    }

    public struct MatchStarted has copy, drop {
        match_id: ID,
        player2: address,
        agent2_id: ID,
    }

    public struct MatchCompleted has copy, drop {
        match_id: ID,
        winner: address,
        reward_amount: u64,
        result_hash: vector<u8>,
    }

    // ─── Initialization ────────────────────────────────────────────────────────

    /// Called once at publish time — mints AdminCap to deployer.
    fun init(ctx: &mut TxContext) {
        transfer::transfer(AdminCap { id: object::new(ctx) }, tx_context::sender(ctx));
    }

    // ─── Entry functions ───────────────────────────────────────────────────────

    /// Player creates a match, locking their stake into escrow.
    /// The Match becomes a shared object — anyone can join it.
    public entry fun create_match(
        agent: &Agent,
        stake: Coin<OCT>,
        ctx: &mut TxContext,
    ) {
        let player = tx_context::sender(ctx);
        assert!(agent::owner(agent) == player, ENOT_PLAYER);

        let stake_amount = coin::value(&stake);

        let match_obj = Match {
            id: object::new(ctx),
            player1: player,
            player2: @0x0,
            agent1_id: agent::id(agent),
            agent2_id: option::none(),
            stake_amount,
            status: 0,
            winner: option::none(),
            result_hash: vector::empty(),
            escrow: coin::into_balance(stake),
        };

        event::emit(MatchCreated {
            match_id: object::uid_to_inner(&match_obj.id),
            player1: player,
            agent1_id: agent::id(agent),
            stake: stake_amount,
        });

        // Make the Match a shared object so any player can join
        transfer::share_object(match_obj);
    }

    /// Second player joins a pending match, paying the same stake amount.
    public entry fun join_match(
        match_obj: &mut Match,
        agent: &Agent,
        stake: Coin<OCT>,
        ctx: &mut TxContext,
    ) {
        let player = tx_context::sender(ctx);
        assert!(match_obj.status == 0, EMATCH_NOT_PENDING);
        assert!(match_obj.player1 != player, ESAME_PLAYER);
        assert!(agent::owner(agent) == player, ENOT_PLAYER);
        assert!(coin::value(&stake) == match_obj.stake_amount, EWRONG_STAKE);

        // Add stake to escrow
        let stake_balance = coin::into_balance(stake);
        balance::join(&mut match_obj.escrow, stake_balance);

        match_obj.player2 = player;
        match_obj.agent2_id = option::some(agent::id(agent));
        match_obj.status = 1;

        event::emit(MatchStarted {
            match_id: object::uid_to_inner(&match_obj.id),
            player2: player,
            agent2_id: agent::id(agent),
        });
    }

    /// Admin submits verified result hash and pays the winner.
    /// The result_hash is produced by the deterministic Python engine
    /// and can be independently recomputed by anyone to verify correctness.
    public entry fun submit_result(
        _cap: &AdminCap,
        match_obj: &mut Match,
        winner_address: address,
        result_hash: vector<u8>,
        winner_agent: &mut Agent,
        loser_agent: &mut Agent,
        ctx: &mut TxContext,
    ) {
        assert!(match_obj.status == 1, EMATCH_NOT_ACTIVE);
        assert!(
            winner_address == match_obj.player1 || winner_address == match_obj.player2,
            ENOT_PLAYER
        );

        let prize = balance::value(&match_obj.escrow);
        let prize_coin = coin::from_balance(
            balance::split(&mut match_obj.escrow, prize),
            ctx,
        );

        match_obj.status = 2;
        match_obj.winner = option::some(winner_address);
        match_obj.result_hash = result_hash;

        // Update win/loss counters on the Agent NFTs
        agent::record_win(winner_agent);
        agent::record_loss(loser_agent);

        // Transfer full prize pool to winner
        transfer::public_transfer(prize_coin, winner_address);

        event::emit(MatchCompleted {
            match_id: object::uid_to_inner(&match_obj.id),
            winner: winner_address,
            reward_amount: prize,
            result_hash,
        });
    }

    /// Cancel a pending match and refund player1.
    public entry fun cancel_match(
        match_obj: &mut Match,
        ctx: &mut TxContext,
    ) {
        let player = tx_context::sender(ctx);
        assert!(match_obj.status == 0, EMATCH_NOT_PENDING);
        assert!(match_obj.player1 == player, ENOT_PLAYER);

        let refund_amount = balance::value(&match_obj.escrow);
        let refund = coin::from_balance(
            balance::split(&mut match_obj.escrow, refund_amount),
            ctx,
        );

        match_obj.status = 2;
        transfer::public_transfer(refund, player);
    }

    // ─── View accessors ────────────────────────────────────────────────────────

    public fun match_status(m: &Match): u8 { m.status }
    public fun match_player1(m: &Match): address { m.player1 }
    public fun match_player2(m: &Match): address { m.player2 }
    public fun match_stake(m: &Match): u64 { m.stake_amount }
    public fun match_winner(m: &Match): Option<address> { m.winner }
}
