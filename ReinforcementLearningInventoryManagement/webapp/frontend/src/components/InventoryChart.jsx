"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

const RW_COLORS = ["#06b6d4", "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981"];
const CW_COLOR = "#f59e0b";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p className="text-xs font-semibold text-white/60 mb-1">Day {label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs font-mono" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

export default function InventoryChart({ history, numRw, showCw }) {
  // Build chart data from history
  const chartData = history.map((step, idx) => {
    const point = { day: step.round || idx + 1 };
    (step.rw_inventories || []).forEach((inv, i) => {
      point[`RW ${i + 1}`] = inv;
    });
    if (showCw && step.cw_inventory != null) {
      point["Central WH"] = step.cw_inventory;
    }
    return point;
  });

  if (chartData.length === 0) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-xs uppercase tracking-widest text-white/40 font-semibold mb-4">
          Inventory Levels
        </h3>
        <div className="h-64 flex items-center justify-center text-white/20 text-sm">
          Run the simulation to see inventory data
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <h3 className="text-xs uppercase tracking-widest text-white/40 font-semibold mb-4">
        Inventory Levels Over Time
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData}>
          <defs>
            {Array.from({ length: numRw }, (_, i) => (
              <linearGradient key={i} id={`rw-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={RW_COLORS[i % RW_COLORS.length]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={RW_COLORS[i % RW_COLORS.length]} stopOpacity={0} />
              </linearGradient>
            ))}
            {showCw && (
              <linearGradient id="cw-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CW_COLOR} stopOpacity={0.2} />
                <stop offset="95%" stopColor={CW_COLOR} stopOpacity={0} />
              </linearGradient>
            )}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="day"
            stroke="rgba(255,255,255,0.2)"
            tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
            label={{ value: "Day", position: "insideBottomRight", offset: -5, style: { fontSize: 10, fill: "rgba(255,255,255,0.3)" } }}
          />
          <YAxis
            stroke="rgba(255,255,255,0.2)"
            tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
            label={{ value: "Stock", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "rgba(255,255,255,0.3)" } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}
          />
          {Array.from({ length: numRw }, (_, i) => (
            <Area
              key={i}
              type="monotone"
              dataKey={`RW ${i + 1}`}
              stroke={RW_COLORS[i % RW_COLORS.length]}
              strokeWidth={2}
              fill={`url(#rw-grad-${i})`}
              dot={false}
              animationDuration={300}
            />
          ))}
          {showCw && (
            <Area
              type="monotone"
              dataKey="Central WH"
              stroke={CW_COLOR}
              strokeWidth={2}
              strokeDasharray="5 5"
              fill="url(#cw-grad)"
              dot={false}
              animationDuration={300}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
