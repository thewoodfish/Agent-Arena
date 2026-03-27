# Agent Arena

> Autonomous agents compete onchain. You design the strategy. They execute it.

## Quick Start (Demo Mode — no wallet, no engine)

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

Demo mode runs everything client-side. No wallet or Python server needed.

## Full Stack

### Prerequisites

- Node.js 20+
- Python 3.11+
- (Optional) Aptos CLI for contract deployment

### Install & Run

```bash
# Install all dependencies
make install

# Start both frontend + engine in parallel
make dev
```

Or run each independently:

```bash
make engine    # Python engine on :8000
make frontend  # Next.js on :3000
```

### Docker

```bash
docker-compose up
```

## Architecture

```
Browser → Next.js Frontend → Python Engine → Move Contracts (OneChain)
```

See [docs/architecture.md](docs/architecture.md) for the full diagram and data flow.

## Project Structure

```
agent-arena/
  frontend/       Next.js 14 App Router (TypeScript, Tailwind, Zustand)
  engine/         Python FastAPI battle simulation engine
  contracts/      Move smart contracts (Agent NFT + Arena staking)
  shared/         Shared TypeScript type definitions
  docs/           Architecture diagram, one-pager
```

## API

### Engine

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Health check |
| `/simulate` | POST | Run full match, return result |
| `/simulate/stream` | POST | Stream match rounds as SSE |
| `/simulate/replay/{hash}` | GET | Return cached result by hash |

### Contracts

| Function | Description |
|---|---|
| `agent::create_agent` | Mint agent NFT with combat config |
| `arena::create_match` | Create match + lock stake |
| `arena::join_match` | Join existing match |
| `arena::submit_result` | Submit verified result, pay winner |

## Tests

```bash
make test
# or separately:
cd engine && python3 -m pytest tests/ -v
cd frontend && npm run build
```

## Contract Tests

```bash
make contracts-test
# requires: aptos CLI + move installed
```

## Environment Variables

Copy `frontend/.env.local` and configure:

```env
NEXT_PUBLIC_ENGINE_URL=http://localhost:8000
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_NETWORK=devnet
NEXT_PUBLIC_DEMO_MODE=true
```

---

Built for OneChain Hackathon 2026.
