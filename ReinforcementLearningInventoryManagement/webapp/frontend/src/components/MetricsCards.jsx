"use client";

import { TrendingUp, PackageX, Truck, Award } from "lucide-react";

const METRICS = [
  {
    key: "cumulative_reward",
    label: "Cumulative Reward",
    icon: Award,
    color: "text-emerald",
    bgColor: "bg-emerald/10",
    borderColor: "border-emerald/20",
    format: (v) => (v !== undefined ? v.toFixed(2) : "—"),
  },
  {
    key: "total_shipments",
    label: "Total Shipments",
    icon: Truck,
    color: "text-electric",
    bgColor: "bg-electric/10",
    borderColor: "border-electric/20",
    format: (v) => (v !== undefined ? v : "—"),
  },
  {
    key: "total_lost_sales",
    label: "Lost Sales",
    icon: PackageX,
    color: "text-rose",
    bgColor: "bg-rose/10",
    borderColor: "border-rose/20",
    format: (v) => (v !== undefined ? v : "—"),
  },
  {
    key: "reward",
    label: "Step Reward",
    icon: TrendingUp,
    color: "text-amber",
    bgColor: "bg-amber/10",
    borderColor: "border-amber/20",
    format: (v) => (v !== undefined ? v.toFixed(4) : "—"),
  },
];

export default function MetricsCards({ stepData }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {METRICS.map((metric) => {
        const Icon = metric.icon;
        const value = stepData?.[metric.key];
        return (
          <div
            key={metric.key}
            className={`glass-card-sm p-4 border ${metric.borderColor} transition-all duration-300 hover:scale-[1.02]`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">
                {metric.label}
              </span>
              <div className={`w-8 h-8 rounded-lg ${metric.bgColor} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${metric.color}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold font-mono ${metric.color} metric-value`} key={value}>
              {metric.format(value)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
