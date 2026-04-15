"""
PhaseAdapter — Unified bridge between FastAPI and 7 different Gym environments.

Handles:
  - Dynamic sys.path manipulation for per-phase imports
  - Import compatibility shims (gymnasium as gym, stub stable_baselines)
  - Class-level counter resets
  - Uniform state → JSON serialization
  - A reorder-point heuristic policy
"""

import sys
import os
import importlib
import types
import numpy as np
from phase_configs import PHASE_CONFIGS

# Root of the repository (two levels up from webapp/backend)
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


# ------------------------------------------------------------------ #
#  IMPORT COMPATIBILITY SHIMS
#  The original code does `import gym` (old API) and imports
#  `stable_baselines` / `stable_baselines3`. We redirect gym → gymnasium
#  and create stub modules for SB so the Environment classes can load
#  without requiring PyTorch / TensorFlow.
# ------------------------------------------------------------------ #
def _install_import_shims():
    """Call once at module load to set up compatibility shims."""

    # 1) Make `import gym` use gymnasium under the hood
    import gymnasium
    sys.modules["gym"] = gymnasium
    sys.modules["gym.spaces"] = gymnasium.spaces

    # 2) Stub out stable_baselines (v2) — only Phase 1 & 2 import it
    _make_stub("stable_baselines")
    _make_stub("stable_baselines.common")
    _make_stub("stable_baselines.common.policies")
    # Add a dummy MlpPolicy attribute
    sys.modules["stable_baselines.common.policies"].MlpPolicy = type("MlpPolicy", (), {})
    # Add a dummy PPO2 class
    sys.modules["stable_baselines"].PPO2 = type("PPO2", (), {})

    # 3) Stub out stable_baselines3 — Phases 3-7 import it
    _make_stub("stable_baselines3")
    sys.modules["stable_baselines3"].PPO = type("PPO", (), {})
    sys.modules["stable_baselines3"].DQN = type("DQN", (), {})


def _make_stub(name: str):
    """Create a stub module in sys.modules if it doesn't exist."""
    if name not in sys.modules:
        sys.modules[name] = types.ModuleType(name)


# Install shims immediately on import
_install_import_shims()


