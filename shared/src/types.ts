/**
 * Agent strategy types
 */
export type Strategy = 'attacker' | 'defender' | 'tactician';

/**
 * Possible actions an agent can take in a round
 */
export type Action = 'attack' | 'defend' | 'retreat' | 'special';

/**
 * Configuration for an agent — stored onchain as NFT
 */
export interface AgentConfig {
  /** Unique identifier */
  id: string;
  /** Display name (max 18 chars) */
  name: string;
  /** Wallet address of the owner */
  owner: string;
  /** Combat strategy archetype */
  strategy: Strategy;
  /** Tendency to initiate attacks (0-100) */
  aggression: number;
  /** Willingness to take damage for higher reward (0-100) */
  riskTolerance: number;
  /** Weight given to defensive actions (0-100) */
  defenseWeight: number;
  /** Ability to counter-adapt to opponent (0-100) */
  adaptability: number;
  /**
   * Computed power rating
   * Formula: (aggression*35 + riskTolerance*20 + defenseWeight*20 + adaptability*25) / 100
   */
  powerRating: number;
  /** Unix timestamp of creation */
  createdAt: number;
}

/**
 * Result of a single round of combat
 */
export interface RoundResult {
  /** Round number (1-indexed) */
  round: number;
  /** Action taken by agent 1 */
  action1: Action;
  /** Action taken by agent 2 */
  action2: Action;
  /** Damage dealt to agent 1 this round */
  damage1: number;
  /** Damage dealt to agent 2 this round */
  damage2: number;
  /** Agent 1 HP after this round */
  hp1After: number;
  /** Agent 2 HP after this round */
  hp2After: number;
  /** Narrative log lines for this round */
  log: string[];
}

/**
 * Full match state — mirrors onchain Match struct
 */
export interface MatchState {
  /** Unique match identifier */
  matchId: string;
  /** Agent 1 configuration */
  agent1: AgentConfig;
  /** Agent 2 configuration */
  agent2: AgentConfig;
  /** Stake amount in octas */
  stakeAmount: number;
  /** Current match lifecycle status */
  status: 'pending' | 'active' | 'complete';
  /** All rounds played so far */
  rounds: RoundResult[];
  /** Winner agent name (set when complete) */
  winner?: string;
  /** Onchain transaction hash (set when complete) */
  txHash?: string;
}

/**
 * Final battle outcome returned by the engine
 */
export interface BattleOutcome {
  /** Name of the winning agent (or "DRAW") */
  winner: string;
  /** Wallet address of the winner */
  winnerAddress: string;
  /** HP of the winner at match end */
  winnerHp: number;
  /** Total rounds played */
  totalRounds: number;
  /** Total damage dealt across all rounds */
  totalDamageDealt: number;
  /** Reward amount in octas */
  rewardAmount: number;
  /** Onchain transaction hash */
  txHash: string;
}

/**
 * Full battle result from the simulation engine
 */
export interface BattleResult {
  /** Winner agent name or "DRAW" */
  winner: string;
  /** Winner wallet address */
  winner_address: string;
  /** All round results */
  rounds: RoundResult[];
  /** Total damage dealt to agent 1 */
  total_damage_1: number;
  /** Total damage dealt to agent 2 */
  total_damage_2: number;
  /** Agent 1 final HP */
  final_hp_1: number;
  /** Agent 2 final HP */
  final_hp_2: number;
  /** SHA-256 hash of deterministic result for onchain verification */
  result_hash: string;
  /** Seed used for this simulation */
  seed_used: string;
}
