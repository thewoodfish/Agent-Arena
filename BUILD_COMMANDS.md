# 🏆 AUTONOMOUS AGENTS ARENA — COMPLETE BUILD GUIDE
### Feed these prompts to Claude Code (claude.ai/code) in order. Win the hackathon.

---

## ⚡ HOW TO USE THIS GUIDE
1. Open **Claude Code** (`claude` in your terminal, or claude.ai/code)
2. Navigate to your project folder: `cd ~/agent-arena`
3. Paste each prompt **exactly as written** — one block at a time
4. Wait for Claude to finish before pasting the next one
5. Each block is self-contained and builds on the last

---

# ═══════════════════════════════════════
# PHASE 0 — PROJECT SCAFFOLD
# ═══════════════════════════════════════

## PROMPT 0.1 — Initialize the monorepo

```
Create a new project called "agent-arena" with the following monorepo structure:

agent-arena/
  frontend/          # Next.js 14 app
  contracts/         # Move smart contracts
  engine/            # Python battle simulation engine
  shared/            # Shared TypeScript types
  README.md
  .gitignore

Initialize each folder with a placeholder README.md explaining its role.
Create a root package.json with workspaces pointing to frontend/ and shared/.
Create a comprehensive .gitignore covering Node, Python, Move build artifacts, .env files, and OS files.
Print the full directory tree when done.
```

---

## PROMPT 0.2 — Set up shared types

```
In the shared/ folder, create a TypeScript package with the following:

1. package.json — name: "@agent-arena/shared", version: "0.1.0"
2. src/types.ts — Export these interfaces:

  AgentConfig:
    id: string
    name: string
    owner: string
    strategy: 'attacker' | 'defender' | 'tactician'
    aggression: number (0-100)
    riskTolerance: number (0-100)
    defenseWeight: number (0-100)
    adaptability: number (0-100)
    powerRating: number (computed)
    createdAt: number

  MatchState:
    matchId: string
    agent1: AgentConfig
    agent2: AgentConfig
    stakeAmount: number
    status: 'pending' | 'active' | 'complete'
    rounds: RoundResult[]
    winner?: string
    txHash?: string

  RoundResult:
    round: number
    action1: Action
    action2: Action
    damage1: number
    damage2: number
    hp1After: number
    hp2After: number
    log: string[]

  Action: 'attack' | 'defend' | 'retreat' | 'special'

  BattleOutcome:
    winner: string
    winnerHp: number
    totalRounds: number
    totalDamageDealt: number
    rewardAmount: number
    txHash: string

3. src/index.ts — Re-export everything
4. tsconfig.json — strict mode, ES2020 target

Use proper JSDoc comments on every interface.
```

---

# ═══════════════════════════════════════
# PHASE 1 — SMART CONTRACTS (MOVE)
# ═══════════════════════════════════════

## PROMPT 1.1 — Agent NFT contract

```
In the contracts/ folder, initialize a Move project for OneChain (Aptos-compatible Move).

Create contracts/sources/Agent.move with:

module agent_arena::agent {
  
  Full implementation of:

  1. Struct Agent with fields:
     - id: u64
     - name: String
     - owner: address
     - strategy: u8 (0=attacker, 1=defender, 2=tactician)
     - aggression: u8
     - risk_tolerance: u8
     - defense_weight: u8
     - adaptability: u8
     - power_rating: u8
     - wins: u64
     - losses: u64
     - created_at: u64

  2. Struct AgentCollection (global registry per account)

  3. Public entry functions:
     - create_agent(name, strategy, aggression, risk, defense, adapt)
       → Validates all params 0-100, computes power_rating, emits AgentCreated event
     - update_strategy(agent_id, new params)
       → Owner-only, emits AgentUpdated event

  4. View functions:
     - get_agent(owner, id): Agent
     - get_power_rating(aggression, risk, defense, adapt): u8
       → Formula: (aggression * 35 + risk * 20 + defense * 20 + adapt * 25) / 100

  5. Events:
     - AgentCreated { agent_id, owner, name, power_rating }
     - AgentUpdated { agent_id, owner }

  6. Error constants:
     - EINVALID_PARAM = 1
     - ENOT_OWNER = 2
     - EAGENT_NOT_FOUND = 3

Include full Move syntax, proper use keyword, friend declarations.
Also create contracts/Move.toml with correct dependencies for Aptos framework.
```

---

## PROMPT 1.2 — Match & staking contract

