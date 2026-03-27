"""
FastAPI server exposing the Agent Arena battle engine.

Endpoints:
  POST /simulate           — run a full match, return BattleResult
  POST /simulate/stream    — run match, stream rounds as SSE
  GET  /health             — health check
  GET  /simulate/replay/{result_hash} — return cached result by hash
"""
from __future__ import annotations

import asyncio
import json
from typing import AsyncGenerator, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from battle_engine import BattleEngine

app = FastAPI(title="Agent Arena Battle Engine", version="1.0.0")

# CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory result cache keyed by result_hash
_result_cache: dict[str, dict] = {}


# ─── Pydantic models ──────────────────────────────────────────────────────────

class AgentConfigRequest(BaseModel):
    id: str
    name: str
    owner: str
    strategy: str
    aggression: int = Field(ge=0, le=100)
    risk_tolerance: int = Field(ge=0, le=100, alias="riskTolerance")
    defense_weight: int = Field(ge=0, le=100, alias="defenseWeight")
    adaptability: int = Field(ge=0, le=100)
    power_rating: int = Field(ge=0, le=100, alias="powerRating")

    model_config = {"populate_by_name": True}

    def to_engine_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "owner": self.owner,
            "strategy": self.strategy,
            "aggression": self.aggression,
            "risk_tolerance": self.risk_tolerance,
            "defense_weight": self.defense_weight,
            "adaptability": self.adaptability,
            "power_rating": self.power_rating,
        }


class SimulateRequest(BaseModel):
    agent1: AgentConfigRequest
    agent2: AgentConfigRequest
    match_id: str
    block_seed: str = Field(alias="blockSeed", default="")

    model_config = {"populate_by_name": True}

    def get_seed(self) -> str:
        return f"{self.match_id}:{self.block_seed}" if self.block_seed else self.match_id


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/health")
def health() -> dict:
    return {"status": "ok", "engine_version": "1.0.0"}


@app.post("/simulate")
def simulate(req: SimulateRequest) -> dict:
    """Run a full deterministic match and return the result."""
    seed = req.get_seed()
    engine = BattleEngine(seed=seed)
    result = engine.run_match(
        req.agent1.to_engine_dict(),
        req.agent2.to_engine_dict(),
    )
    _result_cache[result["result_hash"]] = result
    return result


@app.post("/simulate/stream")
async def simulate_stream(req: SimulateRequest):
    """
    Run a match and stream each round as a Server-Sent Event.

    Event format per round:
      data: {"round": N, "action1": "...", "action2": "...", "hp1": X, "hp2": Y, ...}

    Final event:
      data: {"type": "complete", "winner": "...", "result_hash": "..."}
    """
    seed = req.get_seed()
    engine = BattleEngine(seed=seed)
    result = engine.run_match(
        req.agent1.to_engine_dict(),
        req.agent2.to_engine_dict(),
    )
    _result_cache[result["result_hash"]] = result

    async def event_generator() -> AsyncGenerator[str, None]:
        for rnd in result["rounds"]:
            payload = {
                "round": rnd["round"],
                "action1": rnd["action1"],
                "action2": rnd["action2"],
                "damage1": rnd["damage1"],
                "damage2": rnd["damage2"],
                "hp1": rnd["hp1After"],
                "hp2": rnd["hp2After"],
                "log": rnd["log"],
            }
            yield f"data: {json.dumps(payload)}\n\n"
            await asyncio.sleep(0.05)  # slight server-side pacing

        final = {
            "type": "complete",
            "winner": result["winner"],
            "winner_address": result["winner_address"],
            "final_hp_1": result["final_hp_1"],
            "final_hp_2": result["final_hp_2"],
            "total_damage_1": result["total_damage_1"],
            "total_damage_2": result["total_damage_2"],
            "result_hash": result["result_hash"],
            "seed_used": result["seed_used"],
        }
        yield f"data: {json.dumps(final)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/simulate/replay/{result_hash}")
def replay(result_hash: str) -> dict:
    """Return a previously computed result by its hash (in-memory cache)."""
    if result_hash not in _result_cache:
        raise HTTPException(status_code=404, detail="Result not found in cache")
    return _result_cache[result_hash]


# ─── Dev runner ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
