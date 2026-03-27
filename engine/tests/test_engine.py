"""
pytest tests for the Agent Arena battle engine and API.
"""
import json
import sys
import os
import pytest

# Add engine directory to path so we can import battle_engine and server
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from battle_engine import BattleEngine, AgentState


# ─── Fixtures ─────────────────────────────────────────────────────────────────

ATTACKER_CONFIG = {
    "id": "agent-1",
    "name": "ALPHA-STRIKE",
    "owner": "0xABC",
    "strategy": "attacker",
    "aggression": 90,
    "risk_tolerance": 70,
    "defense_weight": 20,
    "adaptability": 50,
    "power_rating": 65,
}

DEFENDER_CONFIG = {
    "id": "agent-2",
    "name": "IRON-WARDEN",
    "owner": "0xDEF",
    "strategy": "defender",
    "aggression": 20,
    "risk_tolerance": 30,
    "defense_weight": 85,
    "adaptability": 60,
    "power_rating": 52,
}

ADAPTABLE_CONFIG = {
    "id": "agent-3",
    "name": "GHOST-MIND",
    "owner": "0x123",
    "strategy": "tactician",
    "aggression": 50,
    "risk_tolerance": 50,
    "defense_weight": 50,
    "adaptability": 85,
    "power_rating": 57,
}


# ─── Tests ────────────────────────────────────────────────────────────────────

def test_determinism():
    """Same seed must always produce the same result."""
    engine1 = BattleEngine(seed="match-42:block-abc")
    engine2 = BattleEngine(seed="match-42:block-abc")
    result1 = engine1.run_match(ATTACKER_CONFIG, DEFENDER_CONFIG)
    result2 = engine2.run_match(ATTACKER_CONFIG, DEFENDER_CONFIG)
    assert result1["result_hash"] == result2["result_hash"]
    assert result1["winner"] == result2["winner"]
    assert result1["rounds"] == result2["rounds"]


def test_attacker_beats_defender():
    """High-aggression attacker should beat a passive defender in the majority of seeds."""
    wins = 0
    trials = 20
    for i in range(trials):
        engine = BattleEngine(seed=f"test-seed-{i}")
        result = engine.run_match(ATTACKER_CONFIG, DEFENDER_CONFIG)
        if result["winner"] == ATTACKER_CONFIG["name"]:
            wins += 1
    assert wins > trials // 2, f"Attacker only won {wins}/{trials} matches"


def test_defender_survives():
    """High-defense agent should never die before round 8."""
    for i in range(10):
        engine = BattleEngine(seed=f"defender-test-{i}")
        result = engine.run_match(DEFENDER_CONFIG, ATTACKER_CONFIG)
        rounds_played = len(result["rounds"])
        # If defender lost, it should have survived at least 8 rounds
        if result["winner"] != DEFENDER_CONFIG["name"]:
            assert rounds_played >= 8, f"Defender died too quickly in seed defender-test-{i}: {rounds_played} rounds"


def test_retreat_triggers():
    """Agent with high risk_tolerance=0 should retreat when HP is very low."""
    low_hp_config = {**ATTACKER_CONFIG, "risk_tolerance": 0, "aggression": 100}
    engine = BattleEngine(seed="retreat-test")
    a1 = AgentState(**{k: v for k, v in low_hp_config.items() if k in AgentState.__dataclass_fields__})
    a2 = AgentState(**{k: v for k, v in ATTACKER_CONFIG.items() if k in AgentState.__dataclass_fields__})
    a1.current_hp = 10  # force low HP
    action = engine.decide_action(a1, a2)
    assert action == "retreat", f"Expected retreat with HP=10, risk=0, got {action}"


def test_result_hash():
    """Same match config and seed must always produce the same hash."""
    engine = BattleEngine(seed="hash-consistency-test")
    r1 = engine.run_match(ATTACKER_CONFIG, DEFENDER_CONFIG)
    r2 = engine.run_match(ATTACKER_CONFIG, DEFENDER_CONFIG)
    assert r1["result_hash"] == r2["result_hash"]
    # Different seed → different hash
    engine2 = BattleEngine(seed="different-seed")
    r3 = engine2.run_match(ATTACKER_CONFIG, DEFENDER_CONFIG)
    # This could theoretically collide but practically won't
    assert r1["result_hash"] != r3["result_hash"]


def test_all_actions_reachable():
    """Over many random seeds, all 4 actions should appear at least once."""
    seen_actions: set[str] = set()
    for i in range(100):
        engine = BattleEngine(seed=f"action-coverage-{i}")
        result = engine.run_match(ADAPTABLE_CONFIG, DEFENDER_CONFIG)
        for rnd in result["rounds"]:
            seen_actions.add(rnd["action1"])
            seen_actions.add(rnd["action2"])
        if seen_actions >= {"attack", "defend", "retreat", "special"}:
            break
    assert "attack" in seen_actions, "attack action never triggered"
    assert "defend" in seen_actions, "defend action never triggered"
    assert "retreat" in seen_actions, "retreat action never triggered"
    assert "special" in seen_actions, "special action never triggered"


def test_max_rounds():
    """Match must never exceed max_rounds."""
    for i in range(20):
        engine = BattleEngine(seed=f"maxrounds-{i}")
        result = engine.run_match(DEFENDER_CONFIG, DEFENDER_CONFIG, max_rounds=5)
        assert len(result["rounds"]) <= 5, f"Round count exceeded max_rounds=5"


def test_hp_never_negative():
    """HP values should never go below 0."""
    for i in range(20):
        engine = BattleEngine(seed=f"hp-floor-{i}")
        result = engine.run_match(ATTACKER_CONFIG, DEFENDER_CONFIG)
        for rnd in result["rounds"]:
            assert rnd["hp1After"] >= 0, f"Negative HP for agent1 in round {rnd['round']}"
            assert rnd["hp2After"] >= 0, f"Negative HP for agent2 in round {rnd['round']}"


def test_api_simulate():
    """POST /simulate should return a valid battle result."""
    from fastapi.testclient import TestClient
    from server import app

    client = TestClient(app)
    payload = {
        "agent1": {
            "id": "a1", "name": "ALPHA", "owner": "0xABC",
            "strategy": "attacker",
            "aggression": 80, "riskTolerance": 60,
            "defenseWeight": 30, "adaptability": 50, "powerRating": 60,
        },
        "agent2": {
            "id": "a2", "name": "BRAVO", "owner": "0xDEF",
            "strategy": "defender",
            "aggression": 30, "riskTolerance": 40,
            "defenseWeight": 70, "adaptability": 55, "powerRating": 50,
        },
        "match_id": "test-match-001",
        "blockSeed": "abc123",
    }
    resp = client.post("/simulate", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "winner" in data
    assert "result_hash" in data
    assert isinstance(data["rounds"], list)
    assert len(data["rounds"]) > 0
