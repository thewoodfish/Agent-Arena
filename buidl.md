# Agent Arena — BUIDL Description

## What We Built

Agent Arena is a fully onchain strategy game on OneChain where players program the decision logic of autonomous AI agents, stake OCT tokens, and watch a deterministic battle engine decide the winner — transparently and verifiably.

You don't play the game. **Your agent does.**

---

## The Problem

Onchain games today fall into two categories:

1. **Pure luck** — coin flips, dice rolls, loot boxes. No skill, no depth.
2. **Regular games with wallets** — existing games with a token economy grafted on. The blockchain is cosmetic.

Neither rewards genuine strategic thinking. Neither uses the blockchain for what it's actually good at: **trustless execution and verifiable outcomes**.

---

## How It Works

### 1. Build Your Agent

Players configure four behavioral parameters on a sliders-based UI:

- **Aggression** — probability of choosing `attack` each round
- **Risk Tolerance** — HP threshold before retreating
- **Defense Weight** — willingness to absorb hits and defend
- **Adaptability** — probability of countering the opponent's last move

As each slider moves, a real-time pseudocode preview updates to show the exact decision logic that will run in battle. The preview is not approximate — it renders the same algorithm the engine executes. What you see is what fights.

A **power rating** is computed identically in both the Move contract and the TypeScript frontend:

```
power = (aggression×35 + risk_tolerance×20 + defense_weight×20 + adaptability×25) / 100
```

### 2. Mint Onchain

Clicking **Deploy to Arena** calls `agent_arena::create_agent` on OneChain testnet. The agent is minted as a first-class Move object (`has key, store`) and transferred directly to the player's wallet — a real NFT they own.

### 3. Lock Your Stake

The player creates a match via `agent_arena::create_match`, locking OCT into a shared `Match` object. The OCT is held in a `Balance<OCT>` field inside the contract — no admin can touch it. An opponent joins via `join_match`, matching the stake. The prize pool is now live onchain.

### 4. Battle

The Python battle engine runs a **fully deterministic, seeded simulation**. The seed is derived from the `match_id`, so the same match always produces the same result — no randomness that can be gamed or manipulated.

Each round, both agents simultaneously choose an action (`attack`, `defend`, `retreat`, `special`) based on their parameters and the opponent's last move. Outcomes are resolved through a fixed damage matrix:

|  | vs attack | vs defend | vs retreat | vs special |
|--|--|--|--|--|
| **attack** | (10, 12) | (0, 6) | (0, 16) | (8, 14) |
| **defend** | (6, 0) | (0, 0) | (0, 0) | (9, 1) |
| **retreat** | (16, 0) | (0, 0) | (0, 0) | (0, 0) |
| **special** | (14, 8) | (1, 9) | (0, 20) | (15, 15) |

Rounds stream to the frontend over **Server-Sent Events (SSE)**, so players watch the fight unfold in real-time — action by action, HP bar by HP bar.

### 5. Verify and Pay Out

The engine produces a SHA-256 hash of the full battle result. This hash is submitted onchain via `arena::submit_result` (gated by `AdminCap`). The smart contract distributes the full prize pool to the winner's address. The result hash is stored permanently in the `Match` object — anyone can independently re-run the engine with the same seed and verify the outcome.

---

## Smart Contracts

Two Move modules deployed on OneChain testnet:

**`agent_arena::agent`**
- Mints Agent NFTs with combat configuration
- Computes power rating onchain (identical formula to frontend)
- Records wins/losses per agent
- Emits `AgentCreated` and `AgentUpdated` events

**`agent_arena::arena`**
- Creates shared `Match` objects with `Balance<OCT>` escrow
- Full match lifecycle: `create_match` → `join_match` → `submit_result`
- `cancel_match` refunds creator if no opponent has joined
- Emits `MatchCreated`, `MatchStarted`, `MatchCompleted` events
- `AdminCap` pattern for result submission — capability-based, not address-based

**Package ID:** `0xa577d992e4aa49fc5f48d7620e83e472907dd94cb1994b827c4f9284077a21f4`
**Network:** OneChain Testnet
**Deploy TX:** `74HPGUE8H6VS7et8j7UvFDioLML3joxZVtM8SsqW7JwC`

---

## OneChain Integration

| Tool | Integration |
|---|---|
| **OneWallet** | Full wallet connection via `@onelabs/dapp-kit` — `useConnectWallet`, `useCurrentAccount`, `useSignAndExecuteTransaction` |
| **OneID** | `useOneID` hook resolves connected wallet address to `.one` name via `suix_resolveNameServiceNames` — displayed in the header |
| **Move contracts** | Two production modules live on testnet — Agent NFT ownership and OCT escrow |
| **OCT Token** | Native staking currency, `Balance<OCT>` held in shared Match objects |
| **OneScan** | Every transaction and the package link directly to the OneChain block explorer |

---

## Demo Mode

The entire game flow works **without a wallet, without a running engine, without any external dependency**. Demo mode runs client-side simulations using the same battle logic as the Python engine. This means judges and new users can experience the full product — agent building, match lobbying, round-by-round battle streaming, onchain verification display — instantly, in browser, with zero setup.

Press **D** to toggle demo mode at any time.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Move on OneChain (`one::` framework), `one` CLI v1.1.1 |
| Battle Engine | Python 3.11, FastAPI, SSE streaming, seeded `random.Random` |
| Frontend | Next.js 15, TypeScript, Tailwind CSS, Framer Motion |
| Wallet | `@onelabs/dapp-kit` — OneWallet adapter |
| Identity | OneID via `resolveNameServiceNames` RPC |
| State | Zustand + Immer + persist middleware |
| Deployment | Vercel (frontend) · OneChain Testnet (contracts) |

---

## Live Links

- **App:** https://frontend-lyart-six-24.vercel.app
- **Package:** https://onescan.cc/testnet/object/0xa577d992e4aa49fc5f48d7620e83e472907dd94cb1994b827c4f9284077a21f4
- **Repo:** https://github.com/thewoodfish/Agent-Arena
