"use client";

import {
  Factory,
  Warehouse,
  Package,
  BarChart3,
  TrendingUp,
  Shuffle,
  Eye,
  BrainCircuit,
  ChevronRight,
} from "lucide-react";

const PHASE_ICONS = {
  1: Package,
  2: Shuffle,
  3: Factory,
  4: BarChart3,
  5: TrendingUp,
  6: Eye,
  7: BrainCircuit,
};

const PHASE_META = {
  1: { label: "MVP", color: "from-blue-500 to-blue-600" },
  2: { label: "Multi-RW", color: "from-indigo-500 to-indigo-600" },
  3: { label: "Manufacturer", color: "from-violet-500 to-violet-600" },
  4: { label: "Variable Size", color: "from-purple-500 to-purple-600" },
  5: { label: "Stochastic", color: "from-amber-500 to-amber-600" },
  6: { label: "Obs. Space", color: "from-cyan-500 to-cyan-600" },
  7: { label: "Forecasting", color: "from-emerald-500 to-emerald-600" },
};

export default function Sidebar({ phases, activePhase, onSelectPhase, loading }) {
  return (
    <aside className="w-72 min-h-screen bg-navy-900/80 backdrop-blur-xl border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-electric to-cyan flex items-center justify-center">
            <Warehouse className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">RL Inventory</h1>
            <p className="text-xs text-white/40 font-medium">Control Tower</p>
          </div>
        </div>
      </div>

      {/* Phase List */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <p className="text-[10px] uppercase tracking-widest text-white/30 font-semibold px-3 mb-3">
          Project Phases
        </p>
        {(phases || []).map((phase) => {
          const Icon = PHASE_ICONS[phase.phase] || Package;
          const meta = PHASE_META[phase.phase] || PHASE_META[1];
          const isActive = activePhase === phase.phase;

          return (
            <button
              key={phase.phase}
              onClick={() => onSelectPhase(phase.phase)}
              disabled={loading}
              className={`
                w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left
                transition-all duration-300 group relative
                ${
                  isActive
                    ? "sidebar-glow bg-electric/10 border border-electric/40"
                    : "border border-transparent hover:bg-surface-hover hover:border-border-bright"
                }
                ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              <div
                className={`
                  w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
                  bg-gradient-to-br ${meta.color}
                  ${isActive ? "shadow-lg shadow-electric/20" : "opacity-70 group-hover:opacity-100"}
                  transition-all duration-300
                `}
              >
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md
                      ${isActive ? "bg-electric/20 text-electric" : "bg-white/5 text-white/40"}
                    `}
                  >
                    {phase.phase}
                  </span>
                  <span
                    className={`text-sm font-medium truncate
                      ${isActive ? "text-white" : "text-white/60 group-hover:text-white/80"}
                    `}
                  >
                    {meta.label}
                  </span>
                </div>
                <p className="text-[10px] text-white/30 mt-0.5 truncate">
                  {phase.num_regional_warehouses} RW
                  {phase.features.manufacturer ? " · MFR" : ""}
                  {phase.features.forecasting ? " · Forecast" : ""}
                </p>
              </div>
              {isActive && (
                <ChevronRight className="w-4 h-4 text-electric flex-shrink-0" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="glass-card-sm p-3">
          <p className="text-[10px] text-white/40 leading-relaxed">
            DRL Inventory Management — Bachelor's Thesis Project.
            Built with FastAPI + Next.js
          </p>
        </div>
      </div>
    </aside>
  );
}
