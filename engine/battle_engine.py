"""
Deterministic battle simulation engine for Agent Arena.

Results are fully reproducible: given the same seed, the same match
configuration will always produce the exact same outcome.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import random
import sys
from dataclasses import dataclass, field
from typing import Optional


# ─── Data models ──────────────────────────────────────────────────────────────

@dataclass
class AgentState:
    """Runtime state of an agent during a battle."""
    # Config
    id: str
    name: str
    owner: str
    strategy: str          # 'attacker' | 'defender' | 'tactician'
    aggression: int        # 0-100
    risk_tolerance: int    # 0-100
    defense_weight: int    # 0-100
    adaptability: int      # 0-100
    power_rating: int      # computed

    # Runtime state
    current_hp: int = 100
    history: list[str] = field(default_factory=list)


@dataclass
class RoundResult:
    """Result of one round of combat."""
    round: int
    action1: str
    action2: str
    damage1: int
    damage2: int
    hp1_after: int
    hp2_after: int
    log: list[str]


# ─── Damage table ─────────────────────────────────────────────────────────────

# BASE_DAMAGE[action1][action2] = (damage_to_agent1, damage_to_agent2)
BASE_DAMAGE: dict[str, dict[str, tuple[int, int]]] = {
    "attack": {
        "attack":  (10, 12),
        "defend":  (0,  6),
        "retreat": (0,  16),
        "special": (8,  14),
    },
    "defend": {
        "attack":  (6,  0),
        "defend":  (0,  0),
        "retreat": (0,  0),
        "special": (9,  1),
    },
    "retreat": {
        "attack":  (16, 0),
        "defend":  (0,  0),
        "retreat": (0,  0),
        "special": (0,  0),
    },
    "special": {
        "attack":  (14, 8),
        "defend":  (1,  9),
        "retreat": (0,  20),
        "special": (15, 15),
    },
}


# ─── Engine ───────────────────────────────────────────────────────────────────

class BattleEngine:
    """
    Deterministic battle engine.

    Instantiate with a seed string; all random decisions will be
    reproducible for that seed.
    """

    def __init__(self, seed: str) -> None:
        self.seed = seed
        self._rng = random.Random(seed)

    def _seeded_random(self) -> float:
        """Return the next float from the seeded RNG."""
        return self._rng.random()

    def decide_action(self, agent: AgentState, opponent: AgentState) -> str:
        """
        Deterministic AI decision function.

        Evaluates the agent's current state and opponent stats to pick
        the optimal action for this round.
        """
        hp = agent.current_hp
        opp_aggression = opponent.aggression

        # Priority 1 — retreat when HP is critically low
        retreat_threshold = 30 - agent.risk_tolerance * 0.15
        if hp < retreat_threshold:
            return "retreat"

        # Priority 2 — defend when opponent is aggressive and our HP is below safety line
        aggression_threshold = 65 - agent.adaptability * 0.2
        hp_safety = 60 + agent.defense_weight * 0.2
        if opp_aggression > aggression_threshold and hp < hp_safety:
            return "defend"

        # Priority 3 — attack when HP is high enough
        attack_threshold = 50 + agent.defense_weight * 0.15
        if hp > attack_threshold:
            if agent.strategy == "attacker" and agent.aggression > 40:
                return "attack"
            if agent.strategy != "attacker" and opponent.current_hp > agent.current_hp * 0.9:
                return "attack"

        # Priority 4 — special move with adaptable agents
        if agent.adaptability > 60 and self._seeded_random() < 0.25:
            return "special"

        return "defend"

    def compute_damage(self, action1: str, action2: str) -> tuple[int, int]:
        """
        Look up base damage from the damage table and apply ±3 variance.
        Returns (damage_to_agent1, damage_to_agent2).
        """
        base1, base2 = BASE_DAMAGE[action1][action2]
        variance1 = self._rng.randint(-3, 3) if base1 > 0 else 0
        variance2 = self._rng.randint(-3, 3) if base2 > 0 else 0
        dmg1 = max(0, base1 + variance1)
        dmg2 = max(0, base2 + variance2)
        return dmg1, dmg2

    def _build_log_line(
        self,
        agent1: AgentState,
        agent2: AgentState,
        action1: str,
        action2: str,
        dmg1: int,
        dmg2: int,
    ) -> list[str]:
        """Generate human-readable log lines for the round."""
        lines: list[str] = []
        action_verbs = {
            "attack": "attacks",
            "defend": "defends",
            "retreat": "retreats",
            "special": "executes a special move on",
        }
        verb1 = action_verbs.get(action1, action1)
        verb2 = action_verbs.get(action2, action2)
        lines.append(f"{agent1.name} {verb1} | {agent2.name} {verb2}")
        if dmg1 > 0:
            lines.append(f"  → {agent1.name} takes {dmg1} damage")
        if dmg2 > 0:
            lines.append(f"  → {agent2.name} takes {dmg2} damage")
        if dmg1 == 0 and dmg2 == 0:
            lines.append("  → No damage exchanged")
        return lines

    def run_match(
        self,
        agent1_config: dict,
        agent2_config: dict,
        max_rounds: int = 10,
    ) -> dict:
        """
        Run a full match between two agents.

        Args:
            agent1_config: AgentConfig dict for player 1
            agent2_config: AgentConfig dict for player 2
            max_rounds: Maximum number of rounds (default 10)

        Returns:
            Full battle result dict including all rounds and result_hash.
        """
        # Reset RNG for full determinism
        self._rng = random.Random(self.seed)

        agent1 = AgentState(**{
            k: v for k, v in agent1_config.items()
            if k in AgentState.__dataclass_fields__
        })
        agent2 = AgentState(**{
            k: v for k, v in agent2_config.items()
            if k in AgentState.__dataclass_fields__
        })

        rounds: list[dict] = []
        total_damage_1 = 0
        total_damage_2 = 0

        for round_num in range(1, max_rounds + 1):
            if agent1.current_hp <= 0 or agent2.current_hp <= 0:
                break

            action1 = self.decide_action(agent1, agent2)
            action2 = self.decide_action(agent2, agent1)

            dmg1, dmg2 = self.compute_damage(action1, action2)

            agent1.current_hp = max(0, agent1.current_hp - dmg1)
            agent2.current_hp = max(0, agent2.current_hp - dmg2)

            agent1.history.append(action1)
            agent2.history.append(action2)

            total_damage_1 += dmg1
            total_damage_2 += dmg2

            log_lines = self._build_log_line(agent1, agent2, action1, action2, dmg1, dmg2)

            rounds.append({
                "round": round_num,
                "action1": action1,
                "action2": action2,
                "damage1": dmg1,
                "damage2": dmg2,
                "hp1After": agent1.current_hp,
                "hp2After": agent2.current_hp,
                "log": log_lines,
            })

        # Determine winner
        if agent1.current_hp > agent2.current_hp:
            winner = agent1.name
            winner_address = agent1.owner
        elif agent2.current_hp > agent1.current_hp:
            winner = agent2.name
            winner_address = agent2.owner
        else:
            winner = "DRAW"
            winner_address = ""

        # Build deterministic result hash
        result_str = json.dumps({
            "seed": self.seed,
            "winner": winner,
            "rounds": len(rounds),
            "final_hp_1": agent1.current_hp,
            "final_hp_2": agent2.current_hp,
        }, sort_keys=True)
        result_hash = hashlib.sha256(result_str.encode()).hexdigest()

        return {
            "winner": winner,
            "winner_address": winner_address,
            "rounds": rounds,
            "total_damage_1": total_damage_1,
            "total_damage_2": total_damage_2,
            "final_hp_1": agent1.current_hp,
            "final_hp_2": agent2.current_hp,
            "result_hash": result_hash,
            "seed_used": self.seed,
        }


# ─── CLI entry point ──────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Agent Arena battle engine CLI")
    parser.add_argument("--agent1", required=True, help="Agent 1 config as JSON string")
    parser.add_argument("--agent2", required=True, help="Agent 2 config as JSON string")
    parser.add_argument("--seed", required=True, help="Deterministic seed string")
    parser.add_argument("--max-rounds", type=int, default=10, help="Max rounds (default 10)")
    args = parser.parse_args()

    try:
        a1 = json.loads(args.agent1)
        a2 = json.loads(args.agent2)
    except json.JSONDecodeError as e:
        print(f"Error parsing agent JSON: {e}", file=sys.stderr)
        sys.exit(1)

    engine = BattleEngine(seed=args.seed)
    result = engine.run_match(a1, a2, max_rounds=args.max_rounds)

    # Print battle log
    print(f"\n{'='*60}")
    print(f"  AGENT ARENA BATTLE — Seed: {args.seed}")
    print(f"  {a1['name']} vs {a2['name']}")
    print(f"{'='*60}\n")

    for rnd in result["rounds"]:
        print(f"[R{rnd['round']:02d}] HP: {a1['name']}={rnd['hp1After']:3d}  {a2['name']}={rnd['hp2After']:3d}")
        for line in rnd["log"]:
            print(f"       {line}")
        print()

    print(f"{'='*60}")
    print(f"  WINNER: {result['winner']}")
    print(f"  Final HP — {a1['name']}: {result['final_hp_1']}  {a2['name']}: {result['final_hp_2']}")
    print(f"  Result hash: {result['result_hash']}")
    print(f"{'='*60}\n")

    # JSON result to stdout
    print(json.dumps(result, indent=2))
    sys.exit(0)
