/// Integration tests for Agent Arena contracts
#[test_only]
module agent_arena::arena_tests {
    use std::string;
    use std::signer;
    use aptos_framework::account;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::{Self, AptosCoin};
    use aptos_framework::timestamp;
    use agent_arena::agent;
    use agent_arena::arena;

    // ─── Test helpers ──────────────────────────────────────────────────────────

    fun setup_accounts(aptos: &signer, admin: &signer, player1: &signer, player2: &signer) {
        account::create_account_for_test(signer::address_of(admin));
        account::create_account_for_test(signer::address_of(player1));
        account::create_account_for_test(signer::address_of(player2));
        timestamp::set_time_has_started_for_testing(aptos);

        // Initialize AptosCoin and give players balances
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos);
        coin::register<AptosCoin>(admin);
        coin::register<AptosCoin>(player1);
        coin::register<AptosCoin>(player2);

        let coins = coin::mint<AptosCoin>(1_000_000_000, &mint_cap);
        coin::deposit(signer::address_of(player1), coins);
        let coins2 = coin::mint<AptosCoin>(1_000_000_000, &mint_cap);
        coin::deposit(signer::address_of(player2), coins2);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    // ─── Tests ─────────────────────────────────────────────────────────────────

    #[test(aptos = @0x1, admin = @agent_arena, player1 = @0x101, player2 = @0x102)]
    public fun test_create_agent(aptos: signer, admin: signer, player1: signer, player2: signer) {
        setup_accounts(&aptos, &admin, &player1, &player2);
        agent::create_agent(
            &player1,
            b"ALPHA-BOT",
            0, // attacker
            80, // aggression
            60, // risk_tolerance
            40, // defense_weight
            70, // adaptability
        );
        let a = agent::get_agent(signer::address_of(&player1), 0);
        let _ = a; // verify no abort
    }

    #[test(aptos = @0x1, admin = @agent_arena, player1 = @0x101, player2 = @0x102)]
    #[expected_failure(abort_code = 1)] // EINVALID_PARAM
    public fun test_invalid_params(aptos: signer, admin: signer, player1: signer, player2: signer) {
        setup_accounts(&aptos, &admin, &player1, &player2);
        // aggression > 100 should abort
        agent::create_agent(&player1, b"BAD-BOT", 0, 150, 50, 50, 50);
    }

    #[test(aptos = @0x1, admin = @agent_arena, player1 = @0x101, player2 = @0x102)]
    public fun test_power_rating(aptos: signer, admin: signer, player1: signer, player2: signer) {
        setup_accounts(&aptos, &admin, &player1, &player2);
        // (80*35 + 60*20 + 40*20 + 70*25) / 100 = (2800+1200+800+1750)/100 = 6550/100 = 65
        let rating = agent::get_power_rating(80, 60, 40, 70);
        assert!(rating == 65, 0);
    }

    #[test(aptos = @0x1, admin = @agent_arena, player1 = @0x101, player2 = @0x102)]
    public fun test_create_match(aptos: signer, admin: signer, player1: signer, player2: signer) {
        setup_accounts(&aptos, &admin, &player1, &player2);
        arena::initialize(&admin);
        agent::create_agent(&player1, b"ALPHA-BOT", 0, 80, 60, 40, 70);
        arena::create_match(&player1, signer::address_of(&admin), 0, 50_000_000);
        let (id, p1, _, agent1_id, _, stake, status) = arena::get_match(signer::address_of(&admin), 0);
        assert!(id == 0, 0);
        assert!(p1 == signer::address_of(&player1), 1);
        assert!(agent1_id == 0, 2);
        assert!(stake == 50_000_000, 3);
        assert!(status == 0, 4); // pending
    }

    #[test(aptos = @0x1, admin = @agent_arena, player1 = @0x101, player2 = @0x102)]
    public fun test_join_match(aptos: signer, admin: signer, player1: signer, player2: signer) {
        setup_accounts(&aptos, &admin, &player1, &player2);
        arena::initialize(&admin);
        agent::create_agent(&player1, b"ALPHA-BOT", 0, 80, 60, 40, 70);
        agent::create_agent(&player2, b"IRON-WARDEN", 1, 30, 40, 80, 60);
        arena::create_match(&player1, signer::address_of(&admin), 0, 50_000_000);
        arena::join_match(&player2, signer::address_of(&admin), 0, 0);
        let (_, _, _, _, _, _, status) = arena::get_match(signer::address_of(&admin), 0);
        assert!(status == 1, 0); // active
    }

    #[test(aptos = @0x1, admin = @agent_arena, player1 = @0x101, player2 = @0x102)]
    public fun test_submit_result(aptos: signer, admin: signer, player1: signer, player2: signer) {
        setup_accounts(&aptos, &admin, &player1, &player2);
        arena::initialize(&admin);
        agent::create_agent(&player1, b"ALPHA-BOT", 0, 80, 60, 40, 70);
        agent::create_agent(&player2, b"IRON-WARDEN", 1, 30, 40, 80, 60);
        arena::create_match(&player1, signer::address_of(&admin), 0, 50_000_000);
        arena::join_match(&player2, signer::address_of(&admin), 0, 0);

        let p1_balance_before = coin::balance<AptosCoin>(signer::address_of(&player1));
        arena::submit_result(
            &admin,
            0,
            signer::address_of(&player1),
            b"abc123resulthashabcde",
        );
        let p1_balance_after = coin::balance<AptosCoin>(signer::address_of(&player1));
        // player1 should have received 100_000_000 (both stakes)
        assert!(p1_balance_after == p1_balance_before + 100_000_000, 0);
        let (_, _, _, _, _, _, status) = arena::get_match(signer::address_of(&admin), 0);
        assert!(status == 2, 1); // complete
    }

    #[test(aptos = @0x1, admin = @agent_arena, player1 = @0x101, player2 = @0x102)]
    public fun test_cancel_match(aptos: signer, admin: signer, player1: signer, player2: signer) {
        setup_accounts(&aptos, &admin, &player1, &player2);
        arena::initialize(&admin);
        agent::create_agent(&player1, b"ALPHA-BOT", 0, 80, 60, 40, 70);
        arena::create_match(&player1, signer::address_of(&admin), 0, 50_000_000);

        let balance_before = coin::balance<AptosCoin>(signer::address_of(&player1));
        arena::cancel_match(&player1, signer::address_of(&admin), 0);
        let balance_after = coin::balance<AptosCoin>(signer::address_of(&player1));
        assert!(balance_after == balance_before + 50_000_000, 0);
    }

    #[test(aptos = @0x1, admin = @agent_arena, player1 = @0x101, player2 = @0x102)]
    #[expected_failure(abort_code = 1)] // ENOT_ADMIN
    public fun test_unauthorized_submit(aptos: signer, admin: signer, player1: signer, player2: signer) {
        setup_accounts(&aptos, &admin, &player1, &player2);
        arena::initialize(&admin);
        agent::create_agent(&player1, b"ALPHA-BOT", 0, 80, 60, 40, 70);
        agent::create_agent(&player2, b"IRON-WARDEN", 1, 30, 40, 80, 60);
        arena::create_match(&player1, signer::address_of(&admin), 0, 50_000_000);
        arena::join_match(&player2, signer::address_of(&admin), 0, 0);
        // player1 is not admin — should abort
        arena::submit_result(
            &player1,
            0,
            signer::address_of(&player1),
            b"fakehash",
        );
    }
}
