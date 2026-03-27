<div align="center">

# ⚔️ AGENT ARENA

### Autonomous AI agents. Onchain strategy. OCT on the line.

**Deploy a tuned agent. Lock your stake. Watch it fight.**

[![OneChain Testnet](https://img.shields.io/badge/OneChain-Testnet-00FFE0?style=flat-square&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMiIgZmlsbD0iIzAwRkZFMCIvPjwvc3ZnPg==)](https://onescan.cc/testnet/object/0xa577d992e4aa49fc5f48d7620e83e472907dd94cb1994b827c4f9284077a21f4)
[![Move](https://img.shields.io/badge/Move-Smart%20Contracts-FF00AA?style=flat-square)](./contracts)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](./frontend)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)](./engine)
[![Tests](https://img.shields.io/badge/Tests-9%20passing-00FFE0?style=flat-square)](#tests)
[![Vercel](https://img.shields.io/badge/Vercel-Live-black?style=flat-square&logo=vercel)](https://frontend-lyart-six-24.vercel.app)

---

[**Play Now (Demo)**](https://frontend-lyart-six-24.vercel.app) · [**Live Contracts**](#deployed-contracts) · [**Architecture**](#architecture) · [**OneChain Integration**](#onechain-integration)

</div>

---

## What Is Agent Arena?

Agent Arena is a **fully onchain strategy game** on OneChain where players program the decision logic of autonomous AI agents — then put real OCT on the outcome.

You don't play the game. **Your agent does.**

Configure four behavioral parameters — aggression, risk tolerance, defense weight, adaptability — and your agent executes a deterministic combat strategy across up to 10 rounds. The battle engine runs off-chain but its result hash is committed onchain. Anyone can verify any result. Nobody can fake one.

> *"Strategy wins" is not a tagline. It's the contract invariant.*

---

## Deployed Contracts

| | |
|---|---|
| **Network** | OneChain Testnet |
| **Package ID** | [`0xa577d992e4aa49fc5f48d7620e83e472907dd94cb1994b827c4f9284077a21f4`](https://onescan.cc/testnet/object/0xa577d992e4aa49fc5f48d7620e83e472907dd94cb1994b827c4f9284077a21f4) |
| **Deploy TX** | [`74HPGUE8H6VS7et8j7UvFDioLML3joxZVtM8SsqW7JwC`](https://onescan.cc/testnet/txblock/74HPGUE8H6VS7et8j7UvFDioLML3joxZVtM8SsqW7JwC) |
| **Modules** | `agent_arena::agent` · `agent_arena::arena` |
| **AdminCap** | `0x335703b9d2e140edf93bc73f3fef66c607b5481f0a4a060d2927fec86fffc887` |

---

## Quickstart

### No wallet needed — try it right now

```bash
git clone https://github.com/<your-org>/agent-arena
cd agent-arena
make install
make dev
# → http://localhost:3000
```

**Demo mode is on by default.** Every screen is interactive — agent minting, stake locking, round-by-round battle streaming — all simulated locally. Zero wallet required.

Press **`D`** to toggle demo mode on/off at any time.

### With a real OneWallet

1. Install the [OneWallet](https://onelabs.cc/wallet) browser extension
2. Switch to **OneChain testnet**
3. Fund your wallet from the faucet:
   ```bash
   curl -X POST https://faucet-testnet.onelabs.cc/v1/gas \
     -H "Content-Type: application/json" \
     -d '{"FixedAmountRequest":{"recipient":"<YOUR_ADDRESS>"}}'
   ```
4. Click **CONNECT WALLET** in the app header — real transactions from here

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│                                                             │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────────┐  │
│  │ AgentBuilder │ → │  MatchLobby  │ → │  BattleScreen  │  │
│  │              │   │              │   │                │  │
│  │ tune params  │   │ lock OCT     │   │ SSE stream     │  │
│  │ preview code │   │ find opponent│   │ round by round │  │
│  └──────────────┘   └──────────────┘   └────────────────┘  │
│         │                  │                    │           │
│         ▼                  ▼                    ▼           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              @onelabs/dapp-kit                      │   │
│  │   OneWallet · OneID name resolution · SuiClient     │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
    ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐
    │  FastAPI    │  │  OneChain   │  │   OneChain Testnet   │
    │  Engine     │  │    RPC      │  │                      │
    │             │  │             │  │  agent_arena::agent  │
    │  POST       │  │  wallet     │  │  ├─ Agent NFT        │
    │  /simulate  │  │  queries    │  │  │  (key, store)     │
    │  /stream    │  │  balance    │  │  │                   │
    │  /replay    │  │  name svc   │  │  agent_arena::arena  │
    │             │  │             │  │  ├─ Match (shared)   │
    │  seeded RNG │  │             │  │  ├─ Balance<OCT>     │
    │  SHA-256    │  │             │  │  └─ AdminCap         │
    └─────────────┘  └─────────────┘  └──────────────────────┘
```

### Data flow for a real match

```
1. create_agent tx  →  Agent NFT minted to wallet (has key, store)
2. create_match tx  →  Match shared object created, OCT locked in escrow
3. join_match tx    →  Player 2 joins, match goes active
4. POST /simulate   →  Engine runs seeded deterministic battle
5. submit_result tx →  Result hash committed onchain, winner receives prize pool
```

---

## The Battle Engine

The engine (`engine/battle_engine.py`) is a **fully deterministic**, seeded simulator. Given the same `match_id`, it always produces the exact same winner — no randomness that can be gamed.

### Actions & Damage Matrix

Four actions interact through a fixed table:

|  | vs `attack` | vs `defend` | vs `retreat` | vs `special` |
|---|---|---|---|---|
| **attack** | (10, 12) | (0, 6) | (0, 16) | (8, 14) |
| **defend** | (6, 0) | (0, 0) | (0, 0) | (9, 1) |
| **retreat** | (16, 0) | (0, 0) | (0, 0) | (0, 0) |
| **special** | (14, 8) | (1, 9) | (0, 20) | (15, 15) |

*Values are (damage_to_agent1, damage_to_agent2)*

### Agent decision logic

Each round, an agent's action is determined by its parameters:

```python
def decide_action(hp, opponent_last_action, params):
    # 1. Retreat if HP critical (risk_tolerance sets the threshold)
    if hp < (30 - risk_tolerance * 0.15):
        return "retreat"

    # 2. Defend against aggression (defense_weight + adaptability)
    if opponent_aggression > (65 - adaptability * 0.2) and hp < (60 + defense_weight * 0.2):
        return "defend"

    # 3. Attack when healthy (aggression drives this)
    if hp > (50 + defense_weight * 0.15):
        if strategy == "attacker" and aggression > 40:
            return "attack"

    # 4. Special move (adaptability unlocks this)
    if adaptability > 60 and rng() < 0.25:
        return "special"

    return "defend"
```

The frontend **previews the exact same logic** in real-time as you tune sliders. What you see is what executes.

### Power rating formula (identical onchain and off)

```
power = (aggression×35 + risk_tolerance×20 + defense_weight×20 + adaptability×25) / 100
```

This formula runs in both the Move contract (`compute_power_rating`) and the TypeScript frontend. The preview is truthful.

---

## Smart Contracts

### `agent_arena::agent`

```move
// Mint an Agent NFT — transferred directly to sender's wallet
public entry fun create_agent(
    name: vector<u8>,
    strategy: u8,        // 0=attacker | 1=defender | 2=tactician
    aggression: u8,      // 0–100
    risk_tolerance: u8,  // 0–100
    defense_weight: u8,  // 0–100
    adaptability: u8,    // 0–100
    ctx: &mut TxContext,
)

// Agent struct — first-class OneChain object, owned by player wallet
public struct Agent has key, store {
    id: UID,
    name: String,
    owner: address,
    strategy: u8,
    aggression: u8,
    risk_tolerance: u8,
    defense_weight: u8,
    adaptability: u8,
    power_rating: u8,
    wins: u64,
    losses: u64,
}
```

### `agent_arena::arena`

```move
// Match — shared object, lives onchain until completed or cancelled
public struct Match has key {
    id: UID,
    player1: address,
    player2: address,
    agent1_id: ID,
    agent2_id: Option<ID>,
    stake_amount: u64,
    status: u8,               // 0=pending | 1=active | 2=complete
    winner: Option<address>,
    result_hash: vector<u8>,  // SHA-256 of battle result — trustless verification
    escrow: Balance<OCT>,     // stakes held here, released to winner
}

// Match lifecycle
public entry fun create_match(agent: &Agent, stake: Coin<OCT>, ctx: &mut TxContext)
public entry fun join_match(match: &mut Match, agent: &Agent, stake: Coin<OCT>, ctx: &mut TxContext)
public entry fun submit_result(_cap: &AdminCap, match: &mut Match, winner: address, result_hash: vector<u8>, ctx: &mut TxContext)
public entry fun cancel_match(match: &mut Match, ctx: &mut TxContext)
```

**Security:** OCT stakes live inside the shared `Match` object's `Balance<OCT>` field. No admin can withdraw them — only `submit_result` (which requires `AdminCap` + a valid winner address) or `cancel_match` (which refunds only when match is still pending, only to creator) can move funds.

---

## OneChain Integration

| Tool | How We Use It |
|---|---|
| **OneWallet** | Primary wallet adapter via `@onelabs/dapp-kit` — `useConnectWallet`, `useCurrentAccount`, `useSignAndExecuteTransaction` |
| **OneID** | `useOneID` hook resolves wallet addresses to `.one` names in real-time — shown in the header when connected |
| **OneChain Move** | Two production modules deployed on testnet — Agent NFT + Arena match lifecycle |
| **OCT Token** | Native staking currency, `Balance<OCT>` escrow in `Match` objects |
| **OneScan** | Every transaction and the deployed package link directly to the OneChain block explorer |
| **Testnet Faucet** | Integrated faucet call in the wallet hook (`requestFaucet`) |

### OneID integration

```typescript
// hooks/useOneID.ts
export function useOneID(address: string | null | undefined): string | null {
  const client = useSuiClient();
  // Resolves address → "alice.one" via suix_resolveNameServiceNames
  // Falls back to null silently if no name registered
}

// Used in WalletButton — shows "alice.one" instead of "0x1234…5678"
const displayName = useDisplayName(address);
```

---

## Engine API

```
POST /simulate
     { agent1, agent2, match_id, blockSeed? }
     → BattleResult { winner, rounds[], totalRounds, winnerHp, txHash, resultHash }

POST /simulate/stream
     Same body — returns text/event-stream
     One SSE event per round, final "complete" event with full result

GET  /health
     → { status: "ok", version: "1.0.0" }

GET  /simulate/replay/{result_hash}
     → Cached BattleResult (deterministic — hash always returns same result)
```

---

## Environment Variables

```bash
# frontend/.env.local
NEXT_PUBLIC_ENGINE_URL=http://localhost:8000
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_PACKAGE_ID=0xa577d992e4aa49fc5f48d7620e83e472907dd94cb1994b827c4f9284077a21f4
```

---

## Tests

```bash
# All tests
make test

# Engine — 9 unit tests
cd engine && python -m pytest tests/ -v

# Frontend — TypeScript + production build
cd frontend && npm run build
```

---

## Deploy Contracts Yourself

```bash
# 1. Install one CLI v1.1.1
curl -L -o one.tgz \
  https://github.com/one-chain-labs/onechain/releases/download/v1.1.1/one-mainnet-v1.1.1-macos-arm64.tgz
tar -xzf one.tgz && mv one /usr/local/bin/

# 2. Create wallet + fund from faucet
one client new-address ed25519
curl -X POST https://faucet-testnet.onelabs.cc/v1/gas \
  -H "Content-Type: application/json" \
  -d '{"FixedAmountRequest":{"recipient":"<ADDRESS>"}}'

# 3. Build and publish
cd contracts
one move build
one client publish --gas-budget 200000000

# 4. Wire up the frontend
echo "NEXT_PUBLIC_PACKAGE_ID=<PackageID>" >> frontend/.env.local
```

---

## Docker

```bash
docker-compose up --build
# Engine on :8000, frontend on :3000
```

---

## Project Structure

```
agent-arena/
├── contracts/
│   ├── Move.toml
│   └── sources/
│       ├── Agent.move       # Agent NFT — mint, own, update strategy
│       └── Arena.move       # Match lifecycle — stake, escrow, verify, pay out
│
├── engine/
│   ├── battle_engine.py     # Deterministic seeded simulator
│   ├── server.py            # FastAPI — /simulate, /simulate/stream, /health
│   ├── requirements.txt
│   └── tests/
│       └── test_engine.py   # 9 tests covering engine + API
│
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── page.tsx              # Game flow: build → lobby → battle → results
│       │   └── leaderboard/page.tsx  # Agent leaderboard
│       ├── components/
│       │   ├── screens/              # AgentBuilder, MatchLobby, BattleScreen, ResultsScreen
│       │   ├── providers/            # OneChainProvider (SuiClientProvider + WalletProvider)
│       │   └── ui/                   # Panel, Button, SliderField, TxRow
│       ├── hooks/
│       │   ├── useWallet.ts          # useOneWallet (real) · useMockWallet (demo)
│       │   ├── useOneID.ts           # OneID name resolution
│       │   └── useBattleEngine.ts    # SSE streaming hook
│       ├── lib/
│       │   ├── constants.ts          # Package ID, RPC, faucet, explorer
│       │   └── types.ts              # Shared TypeScript types
│       └── store/
│           └── gameStore.ts          # Zustand + Immer + persist
│
├── docker-compose.yml
├── Makefile
└── README.md
```

---

<div align="center">

Built for the **OneChain Hackathon 2026**

*Autonomous agents · Compete onchain · Strategy wins*

</div>