```
Create contracts/sources/Arena.move with:

module agent_arena::arena {

  Full implementation of:

  1. Struct Match:
     - match_id: u64
     - player1: address
     - player2: address  
     - agent1_id: u64
     - agent2_id: u64
     - stake_amount: u64 (in octas)
     - status: u8 (0=pending, 1=active, 2=complete)
     - winner: Option<address>
     - result_hash: vector<u8> (hash of battle result for verification)
     - created_at: u64
     - completed_at: u64

  2. Struct ArenaState (global, under admin account):
     - matches: Table<u64, Match>
     - next_match_id: u64
     - total_matches: u64
     - total_rewards_distributed: u64

  3. Entry functions:
     - create_match(agent_id, stake_amount):
       → Player stakes tokens, creates pending match, emits MatchCreated
     
     - join_match(match_id, agent_id):
       → Second player stakes equal amount, status → active, emits MatchStarted
     
     - submit_result(match_id, winner_address, result_hash):
       → Admin/oracle only, verifies result_hash, distributes full stake to winner
       → Updates agent win/loss counters, emits MatchCompleted
     
     - cancel_match(match_id):
       → Only if still pending, refunds player1 stake

  4. View functions:
     - get_match(match_id): Match
     - get_open_matches(): vector<Match>
     - get_player_matches(player): vector<u64>

  5. Events:
     - MatchCreated { match_id, player1, agent_id, stake }
     - MatchStarted { match_id, player2, agent_id }
     - MatchCompleted { match_id, winner, reward_amount, result_hash }

  6. Coin handling using aptos_framework::coin for token transfer

Include full error handling with descriptive error codes.
```

---

## PROMPT 1.3 — Contract tests

```
Create contracts/tests/arena_tests.move with Move unit tests covering:

1. test_create_agent — creates agent, checks all fields
2. test_invalid_params — verifies EINVALID_PARAM on values > 100
3. test_power_rating — verifies formula accuracy
4. test_create_match — player stakes, match created
5. test_join_match — second player joins, match goes active
6. test_submit_result — winner gets full stake, losers nothing
7. test_cancel_match — pending match cancelled, funds returned
8. test_unauthorized_submit — non-admin cannot submit results

Use #[test] and #[expected_failure] attributes correctly.
Add setup helpers for creating test accounts with initial balances.
```

---

# ═══════════════════════════════════════
# PHASE 2 — PYTHON BATTLE ENGINE
# ═══════════════════════════════════════

## PROMPT 2.1 — Core simulation engine

```
Create engine/battle_engine.py — a deterministic battle simulation engine.

Requirements:

1. Class AgentState:
   - All config fields from shared types
   - current_hp: int = 100
   - history: list of past actions taken

2. Class BattleEngine:

   def __init__(self, seed: str):
     → Takes a deterministic seed (match_id + block_hash)
     → Uses random.seed(seed) so results are reproducible

   def decide_action(agent: AgentState, opponent: AgentState) -> str:
     → Pure deterministic function implementing the core AI logic:
     
     LOGIC (implement exactly):
     - If agent.current_hp < (30 - agent.risk_tolerance * 0.15): return 'retreat'
     - If opponent.aggression > (65 - agent.adaptability * 0.2) 
       AND agent.current_hp < (60 + agent.defense_weight * 0.2): return 'defend'
     - If agent.current_hp > (50 + agent.defense_weight * 0.15):
         if strategy == 'attacker' and aggression > 40: return 'attack'
         if strategy != 'attacker' and opponent.current_hp > agent.current_hp * 0.9: return 'attack'
     - If agent.adaptability > 60 and seeded_random < 0.25: return 'special'
     - Default: return 'defend'

   DAMAGE TABLE (implement exactly):
   attack vs attack:   attacker takes 10, defender takes 12
   attack vs defend:   attacker takes 0,  defender takes 6
   attack vs retreat:  attacker takes 0,  defender takes 16
   attack vs special:  attacker takes 8,  defender takes 14
   defend vs defend:   both take 0
   retreat vs attack:  retreater takes 16, attacker takes 0
   special vs special: both take 15
   special vs defend:  special takes 1, defender takes 9
   special vs retreat: special takes 0, defender takes 20
   (add ±3 random variance to each value using seeded random)

   def run_match(agent1_config, agent2_config, max_rounds=10) -> dict:
     → Runs full match, returns:
       {
         winner: str (agent name or "DRAW"),
         winner_address: str,
         rounds: list of RoundResult dicts,
         total_damage_1: int,
         total_damage_2: int,
         final_hp_1: int,
         final_hp_2: int,
         result_hash: str (sha256 of deterministic result),
         seed_used: str
       }

3. Standalone script mode:
   if __name__ == '__main__':
     → Accept CLI args: --agent1 (JSON) --agent2 (JSON) --seed
     → Print full battle log to stdout
     → Print JSON result to stdout at end
     → Exit code 0 on success

4. Include comprehensive docstrings and type hints throughout.
```

