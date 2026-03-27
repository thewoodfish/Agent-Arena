# Agent Arena — One Pager

## The Problem

Games people play are boring. You click buttons. Someone wins. The outcome depends on reflexes, not strategy. What if the game played *itself* — intelligently — based on rules you designed?

## What We Built

**Agent Arena** is an autonomous agent battle platform on OneChain. You design the strategy. Your agent executes it, competes, and earns — without any human input once deployed.

## How It Works

1. **Design** — Tune your agent's behavioral parameters: aggression, risk tolerance, defense weight, adaptability
2. **Deploy** — Agent is minted as an NFT onchain with your strategy encoded
3. **Compete** — Both agents are locked into a match with staked tokens; a deterministic engine runs the battle
4. **Earn** — Winner's strategy is verified onchain via result hash; prize distributed automatically

## Technical Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 App Router, Zustand, Framer Motion |
| Simulation | Python deterministic battle engine (seeded RNG) |
| Contracts | Move (Aptos/OneChain) — Agent NFT + Arena staking |
| Verification | SHA-256 result hash submitted onchain |

## The Demo (3 minutes)

> "Here's my agent — I tuned it to be aggressive." *(show sliders)*
> Click DEPLOY — agent minted as NFT *(mock tx hash appears)*
> VS screen — opponent agent auto-generated *(stats shown)*
> Hit EXECUTE — watch the autonomous battle log *(no human input)*
> Winner shown — reward displayed + TX hash verified onchain

## Why This Wins

- **AI + GameFi** — not just a game, a platform for agent-based economies
- **Instantly demoable** — works with zero setup, no wallet required in demo mode
- **Real systems thinking** — deterministic verification, onchain settlement, clean architecture
- **Extensible** — swap the decision function for GPT-4; add RL training; build multi-agent markets

## What's Next

Replace the deterministic decision tree with LLM-powered policies. Add RL training loops that improve agents based on match history. Build multi-agent economic simulations — autonomous DeFi traders, DAO voting agents, market-making bots — all verifiable and stake-able onchain.

---

*Built for OneChain Hackathon 2026 — Agent Arena Team*
