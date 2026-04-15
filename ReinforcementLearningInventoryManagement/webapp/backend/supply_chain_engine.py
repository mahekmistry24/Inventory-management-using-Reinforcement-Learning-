"""
Core Engine for AI Supply Chain Command Center.
This wraps the most advanced environment (Phase 7: Demand Forecasting) to simulate
a real-world ERP system integrated with an AI agent.
"""

import sys
import os
import importlib
import types
import numpy as np
from phase_configs import PHASE_CONFIGS

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

def _install_import_shims():
    import gymnasium
    sys.modules["gym"] = gymnasium
    sys.modules["gym.spaces"] = gymnasium.spaces
    for mod in ["stable_baselines", "stable_baselines.common", "stable_baselines.common.policies", "stable_baselines3"]:
        if mod not in sys.modules:
            sys.modules[mod] = types.ModuleType(mod)
    sys.modules["stable_baselines.common.policies"].MlpPolicy = type("MlpPolicy", (), {})
    sys.modules["stable_baselines"].PPO2 = type("PPO2", (), {})
    sys.modules["stable_baselines3"].PPO = type("PPO", (), {})
    sys.modules["stable_baselines3"].DQN = type("DQN", (), {})

_install_import_shims()

class SupplyChainEngine:
    """Wraps the Phase 7 environment as our standalone ERP + AI Brain."""
    
    def __init__(self):
        self.env = None
        self.config = PHASE_CONFIGS[7] # We exclusively use the most advanced simulation
        self.history = []
        self._demand_history = []
        
    def initialize(self):
        phase_folder = os.path.join(REPO_ROOT, self.config["folder"])
        if phase_folder not in sys.path:
            sys.path.insert(0, phase_folder)
            
        modules_to_remove = [k for k in sys.modules if k.startswith("simulation") or k == "rl_environment"]
        for m in modules_to_remove:
            del sys.modules[m]
            
        env_module = importlib.import_module("rl_environment")
        
        kwargs = dict(self.config["env_kwargs"])
        # Give it a larger limit for realism
        kwargs["sim_length"] = 365 # 1 year simulation
        self.env = env_module.Environment(**kwargs)
        self.history = []
        self.env.reset()
        return self.get_erp_state()
        
    def _get_sim_round(self):
        sim = getattr(self.env, "simulation", None)
        if not sim: return 1
        if hasattr(sim, 'get_round'): return sim.get_round()
        return getattr(sim, '_round', 1)

    def get_ai_recommendation(self):
        """
        In a real app, this would query the trained torch model.
        Here we use the heuristic policy to represent the AI's suggestion.
        """
        if not self.env: return []
        sim = self.env.simulation
        rw_limit = self.config["env_kwargs"]["rw_inventory_limit"]
        actions = []
        
        # 0 = No Order, 1 = Small (5), 2 = Large (10)
        for rw_id in sim.get_regional_warehouses():
            inv = sim.get_regional_warehouse_by_id(rw_id).get_inventory_amount()
            if inv < rw_limit * 0.3:
                actions.append(2)
            elif inv < rw_limit * 0.5:
                actions.append(1)
            else:
                actions.append(0)
                
        cw_inv = sim.get_central_warehouse().get_inventory_amount()
        cw_limit = self.config["env_kwargs"]["cw_inventory_limit"]
        actions.append(1 if cw_inv < cw_limit * 0.4 else 0) # 1 = Request from manufacturer
        
        return actions

    def execute_orders(self, action=None):
        """Advances the simulation by 1 day executing the given actions."""
        if self.env is None:
            raise RuntimeError("Engine not initialized.")
            
        if action is None:
            action = self.get_ai_recommendation()
            
        state, reward, done, info = self.env.step(np.array(action))
        
        erp_state = self.get_erp_state(reward=reward, done=done, action_taken=action)
        self.history.append(erp_state)
        return erp_state

    def reset_erp(self):
        if self.env is None:
            raise RuntimeError("Engine not initialized.")
        self.history = []
        self.env.reset()
        return self.get_erp_state()

    def get_erp_state(self, reward=0, done=False, action_taken=None):
        """Returns the current snapshot of the supply chain (ERP view)."""
        sim = getattr(self.env, "simulation", None)
        if not sim: return {}
        
        num_rw = len(sim.get_regional_warehouses())
        rw_inventories = []
        rw_lost_sales = []
        actual_demand = []
        current_round = self._get_sim_round()
        
        for rw_id in sim.get_regional_warehouses():
            rw = sim.get_regional_warehouse_by_id(rw_id)
            customer = rw.get_customer()
            
            rw_inventories.append(int(rw.get_inventory_amount()))
            rw_lost_sales.append(int(rw.get_lost_sales_last_round()))
            
            if hasattr(customer, '_predefined_demand') and customer._predefined_demand:
                idx = max(0, min(current_round - 2, len(customer._predefined_demand) - 1))
                actual_demand.append(int(customer._predefined_demand[idx]))
            else:
                actual_demand.append(int(customer.get_demand_per_step()))
                
        cw_inventory = int(sim.get_central_warehouse().get_inventory_amount())
        mfr_inventory = int(sim.get_manufacturer().get_inventory_amount()) if sim.get_manufacturer() else 0
        
        active_shipments = [{"to_rw": s["regional_warehouse"], "amount": s["amount"], "arrival": s["arrival"]} 
                            for s in sim.get_all_active_shipments()]
                            
        active_cw_shipments = []
        if hasattr(sim, "get_all_active_cw_shipments"):
            active_cw_shipments = [{"amount": s["amount"], "arrival": s["arrival"]} for s in sim.get_all_active_cw_shipments()]

        # Generate Forecast Data simply for UI rendering
        # Phase 7 env uses stochastic sinusoidal curves
        forecasts = []
        state_repr = self.env._get_obs() # Call gym method to get latest observation which contains forecasts
        if isinstance(state_repr, dict) and "forecasts" in state_repr:
            forecasts = state_repr["forecasts"].tolist()

        eval_params = self.env.evaluation_parameters()
        
        return {
            "day": current_round,
            "done": bool(done),
            "kpis": {
                "efficiency_score": round(float(eval_params["total_reward_gained"]) * 100, 2), # Translated reward to score
                "lost_sales": int(eval_params["total_lost_sales"]),
                "total_shipments": int(eval_params["total_shipments"])
            },
            "inventories": {
                "rw": rw_inventories,
                "cw": cw_inventory,
                "mfr": mfr_inventory
            },
            "logistics": {
                "rw_in_transit": active_shipments,
                "cw_in_transit": active_cw_shipments
            },
            "demand": {
                "actual": actual_demand,
                "forecasts": forecasts
            },
            "ai_recommendation": self.get_ai_recommendation(),
            "last_action_taken": action_taken or [0,0,0,0]
        }