---

## PROMPT 2.2 — FastAPI server

```
Create engine/server.py — a FastAPI server that exposes the battle engine.

Endpoints:

POST /simulate
  Body: { agent1: AgentConfig, agent2: AgentConfig, match_id: str, block_seed: str }
  Response: BattleResult (full match output from engine)
  → Runs deterministic simulation
  → Returns result including result_hash for onchain verification

POST /simulate/stream  
  Body: same as above
  Response: Server-Sent Events stream
  → Streams each round result as it completes (for live UI animation)
  → Event format: data: {"round": N, "action1": "attack", "action2": "defend", "hp1": 84, "hp2": 77, ...}
  → Final event: data: {"type": "complete", "winner": "...", "result_hash": "..."}

GET /health
  → Returns {"status": "ok", "engine_version": "1.0.0"}

GET /simulate/replay/{result_hash}
  → Given a result_hash, return cached result (use in-memory dict for MVP)

Setup:
- Use FastAPI + uvicorn
- Add CORS middleware for localhost:3000
- Pydantic models for all request/response types (import shared types structure)
- Proper error handling with HTTPException
- Create engine/requirements.txt with: fastapi, uvicorn, pydantic

Create engine/Dockerfile:
  FROM python:3.11-slim
  COPY requirements.txt .
  RUN pip install -r requirements.txt
  COPY . .
  CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## PROMPT 2.3 — Engine tests

```
Create engine/tests/test_engine.py with pytest tests:

1. test_determinism — same seed always produces same result
2. test_attacker_beats_defender — high aggression (90) vs low aggression (20) — attacker wins majority
3. test_defender_survives — high defense agent never dies before round 8
4. test_retreat_triggers — low HP agent always retreats
5. test_result_hash — hash is consistent for same match
6. test_all_actions_reachable — over 100 random matches, all 4 actions appear
7. test_max_rounds — match never exceeds max_rounds
8. test_api_simulate (with httpx TestClient) — POST /simulate returns valid response

Run: pytest engine/tests/ -v
```

---

# ═══════════════════════════════════════
# PHASE 3 — FRONTEND
# ═══════════════════════════════════════

## PROMPT 3.1 — Next.js setup & config

```
In the frontend/ folder, set up a Next.js 14 app (App Router):

1. Initialize with: 
   - TypeScript
   - Tailwind CSS
   - App Router
   - src/ directory

2. Install additional dependencies:
   - @aptos-labs/wallet-adapter-react
   - @aptos-labs/wallet-adapter-ant-design
   - petra-plugin-wallet-adapter
   - axios
   - framer-motion
   - zustand
   - @tanstack/react-query

3. Create frontend/src/lib/fonts.ts:
   Import from next/font/google:
   - Orbitron (weights: 400, 700, 900) → variable: --font-display
   - Barlow Condensed (weights: 300, 400, 600, 700) → variable: --font-body  
   - Share Tech Mono → variable: --font-mono
   Export as: { orbitron, barlowCondensed, shareTechMono }

4. Create frontend/src/app/layout.tsx:
   - Apply all 3 font CSS variables to <html>
   - Dark background: #05050f
   - Scanline overlay via CSS (repeating-linear-gradient)
   - Grid background overlay
   - WalletProvider wrapper

5. Create frontend/tailwind.config.ts:
   Extend theme with:
   - colors: { cyan: '#00ffe0', magenta: '#ff2d78', amber: '#ffb300', green: '#39ff7a', bg: '#05050f', panel: '#0d0d22', border: '#1e1e42' }
   - fontFamily: { display: ['var(--font-display)'], body: ['var(--font-body)'], mono: ['var(--font-mono)'] }

6. Create frontend/src/lib/constants.ts with:
   - API_URL = process.env.NEXT_PUBLIC_ENGINE_URL || 'http://localhost:8000'
   - CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
   - STAKE_AMOUNT = 50_000_000 (50 ONE in octas)
   - MAX_ROUNDS = 10

Create frontend/.env.local.example with all required env vars documented.
```

---

## PROMPT 3.2 — Zustand store

```
Create frontend/src/store/gameStore.ts using Zustand.

Full store with:

State:
  currentScreen: 'build' | 'lobby' | 'battle' | 'results'
  agentConfig: AgentConfig | null
  currentMatch: MatchState | null
  battleRounds: RoundResult[]
  battleOutcome: BattleOutcome | null
  isSimulating: boolean
  streamingRound: number
  walletAddress: string | null
  connectedWallet: boolean