class PhaseAdapter:
    """Wraps any phase's Environment in a uniform interface."""

    def __init__(self):
        self.env = None
        self.phase = None
        self.config = None
        self.history = []          # step-level history for charts
        self._loaded_module = None
        self._demand_history = []  # actual demand per step (Phase 7)

    # ------------------------------------------------------------------ #
    #  Phase loading
    # ------------------------------------------------------------------ #
    def load_phase(self, phase_number: int):
        """Instantiate the environment for the given phase number."""
        if phase_number not in PHASE_CONFIGS:
            raise ValueError(f"Unknown phase: {phase_number}")

        self.config = PHASE_CONFIGS[phase_number]
        self.phase = phase_number
        self.history = []
        self._demand_history = []

        # Reset class-level counters that accumulate across loads
        self._reset_class_counters()

        # Dynamically import the rl_environment module from the phase folder
        phase_folder = os.path.join(REPO_ROOT, self.config["folder"])
        env_module = self._import_phase_module(phase_folder)

        # Create Environment instance with phase-specific kwargs
        kwargs = dict(self.config["env_kwargs"])
        self.env = env_module.Environment(**kwargs)

        # Grab initial state snapshot
        return self._build_init_response()

    def _import_phase_module(self, phase_folder: str):
        """Import `rl_environment` from a specific phase folder."""
        # Ensure the phase folder is on sys.path so relative imports work
        # Ensure the phase folder is at the front of sys.path so relative imports work
        if phase_folder in sys.path:
            sys.path.remove(phase_folder)
        sys.path.insert(0, phase_folder)

        # Remove previously cached simulation modules to avoid cross-phase bleed
        modules_to_remove = [
            k for k in sys.modules
            if k.startswith("simulation") or k == "rl_environment"
        ]
        for m in modules_to_remove:
            del sys.modules[m]

        module = importlib.import_module("rl_environment")
        self._loaded_module = module
        return module

    def _reset_class_counters(self):
        """Reset class-level counters that persist across instantiations."""
        # We need to reset these in the actual imported classes.
        # Since we clear sys.modules before each import, fresh classes
        # are loaded with count = 0. But just to be safe, we also
        # try to reset counters in any lingering references.
        for key in list(sys.modules.keys()):
            if "class_customer" in key:
                mod = sys.modules[key]
                if hasattr(mod, "Customer"):
                    mod.Customer.id_count = 0
            if "class_warehouse" in key:
                mod = sys.modules[key]
                if hasattr(mod, "RegionalWarehouse"):
                    mod.RegionalWarehouse.instance_count = 0

    # ------------------------------------------------------------------ #
    #  Step / Reset
    # ------------------------------------------------------------------ #
    def step(self, action=None):
        """Advance the simulation by one time step."""
        if self.env is None:
            raise RuntimeError("No environment loaded. Call load_phase() first.")

        # If no action supplied, use heuristic
        if action is None:
            action = self._heuristic_action()

        state, reward, done, info = self.env.step(action)

        step_data = self._extract_step_data(state, reward, done, info, action)
        self.history.append(step_data)
        return step_data

    def reset(self):
        """Reset the current environment."""
        if self.env is None:
            raise RuntimeError("No environment loaded. Call load_phase() first.")

        self.history = []
        self._demand_history = []
        self.env.reset()
        return self._build_init_response()

    # ------------------------------------------------------------------ #
    #  Heuristic policy
    # ------------------------------------------------------------------ #
    def _heuristic_action(self):
        """
        Simple reorder-point policy:
        - For each RW: if inventory < threshold → order largest size
        - For CW (if manufacturer): if CW inventory < threshold → request shipment
        """
        phase = self.phase
        config = self.config

        if phase == 1:
            # Phase 1: Discrete(2) — ship if inventory < 60% of limit
            inv = self.env.simulation.get_regional_warehouse_by_id(1).get_inventory_amount()
            limit = config["env_kwargs"]["rw_inventory_limit"]
            return 1 if inv < limit * 0.4 else 0

        if phase == 2:
            # Phase 2: MultiDiscrete([2, 2, 2])
            actions = []
            limit = config["env_kwargs"]["rw_inventory_limit"]
            for rw_id in self.env.simulation.get_regional_warehouses():
                inv = self.env.simulation.get_regional_warehouse_by_id(rw_id).get_inventory_amount()
                actions.append(1 if inv < limit * 0.4 else 0)
            return np.array(actions)

        # Phases 3–7: MultiDiscrete per RW + optional MFR action
        has_manufacturer = config["features"]["manufacturer"]
        has_variable = config["features"]["variable_sizing"]
        rw_limit = config["env_kwargs"]["rw_inventory_limit"]

        actions = []
        for rw_id in self.env.simulation.get_regional_warehouses():
            inv = self.env.simulation.get_regional_warehouse_by_id(rw_id).get_inventory_amount()
            if has_variable:
                # 0 = no order, 1 = small, 2 = large
                if inv < rw_limit * 0.25:
                    actions.append(2)   # large order
                elif inv < rw_limit * 0.45:
                    actions.append(1)   # small order
                else:
                    actions.append(0)
            else:
                actions.append(1 if inv < rw_limit * 0.4 else 0)

        if has_manufacturer:
            cw_inv = self.env.simulation.get_central_warehouse().get_inventory_amount()
            cw_limit = config["env_kwargs"]["cw_inventory_limit"]
            actions.append(1 if cw_inv < cw_limit * 0.5 else 0)

        return np.array(actions)

    # ------------------------------------------------------------------ #
    #  Helpers
    # ------------------------------------------------------------------ #
    def _get_sim_round(self):
        """Safely get the current round from the simulation."""
        sim = self.env.simulation
        if hasattr(sim, 'get_round'):
            return sim.get_round()
        return getattr(sim, '_round', 1)

    # ------------------------------------------------------------------ #
    #  State extraction → uniform JSON
    # ------------------------------------------------------------------ #
    def _extract_step_data(self, state, reward, done, info, action):
        """Convert the heterogeneous state formats into a uniform dict."""
        sim = self.env.simulation
        features = self.config["features"]
        num_rw = len(sim.get_regional_warehouses())

        # Regional warehouse inventories
        rw_inventories = []
        rw_lost_sales = []
        for rw_id in sim.get_regional_warehouses():
            rw = sim.get_regional_warehouse_by_id(rw_id)
            rw_inventories.append(int(rw.get_inventory_amount()))
            rw_lost_sales.append(int(rw.get_lost_sales_last_round()))

        # Central warehouse
        cw_inventory = int(sim.get_central_warehouse().get_inventory_amount())

        # Manufacturer
        mfr_inventory = None
        if features["manufacturer"] and sim.get_manufacturer():
            mfr_inventory = int(sim.get_manufacturer().get_inventory_amount())

        # Active shipments (RW-bound)
        active_shipments = []
        for s in sim.get_all_active_shipments():
            active_shipments.append({
                "to_rw": s["regional_warehouse"],
                "amount": s["amount"],
                "arrival": s["arrival"],
            })

        # Active CW shipments (from manufacturer)
        active_cw_shipments = []
        if features["manufacturer"] and hasattr(sim, "get_all_active_cw_shipments"):
            for s in sim.get_all_active_cw_shipments():
                active_cw_shipments.append({
                    "amount": s["amount"],
                    "arrival": s["arrival"],
                })

        # Demand data (for Phase 7)
        actual_demand = None
        forecasts = None
        if features["forecasting"] and hasattr(self.env, "use_advanced_demand_simulation") and self.env.use_advanced_demand_simulation:
            # Actual demand this round
            actual_demand = []
            for rw_id in sim.get_regional_warehouses():
                rw = sim.get_regional_warehouse_by_id(rw_id)
                customer = rw.get_customer()
                current_round = self._get_sim_round()
                if hasattr(customer, '_predefined_demand') and customer._predefined_demand:
                    idx = max(0, min(current_round - 2, len(customer._predefined_demand) - 1))
                    actual_demand.append(int(customer._predefined_demand[idx]))
                else:
                    actual_demand.append(int(customer.get_demand_per_step()))

            # Forecasts from state
            if isinstance(state, dict) and "forecasts" in state:
                forecasts = state["forecasts"].tolist()

        # Convert action for JSON
        if isinstance(action, np.ndarray):
            action_list = action.tolist()
        elif isinstance(action, (int, np.integer)):
            action_list = [int(action)]
        else:
            action_list = list(action) if action is not None else []

        # Eval params
        eval_params = self.env.evaluation_parameters()

        if hasattr(self.env, 'current_round'):
            current_round = self.env.current_round - 1
        else:
            current_round = self._get_sim_round() - 1
        if current_round < 1:
            current_round = len(self.history) + 1

        return {
            "round": current_round,
            "done": bool(done),
            "reward": round(float(reward), 4),
            "cumulative_reward": round(float(eval_params["total_reward_gained"]), 4),
            "rw_inventories": rw_inventories,
            "cw_inventory": cw_inventory,
            "manufacturer_inventory": mfr_inventory,
            "active_shipments": active_shipments,
            "active_cw_shipments": active_cw_shipments,
            "lost_sales_this_step": rw_lost_sales,
            "total_lost_sales": int(eval_params["total_lost_sales"]),
            "total_shipments": int(eval_params["total_shipments"]),
            "action_taken": action_list,
            "forecasts": forecasts,
            "actual_demand": actual_demand,
            "num_rw": num_rw,
        }

    def _build_init_response(self):
        """Build the response returned by load_phase() and reset()."""
        sim = self.env.simulation
        features = self.config["features"]
        num_rw = len(sim.get_regional_warehouses())

        rw_inventories = []
        for rw_id in sim.get_regional_warehouses():
            rw_inventories.append(int(sim.get_regional_warehouse_by_id(rw_id).get_inventory_amount()))

        cw_inventory = int(sim.get_central_warehouse().get_inventory_amount())

        mfr_inventory = None
        if features["manufacturer"] and sim.get_manufacturer():
            mfr_inventory = int(sim.get_manufacturer().get_inventory_amount())

        return {
            "phase": self.phase,
            "phase_name": self.config["name"],
            "description": self.config["description"],
            "features": self.config["features"],
            "num_regional_warehouses": num_rw,
            "sim_length": self.config["env_kwargs"]["sim_length"],
            "state": {
                "round": 0,
                "rw_inventories": rw_inventories,
                "cw_inventory": cw_inventory,
                "manufacturer_inventory": mfr_inventory,
                "active_shipments": [],
                "active_cw_shipments": [],
                "total_lost_sales": 0,
                "total_shipments": 0,
                "cumulative_reward": 0,
                "done": False,
                "num_rw": num_rw,
            },
        }

    def get_all_phases_info(self):
        """Return metadata for all 7 phases (for sidebar rendering)."""
        phases = []
        for num, cfg in PHASE_CONFIGS.items():
            phases.append({
                "phase": num,
                "name": cfg["name"],
                "description": cfg["description"],
                "features": cfg["features"],
                "num_regional_warehouses": cfg["env_kwargs"]["number_of_regional_wh"],
            })
        return phases
