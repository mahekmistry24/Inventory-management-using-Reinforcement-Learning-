"""
FastAPI Backend for DRL Inventory Management Dashboard.
Serves simulation steps from 7 evolutionary phases of the RL project.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import traceback

from phase_adapter import PhaseAdapter

# ------------------------------------------------------------------ #
#  App & Middleware
# ------------------------------------------------------------------ #
app = FastAPI(
    title="DRL Inventory Management API",
    description="Serves simulation steps from 7 evolutionary phases of the RL project",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global adapter instance
adapter = PhaseAdapter()

# ------------------------------------------------------------------ #
#  Request / Response models
# ------------------------------------------------------------------ #
class InitPhaseRequest(BaseModel):
    phase: int

class StepRequest(BaseModel):
    action: Optional[list] = None

# ------------------------------------------------------------------ #
#  Endpoints
# ------------------------------------------------------------------ #
@app.get("/api/phase_info")
def get_phase_info():
    """Return metadata for all 7 phases."""
    return {"phases": adapter.get_all_phases_info()}


@app.post("/api/init_phase")
def init_phase(req: InitPhaseRequest):
    """Initialize (or switch to) a specific phase."""
    try:
        result = adapter.load_phase(req.phase)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to load phase: {str(e)}")


@app.post("/api/step")
def step(req: StepRequest = StepRequest()):
    """Advance the simulation by one tick."""
    try:
        import numpy as np
        action = None
        if req.action is not None:
            action = np.array(req.action)
        result = adapter.step(action)
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Step failed: {str(e)}")


@app.post("/api/reset")
def reset():
    """Reset the current phase environment."""
    try:
        result = adapter.reset()
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Reset failed: {str(e)}")


@app.get("/api/history")
def get_history():
    """Return the full step history for the current episode."""
    return {"history": adapter.history}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