Actions:
  setScreen(screen)
  setAgentConfig(config)
  computePowerRating(config): number → formula: (agg*35 + risk*20 + def*20 + adapt*25) / 100
  setCurrentMatch(match)
  addRound(round: RoundResult)
  setBattleOutcome(outcome)
  setSimulating(bool)
  incrementStreamingRound()
  setWallet(address, connected)
  resetBattle()
  resetAll()

Selectors (exported separately):
  useCurrentScreen()
  useAgentConfig()
  useBattleState()
  useWallet()

Use immer middleware for clean mutations.
Use persist middleware to save agentConfig to localStorage.
Add devtools middleware for debugging.
```

---

## PROMPT 3.3 — Wallet integration hook

```
Create frontend/src/hooks/useWallet.ts:

A custom hook wrapping @aptos-labs/wallet-adapter-react that provides:

  interface WalletState {
    address: string | null
    connected: boolean
    connecting: boolean
    network: string | null
    balance: number | null  // in ONE tokens
  }

  interface WalletActions {
    connect(): Promise<void>
    disconnect(): Promise<void>
    signAndSubmitTransaction(payload): Promise<{ hash: string }>
    createAgent(config: AgentConfig): Promise<{ txHash: string, agentId: string }>
    createMatch(agentId: string, stakeAmount: number): Promise<{ txHash: string, matchId: string }>
    joinMatch(matchId: string, agentId: string): Promise<{ txHash: string }>
    submitResult(matchId: string, winner: string, resultHash: string): Promise<{ txHash: string }>
  }

createAgent() should:
  → Build Move entry function payload for agent_arena::agent::create_agent
  → Sign and submit
  → Return tx hash and parse agentId from events

createMatch() should:
  → Build payload for agent_arena::arena::create_match
  → Include stake_amount as coin argument
  → Return match_id from emitted event

Add a useMockWallet() fallback that:
  → Simulates wallet behavior with fake addresses/hashes
  → Used when no wallet extension detected (demo mode)
  → Logs "DEMO MODE — no real transactions" to console
  → Generates realistic-looking fake tx hashes

Export both hooks. Auto-detect which to use based on window.petra existence.
```

---

## PROMPT 3.4 — Agent Builder screen

```
Create frontend/src/components/screens/AgentBuilder.tsx

A full-screen React component for building an agent. No external UI library — pure custom components with Tailwind + inline styles using CSS variables.

Layout: Two-column grid (builder left, live preview card right, preview sticky)

LEFT COLUMN contains:

1. AgentIdentity panel:
   - Text input for agent name (uppercase transform, Orbitron font, max 18 chars)
   - StrategySelector: 3 clickable cards for Attacker / Defender / Tactician
     Each card shows: icon (⚔️🛡️♟️), name, short description
     Selected state has cyan border + glow
     
2. BehavioralParams panel:
   - 4 custom SliderField components: Aggression (cyan), Risk Tolerance (magenta), Defense Weight (amber), Adaptability (cyan)
   - Each slider shows live value, colored thumb, colored value label
   - Custom styled range inputs (no browser defaults)

3. DecisionLogicPreview panel:
   - Monospace code block
   - Shows generated pseudocode that updates live as sliders change
   - Uses the actual decision logic formula from the engine
   - Syntax highlighted with colored spans (keywords cyan, values amber, strings magenta)

RIGHT COLUMN (sticky):

4. AgentPreviewCard:
   - Avatar (emoji based on strategy)
   - Agent name + strategy tag
   - 4 animated stat bars (transition on slider change)
   - Power Rating number (computed live)
   - Win Probability % (computed from power rating)
   - "ONCHAIN NFT" storage indicator

5. Deploy button:
   - "DEPLOY TO ARENA →"
   - On click: if wallet connected → call createAgent(), show loading state → navigate to lobby
   - If not connected → show ConnectWalletModal first

All interactions use the Zustand store.
Use framer-motion for: screen entrance (fade+slide up), slider value changes (number flip), strategy card selection (scale bounce).
```

---

## PROMPT 3.5 — Match Lobby screen

```
Create frontend/src/components/screens/MatchLobby.tsx

A match lobby screen showing your agent vs opponent with staking.

Components:

1. VsLayout: Three-column grid (YourAgent | VS badge | OpponentAgent)
   - Your agent card: shows all stats from AgentConfig in store
   - VS badge: large amber "VS" with glow, pulsing animation
   - Opponent card: hardcoded "IRON-WARDEN" defender agent
     (in real version would come from match contract)

