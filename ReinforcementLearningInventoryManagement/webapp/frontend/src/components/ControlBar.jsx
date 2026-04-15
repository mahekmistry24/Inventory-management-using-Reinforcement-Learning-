"use client";

import { Play, Pause, SkipForward, RotateCcw, Zap } from "lucide-react";

export default function ControlBar({
  isRunning,
  onStart,
  onPause,
  onStep,
  onReset,
  done,
  currentRound,
  simLength,
  phaseName,
  loading,
  isManual,
  onToggleManual,
}) {
  const progress = simLength > 0 ? (currentRound / simLength) * 100 : 0;

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Phase Info */}
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber" />
              {phaseName || "Select a Phase"}
            </h2>
            <p className="text-xs text-white/40 mt-0.5">
              Day {currentRound} / {simLength}
              {done && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald/20 text-emerald text-[10px] font-bold">
                  COMPLETE
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {!isRunning ? (
            <button
              onClick={onStart}
              disabled={done || loading || !phaseName}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-electric to-cyan
                         text-white font-semibold text-sm
                         hover:shadow-lg hover:shadow-electric/30 transition-all duration-300
                         disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none"
            >
              <Play className="w-4 h-4" fill="currentColor" />
              Auto-Run
            </button>
          ) : (
            <button
              onClick={onPause}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber/20 border border-amber/30
                         text-amber font-semibold text-sm
                         hover:bg-amber/30 transition-all duration-300"
            >
              <Pause className="w-4 h-4" fill="currentColor" />
              Pause
            </button>
          )}

          {!isManual && (
            <button
              onClick={onStep}
              disabled={done || isRunning || loading || !phaseName}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                         bg-surface border border-border-bright text-white/70 text-sm font-medium
                         hover:bg-surface-hover hover:text-white transition-all duration-200
                         disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <SkipForward className="w-4 h-4" />
              Step
            </button>
          )}

          <button
            onClick={onReset}
            disabled={loading || !phaseName}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                       bg-surface border border-border-bright text-white/70 text-sm font-medium
                       hover:bg-rose/10 hover:text-rose hover:border-rose/30 transition-all duration-200
                       disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>

          <div className="w-px h-8 bg-border mx-2"></div>

          <button
            onClick={onToggleManual}
            disabled={isRunning || loading || !phaseName}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
              isManual 
                ? "bg-violet-500/20 text-violet-400 border-violet-500/40 hover:bg-violet-500/30" 
                : "bg-surface border-border-bright text-white/70 hover:bg-surface-hover hover:text-white"
            } disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            <Zap className={`w-4 h-4 ${isManual ? "text-violet-400" : ""}`} />
            {isManual ? "Manual" : "Auto Mode"}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3 h-1.5 bg-navy-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${
            done
              ? "bg-gradient-to-r from-emerald to-cyan"
              : "bg-gradient-to-r from-electric to-cyan"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
