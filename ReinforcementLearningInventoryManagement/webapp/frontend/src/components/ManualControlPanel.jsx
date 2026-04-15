"use client";

import { Send, Store, Warehouse } from "lucide-react";

export default function ManualControlPanel({ phaseConfig, action, onChange, onSubmit, disabled }) {
  if (!phaseConfig) return null;

  const phase = phaseConfig.phase;
  const numRw = phaseConfig.num_regional_warehouses || 1;
  const hasManufacturer = phaseConfig.features?.manufacturer;
  const hasVariable = phaseConfig.features?.variable_sizing;

  // Handle changing a specific field in the action array/scalar
  const handleChange = (index, value) => {
    if (phase === 1) {
      onChange([value]); // Phase 1 is a single value, but API accepts an array that is converted
    } else {
      const newAction = [...(action || Array(hasManufacturer ? numRw + 1 : numRw).fill(0))];
      newAction[index] = value;
      onChange(newAction);
    }
  };

  const currentAction = action || Array(hasManufacturer ? numRw + 1 : numRw).fill(0);

  return (
    <div className="glass-card-sm p-4 mt-4 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white">Manual Control Mode</h3>
        <button
          onClick={onSubmit}
          disabled={disabled}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-3 h-3" />
          Submit Orders
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Regional Warehouses */}
        {Array.from({ length: numRw }).map((_, i) => (
          <div key={`rw-${i}`} className="flex flex-col gap-2">
            <label className="text-xs text-white/60 flex items-center gap-1.5">
              <Store className="w-3 h-3 text-cyan" />
              RW {i + 1} Order
            </label>
            <select
              value={currentAction[i] || 0}
              onChange={(e) => handleChange(i, parseInt(e.target.value))}
              disabled={disabled}
              className="bg-surface border border-border rounded-lg p-2 text-sm text-white focus:outline-none focus:border-electric"
            >
              <option value={0}>0 — No Order</option>
              {hasVariable ? (
                <>
                  <option value={1}>1 — Small Order (5)</option>
                  <option value={2}>2 — Large Order (10)</option>
                </>
              ) : (
                <option value={1}>1 — Standard Order</option>
              )}
            </select>
          </div>
        ))}

        {/* Central Warehouse */}
        {hasManufacturer && (
          <div className="flex flex-col gap-2 border-l border-border pl-4">
            <label className="text-xs text-white/60 flex items-center gap-1.5">
              <Warehouse className="w-3 h-3 text-electric" />
              Central WH Order
            </label>
            <select
              value={currentAction[numRw] || 0}
              onChange={(e) => handleChange(numRw, parseInt(e.target.value))}
              disabled={disabled}
              className="bg-surface border border-border rounded-lg p-2 text-sm text-white focus:outline-none focus:border-electric"
            >
              <option value={0}>0 — No Request</option>
              <option value={1}>1 — Request Shipment</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