2. StakePanel:
   - Shows: Your Stake (50 ONE) + Opponent Stake (50 ONE) = Prize Pool (100 ONE)
   - Contract address (truncated), Match ID, Engine version
   - Styled with amber accent

3. PreMatchIntelligence panel:
   - Left: "Your Predicted Playstyle" — generated from agent config
   - Right: "Opponent Predicted Playstyle" — hardcoded for IRON-WARDEN
   - Monospace font, muted color

4. MatchSimulation component (real vs demo mode):
   REAL MODE (wallet connected):
   - "Lock Stake & Find Match" button → calls createMatch() → shows tx confirmation
   - Shows tx hash with link to explorer once confirmed
   - "Match Found!" animation when opponent joins
   
   DEMO MODE:
   - "EXECUTE MATCH — AGENTS TAKE OVER" button → immediately starts battle
   - Small "Demo Mode" badge visible

5. Back button → navigate to build screen

On mount: generateOpponentAgent() — creates a random opponent config for variety.
Use framer-motion staggered entrance for both agent cards.
```

---

## PROMPT 3.6 — Battle screen

```
Create frontend/src/components/screens/BattleScreen.tsx

The main battle visualization screen. This is the most important screen — judges watch this.

Components:

1. RoundProgress:
   - "ROUND X / 10" header with thin progress bar
   - Animated number counter for current round

2. BattleArena (main component):
   
   HpBars:
   - Two health bars (cyan for player, magenta for opponent)
   - HP number shown, smooth width transition on damage
   - Bar flashes red briefly when taking damage
   - Agent name labels on left
   
   CombatantDisplay (two side-by-side agent cards):
   - Avatar emoji (large, centered)
   - Agent name (Orbitron font)
   - CurrentAction badge — styled differently per action:
     ATTACK = magenta/red
     DEFEND = cyan/blue
     RETREAT = amber/yellow
     SPECIAL = green
     READY = gray
   - DecisionReasoning: small monospace text showing why AI chose this action
     e.g. "hp > threshold → aggressive push"
   - On attack: card gets shake animation + glow
   - On damage received: card briefly flashes damage color
   
   RoundBadge: centered "ROUND N" badge between combatants, updates each round

3. AutonomousExecutionLog:
   - Scrolling terminal-style log
   - New entries appear from bottom
   - Color-coded: attacks = magenta, defends = cyan, system = amber
   - Monospace font, subtle scroll
   - Timestamp prefix "[R01]" etc.

4. Battle orchestration logic:
   - On mount: fetch streaming events from /simulate/stream
   - Process each SSE event: update HP, trigger animations, add log entry
   - 800ms delay between rounds (felt pacing)
   - On complete: wait 1.5s, then navigate to results
   
   DEMO MODE fallback:
   - If engine not available, run the JS decision logic locally
   - Identical behavior, no server needed

5. "NO HUMAN INPUT — AGENTS EXECUTING AUTONOMOUSLY" status line (subtle, important for demo)

Use framer-motion AnimatePresence for log entries.
All animations must feel weighty and satisfying.
```

---

## PROMPT 3.7 — Results screen

```
Create frontend/src/components/screens/ResultsScreen.tsx

The victory/defeat results screen.

Components:

1. WinnerDisplay (top section):
   - Large winner avatar emoji (animated pulse)
   - "MATCH WINNER" label (monospace, muted, letter-spaced)
   - Winner name (Orbitron, huge, amber if player wins / magenta if opponent wins)
   - Win message: "Your strategy outperformed the opponent" OR "Refine your strategy and rematch"
   - RewardBadge: "100 ONE — Transferred onchain" (amber box)
   - If player wins: trigger confetti animation (colored particles falling)

2. BattleStatsGrid (3 cards):
   - Rounds Played
   - Total Damage Dealt
   - HP Remaining
   Each card: large number (Orbitron), small label (monospace)

3. OnchainVerification panel:
   - Two TX rows: "Match Result Verified" + "Reward Distributed"
   - Each row: green pulsing dot, TX hash (truncated), block number, timestamp
   - Link to block explorer
   REAL MODE: actual tx hashes from wallet actions
   DEMO MODE: realistic fake hashes, marked with small "simulated" badge

4. AgentUpgradeTeaser (4 locked cards):
   - LLM Policy (🧠)
   - RL Training Loop (📈)
   - Multi-Agent Environments (🌐)
   - Autonomous Trading (⚡)
   Each: icon, title, "COMING SOON" badge, semi-transparent

