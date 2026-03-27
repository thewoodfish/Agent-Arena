# Agent Arena — System Architecture

## One-Line Pitch

> "We're building autonomous agents that compete and coordinate onchain —
>  starting with gaming, but extensible to broader economic systems."

---

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                              │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │            Next.js 14 Frontend (App Router)            │    │
│  │                                                        │    │
│  │  AgentBuilder  →  MatchLobby  →  BattleScreen  →  Results  │
│  │                                                        │    │
│  │  Zustand Store  |  Framer Motion  |  Demo Mode Fallback│    │
│  └───────────────────────┬────────────────────────────────┘    │
│                           │  POST /simulate/stream (SSE)        │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                ┌───────────▼──────────────┐
                │  Python FastAPI Engine   │
                │  (battle_engine.py)      │
                │                          │
                │  Deterministic simulation│
                │  Seeded RNG (match_id +  │
                │  block_hash)             │
                │  SHA-256 result hash     │
                └───────────┬──────────────┘
                            │  submit_result(match_id, winner, hash)
                            │
                ┌───────────▼──────────────────────────┐
                │     OneChain / Aptos Move Contracts   │
                │                                       │
                │  Agent.move    — NFT registry         │
                │  Arena.move    — Match & staking       │
                │                                       │
                │  create_agent() → NFT minted           │
                │  create_match() → stake locked         │
                │  join_match()   → match goes active    │
                │  submit_result() → winner paid         │
                └───────────────────────────────────────┘
```

---

## Data Flow

```
1. User tunes agent config (sliders: aggression, risk, defense, adaptability)
        ↓
2. Agent deployed as NFT onchain via create_agent()
        ↓
3. Match registered: both players stake tokens via create_match() + join_match()
        ↓
4. Python engine runs deterministic simulation (seed = match_id + block_hash)
   → Produces result_hash = SHA-256(seed + winner + rounds + final_hp)
        ↓
5. Result hash submitted to chain via submit_result()
   → Smart contract verifies + distributes prize to winner
        ↓
6. Frontend shows animated battle replay + onchain verification proof
```

---

## Key Technical Differentiators

- **Deterministic reproducibility** — same seed always produces the same result, forever verifiable
- **Separation of concerns** — strategy design (UI) is fully decoupled from execution (engine)
- **Onchain result verification** — result hash submitted without revealing full simulation state
- **Demo-first architecture** — entire flow runs client-side with no wallet or server needed
- **Clean extension path** — swap `decide_action()` for an LLM call; add RL training loop on top

---

## Future Vision

Multi-agent economic simulations, autonomous trading agents, AI policy training loops —
all verifiable onchain. The core insight: once you can verify that an agent followed its
programmed strategy deterministically, you can stake real value on any agent behavior.
LLM-powered agents, RL-trained policies, and multi-agent market simulations become
natural extensions of the same architecture.
