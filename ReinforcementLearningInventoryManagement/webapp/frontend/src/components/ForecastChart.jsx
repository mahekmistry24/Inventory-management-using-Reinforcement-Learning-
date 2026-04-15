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
} from "recharts";

const RW_ACTUAL_COLORS = ["#f43f5e", "#f59e0b", "#8b5cf6"];
const RW_FORECAST_COLORS = ["#06b6d4", "#3b82f6", "#10b981"];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p className="text-xs font-semibold text-white/60 mb-1">Day {label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs font-mono" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === "number" ? entry.value.toFixed(1) : entry.value}
        </p>
      ))}
    </div>
  );
}

export default function ForecastChart({ history, numRw }) {
  // Build chart data — only include steps where we have forecast data
  const chartData = history
    .filter((step) => step.actual_demand)
    .map((step, idx) => {
      const point = { day: step.round || idx + 1 };
      (step.actual_demand || []).forEach((d, i) => {
        point[`Actual RW${i + 1}`] = d;
      });
      // Show first forecast value for each RW (next-step forecast)
      if (step.forecasts) {
        step.forecasts.forEach((rwForecasts, i) => {
          if (Array.isArray(rwForecasts) && rwForecasts.length > 0) {
            point[`Forecast RW${i + 1}`] = Math.round(rwForecasts[0] * 10) / 10;
          }
        });
      }
      return point;
    });

  if (chartData.length === 0) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-xs uppercase tracking-widest text-white/40 font-semibold">
            Demand Forecast vs Actual
          </h3>
          <span className="px-2 py-0.5 rounded-full bg-emerald/20 text-emerald text-[10px] font-bold">
            PHASE 7
          </span>
        </div>
        <div className="h-56 flex items-center justify-center text-white/20 text-sm">
          Forecast data will appear when simulation runs
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-xs uppercase tracking-widest text-white/40 font-semibold">
          Demand Forecast vs Actual
        </h3>
        <span className="px-2 py-0.5 rounded-full bg-emerald/20 text-emerald text-[10px] font-bold">
          PHASE 7
        </span>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="day"
            stroke="rgba(255,255,255,0.2)"
            tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
          />
          <YAxis
            stroke="rgba(255,255,255,0.2)"
            tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
            label={{ value: "Demand", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "rgba(255,255,255,0.3)" } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }} />
          {Array.from({ length: numRw }, (_, i) => [
            <Line
              key={`actual-${i}`}
              type="monotone"
              dataKey={`Actual RW${i + 1}`}
              stroke={RW_ACTUAL_COLORS[i % RW_ACTUAL_COLORS.length]}
              strokeWidth={2}
              dot={false}
              animationDuration={300}
            />,
            <Line
              key={`forecast-${i}`}
              type="monotone"
              dataKey={`Forecast RW${i + 1}`}
              stroke={RW_FORECAST_COLORS[i % RW_FORECAST_COLORS.length]}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              animationDuration={300}
            />,
          ])}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