5. Action buttons:
   - "← MATCH DETAILS" (ghost)
   - "REFINE STRATEGY & REMATCH →" (primary) → resets battle state, goes to builder

On mount: entrance animation — winner display slides down, stats count up from 0.
```

---

## PROMPT 3.8 — App shell & navigation

```
Create frontend/src/app/page.tsx — the main page component.

It should:

1. Render a persistent Header with:
   - Logo "AGENT ARENA" (Orbitron, cyan with magenta accent on ARENA)
   - Tagline "// AUTONOMOUS AGENTS · COMPETE ONCHAIN · STRATEGY WINS"
   - StepProgress bar (4 steps: BUILD AGENT → JOIN MATCH → BATTLE → RESULT)
     Steps show: completed (green checkmark), active (cyan dot), upcoming (muted)
   - WalletButton (top right):
     Not connected: "CONNECT WALLET" button → opens wallet modal
     Connected: truncated address + network badge + balance

2. Main content area with AnimatePresence:
   - Renders the correct screen component based on currentScreen from store
   - Page transitions: exit (fade + slide left) enter (fade + slide right)

3. WalletConnectModal:
   - Lists available wallets: Petra, Martian, Pontem
   - "Demo Mode" option (no wallet needed)
   - Each option shows icon + name + install link if not detected
   - Clicking connects and closes modal

4. Scanline overlay + grid background (CSS, not a component)

5. Persistent wallet status bar at bottom (mobile-friendly):
   Connected indicator, address, network, ONE balance

Create frontend/src/app/globals.css with:
   - All CSS variables (--bg, --cyan, --magenta, --amber, --green, --muted, etc.)
   - Scanline overlay styles
   - Grid background styles
   - Custom scrollbar styles
   - range input cross-browser styles
   - Animation keyframes: flicker, shake, damage, pulse, blink, confetti-fall
```

---

## PROMPT 3.9 — Polish & missing components

```
Create the following utility components:

1. frontend/src/components/ui/SliderField.tsx
   Props: label, value, min, max, color ('cyan'|'magenta'|'amber'), onChange
   - Custom styled range input with colored thumb and track fill
   - Animated value display that flips when changed
   - Uses CSS variables for colors

2. frontend/src/components/ui/Panel.tsx
   Props: title, accent ('cyan'|'magenta'|'amber'), children
   - Dark panel with top accent line gradient
   - Title in monospace uppercase with accent color

3. frontend/src/components/ui/ActionBadge.tsx
   Props: action: Action
   - Returns styled badge: ATTACK (magenta), DEFEND (cyan), RETREAT (amber), SPECIAL (green), READY (muted)

4. frontend/src/components/ui/TxRow.tsx
   Props: hash, description, blockNumber, timestamp, verified
   - Transaction display row with pulsing green dot
   - Truncated hash (first 6, last 4)
   - "Simulated" badge if in demo mode

5. frontend/src/components/ui/Button.tsx
   Props: variant ('primary'|'danger'|'ghost'), loading, disabled, fullWidth, children, onClick
   - Primary: cyan bg, dark text, cyan glow shadow
   - Danger: magenta bg
   - Ghost: transparent, muted border
   - Loading state: spinner animation + disabled
   - Hover: slight translateY(-1px) + stronger glow
   - Active: translateY(0)

6. frontend/src/lib/battleLogic.ts
   Port the Python decision logic to TypeScript exactly:
   - decideAction(agent: AgentState, opponent: AgentState, seed: number): Action
   - computeDamage(action1: Action, action2: Action, rng: () => number): [number, number]
   - runLocalMatch(agent1: AgentConfig, agent2: AgentConfig, matchId: string): BattleResult
   Used as demo-mode fallback when engine is unreachable.
```

---

# ═══════════════════════════════════════
# PHASE 4 — INTEGRATION
# ═══════════════════════════════════════

## PROMPT 4.1 — Connect frontend to engine

```
Create frontend/src/hooks/useBattleEngine.ts

A hook that handles battle execution with real/demo fallback:

  interface UseBattleEngine {
    startBattle(match: MatchState): Promise<void>
    isConnected: boolean
    isRunning: boolean
    error: string | null
  }

startBattle():
  1. Try to connect to ENGINE_URL/health
  2. If reachable: use streaming SSE from ENGINE_URL/simulate/stream
     - Parse each event and dispatch to store: addRound, update HP, trigger animations
     - On 'complete' event: setBattleOutcome, navigate to results
  3. If not reachable: fall back to runLocalMatch() from battleLogic.ts
     - Simulate same timing (800ms per round) with setTimeout
     - Emit same events to store
  4. Both paths must produce identical store updates (same interface)

Also create frontend/src/hooks/useContractActions.ts:
  Wraps wallet hook with loading states and error handling for:
  - deployAgent(config): Promise<{ agentId }>
  - enterMatch(agentId): Promise<{ matchId }>
  - All actions show toast notifications (use a simple toast state in store)

Create frontend/src/components/ToastNotification.tsx:
  - Positioned top-right, fixed
  - Types: success (green), error (magenta), info (cyan), loading (amber pulse)
  - Auto-dismiss after 4s
  - Stacks multiple toasts
```

---

## PROMPT 4.2 — Environment & deployment config

```
Create the following configuration files:

1. frontend/.env.local (with placeholder values):
   NEXT_PUBLIC_ENGINE_URL=http://localhost:8000
   NEXT_PUBLIC_CONTRACT_ADDRESS=0x... 
   NEXT_PUBLIC_NETWORK=devnet
   NEXT_PUBLIC_DEMO_MODE=true

2. engine/.env:
   PORT=8000
   CORS_ORIGIN=http://localhost:3000
   DEBUG=true

3. docker-compose.yml (root):
   services:
     engine:
       build: ./engine
       ports: ["8000:8000"]
       environment from engine/.env
     frontend:
       build: ./frontend
       ports: ["3000:3000"]
       depends_on: [engine]
       environment from frontend/.env.local

4. Makefile (root) with commands:
   make dev      → starts both engine (uvicorn) and frontend (next dev) concurrently
   make engine   → uvicorn engine.server:app --reload --port 8000
   make frontend → cd frontend && npm run dev
   make test     → runs pytest + jest
   make build    → production builds both
   make contracts-test → cd contracts && aptos move test

5. frontend/Dockerfile:
   Multi-stage: build stage (node:20) → runtime stage (node:20-alpine)
   COPY, npm ci, npm run build, CMD next start

6. README.md (root) — complete setup guide:
   Prerequisites, installation steps, how to run (dev + production + demo mode)
   Architecture diagram (ASCII), contract addresses (placeholder), API docs link
```

---

# ═══════════════════════════════════════
# PHASE 5 — FINAL POLISH
# ═══════════════════════════════════════

## PROMPT 5.1 — Leaderboard page

```
Create frontend/src/app/leaderboard/page.tsx — a leaderboard page.

Design:
- Same dark aesthetic as main app
- Header: "AGENT LEADERBOARD" with subtitle "// Top performing agents across all matches"
- Back link to main arena

Table with columns:
  RANK | AGENT | OWNER | STRATEGY | POWER | W/L | WIN RATE | EARNINGS

Data: Hardcode 10 realistic mock entries with varied strategies and stats.
Rank 1 always has a crown emoji + gold color.
Top 3 rows have subtle left border accent.

Add sorting: clicking column headers sorts the table (client-side).
Add filter tabs: ALL | ATTACKER | DEFENDER | TACTICIAN
Add search input: filter by agent name

Make it look like a real live leaderboard — pulsing green dot next to "LIVE" in header.
Add a "Your Best Agent" card at top if wallet is connected, showing player's top agent stats.
```

---

## PROMPT 5.2 — Demo mode hardening

```
Audit the entire codebase for demo robustness:

1. In every component that makes a wallet call, ensure there's a demo-mode path
2. In frontend/src/lib/demoData.ts, create:
   - DEMO_OPPONENT_AGENTS: array of 5 varied opponent configs
   - DEMO_MATCH_ID: "demo-match-2047"
   - DEMO_TX_HASH: realistic fake hash
   - DEMO_BLOCK_NUMBER: 4721903
   - generateDemoAgent(): creates random diverse agent each time

3. Create a DemoModeBanner component:
   Small bar at top of screen (above header) when in demo mode:
   "⚡ DEMO MODE — No wallet required · Full simulation active"
   Amber background, dark text, can be dismissed

4. Make sure the battle runs perfectly with NO engine running:
   - All 4 action types appear in at least one demo match
   - HP never goes negative
   - Log messages are vivid and descriptive
   - Animations are smooth

5. Add keyboard shortcut: pressing 'D' toggles demo/real mode for quick demos

Test the full user flow end to end with no wallet and no engine:
  Build agent → Join match → Watch battle → See results
Report any bugs found and fix them.
```

---

## PROMPT 5.3 — Performance & final QA

```
Final quality pass:

1. Run next build — fix any TypeScript errors or build warnings

2. Lighthouse audit simulation — check:
   - No layout shifts (set explicit dimensions on animated elements)
   - No font flicker (fonts preloaded correctly)
   - All images/emoji have aria-labels

3. Mobile responsiveness check:
   - All screens work at 375px width
   - Touch targets are at least 44px
   - No horizontal overflow
   - Stat grid wraps to 1 column on mobile
   - Battle screen log doesn't overflow

4. Animation performance:
   - All animations use transform/opacity only (no layout-triggering properties)
   - Add will-change: transform to frequently animated elements
   - Disable complex animations if prefers-reduced-motion

5. Error boundaries:
   - Wrap each screen in an ErrorBoundary
   - Graceful fallback UI with "Something went wrong — retry" button

6. Final component list audit — ensure every component:
   - Has a display name (for React DevTools)
   - Has prop types / TypeScript interface
   - Handles loading and error states

7. Test the full demo script:
   "Here's my agent — I tuned it to be aggressive" (show sliders)
   → Create agent (show deploy button + mock tx)
   → Match with opponent (show VS screen)
   → Watch battle (show autonomous log)
   → Show winner + reward

Report any issues. Fix all of them.
```

---

# ═══════════════════════════════════════
# BONUS: PITCH AMMUNITION
# ═══════════════════════════════════════

## PROMPT B.1 — Architecture diagram for slides

```
Create a file docs/architecture.md with:

1. An ASCII art system architecture diagram showing:
   User Browser → Next.js Frontend → Python Engine → OneChain Contracts
   
2. A data flow description:
   User tunes agent config → deployed as NFT → 
   match registered onchain → engine runs deterministic simulation → 
   result hash submitted to chain → winner receives tokens

3. The one-line pitch: 
   "We're building autonomous agents that compete and coordinate onchain — 
    starting with gaming, but extensible to broader economic systems."

4. Key technical differentiators (bullet points):
   - Deterministic reproducibility (same seed = same result, forever verifiable)
   - Separation of strategy design from execution (the core insight)
   - Onchain result verification without revealing full simulation
   - Clean extension path to LLM-powered agents and RL training loops

5. Future vision (one paragraph):
   Multi-agent economic simulations, autonomous trading agents, 
   AI policy training loops — all verifiable onchain.
```

---

## PROMPT B.2 — One-page explainer

```
Create docs/ONE_PAGER.md — a clean one-page project explainer for judges:

Sections:
- The Problem: Games people play are boring. What if the game played itself intelligently?
- What We Built: Autonomous agent arena with onchain staking and deterministic AI
- How It Works: 4-step flow (Design → Deploy → Compete → Earn)
- Technical Stack: Next.js, Python, Move/OneChain, Deterministic simulation engine
- The Demo: What judges will see in 3 minutes
- Why This Wins: AI + GameFi + real systems thinking + instantly demoable
- What's Next: LLM policies, RL training, multi-agent economic systems

Format it beautifully in Markdown with clear sections, no fluff.
Keep it to one printed page (around 400 words).
```

---

# ═══════════════════════════════════════
# QUICK REFERENCE: FULL BUILD ORDER
# ═══════════════════════════════════════

```
PHASE 0: Scaffold        → Prompts 0.1, 0.2
PHASE 1: Contracts       → Prompts 1.1, 1.2, 1.3
PHASE 2: Python Engine   → Prompts 2.1, 2.2, 2.3
PHASE 3: Frontend        → Prompts 3.1 → 3.9 (in order)
PHASE 4: Integration     → Prompts 4.1, 4.2
PHASE 5: Polish          → Prompts 5.1, 5.2, 5.3
BONUS:   Pitch docs      → Prompts B.1, B.2
```

## ESTIMATED TIME
```
Phase 0:  15 min
Phase 1:  45 min  ← contracts are the riskiest, allocate buffer
Phase 2:  30 min
Phase 3:  90 min  ← biggest phase, most prompts
Phase 4:  30 min
Phase 5:  30 min
Bonus:    15 min
─────────────────
TOTAL:  ~4 hours with Claude Code
```

## IF YOU RUN OUT OF TIME — DEMO MINIMUM
```
Just these prompts still produce a working demo:

0.1, 0.2       → structure
2.1            → engine logic (core)
3.1, 3.2, 3.3  → Next.js + store + wallet
3.4, 3.6, 3.7  → builder + battle + results
3.8            → app shell
3.9            → polish
5.2            → demo hardening

= ~2.5 hours · Full demo flow · No contract needed for pitch
```

---

> 🏆 **Remember the line:** *"Other teams build games people play. We built systems that play themselves — intelligently, onchain, and verifiably."*
