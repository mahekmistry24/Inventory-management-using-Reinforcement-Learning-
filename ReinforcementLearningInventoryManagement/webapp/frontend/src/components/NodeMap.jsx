"use client";

import { Factory, Warehouse, Store, Truck, Package } from "lucide-react";

function InventoryBar({ current, max, color }) {
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  return (
    <div className="w-full h-2 bg-white/5 rounded-full mt-1.5 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ease-out ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function NodeCard({ icon: Icon, label, inventory, maxInventory, color, bgColor, borderColor, pulse }) {
  return (
    <div
      className={`glass-card-sm p-4 border ${borderColor} flex flex-col items-center min-w-[120px]
        transition-all duration-300 ${pulse ? "pulse-node" : ""}`}
    >
      <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center mb-2`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <span className="text-xs font-semibold text-white/70 mb-1">{label}</span>
      <span className={`text-xl font-bold font-mono ${color}`}>{inventory ?? "—"}</span>
      {maxInventory != null && (
        <InventoryBar current={inventory || 0} max={maxInventory} color={bgColor.replace("/10", "")} />
      )}
    </div>
  );
}

function Arrow({ hasShipment, label }) {
  return (
    <div className="flex flex-col items-center justify-center mx-2">
      <div className="relative">
        <div className={`w-16 h-0.5 ${hasShipment ? "bg-cyan" : "bg-white/10"} transition-colors duration-300`} />
        {hasShipment && (
          <div className="absolute -top-1 left-0 w-3 h-3 text-cyan ship-animate">
            <Package className="w-3 h-3" />
          </div>
        )}
      </div>
      {label && (
        <span className="text-[9px] text-white/30 mt-1">{label}</span>
      )}
    </div>
  );
}

export default function NodeMap({ features, stepData, numRw }) {
  const hasManufacturer = features?.manufacturer;
  const rwInventories = stepData?.rw_inventories || [];
  const cwInventory = stepData?.cw_inventory;
  const mfrInventory = stepData?.manufacturer_inventory;
  const activeShipments = stepData?.active_shipments || [];
  const activeCwShipments = stepData?.active_cw_shipments || [];
  const hasRwShipment = (rwId) => activeShipments.some((s) => s.to_rw === rwId);

  return (
    <div className="glass-card p-6">
      <h3 className="text-xs uppercase tracking-widest text-white/40 font-semibold mb-4">
        Supply Chain Network
      </h3>

      <div className="flex items-center justify-center gap-1 flex-wrap">
        {/* Manufacturer */}
        {hasManufacturer && (
          <>
            <NodeCard
              icon={Factory}
              label="Manufacturer"
              inventory={mfrInventory}
              maxInventory={200}
              color="text-violet"
              bgColor="bg-violet/10"
              borderColor="border-violet/20"
              pulse={activeCwShipments.length > 0}
            />
            <Arrow
              hasShipment={activeCwShipments.length > 0}
              label={activeCwShipments.length > 0 ? `${activeCwShipments.length} in transit` : null}
            />
          </>
        )}

        {/* Central Warehouse */}
        <NodeCard
          icon={Warehouse}
          label="Central WH"
          inventory={cwInventory}
          maxInventory={100}
          color="text-electric"
          bgColor="bg-electric/10"
          borderColor="border-electric/20"
          pulse={activeShipments.length > 0}
        />

        {/* Arrows + Regional Warehouses */}
        <div className="flex flex-col gap-3 ml-2">
          {Array.from({ length: numRw || 1 }, (_, i) => (
            <div key={i} className="flex items-center">
              <Arrow
                hasShipment={hasRwShipment(i + 1)}
                label={hasRwShipment(i + 1) ? "shipping" : null}
              />
              <NodeCard
                icon={Store}
                label={`RW ${i + 1}`}
                inventory={rwInventories[i]}
                maxInventory={49}
                color="text-cyan"
                bgColor="bg-cyan/10"
                borderColor="border-cyan/20"
                pulse={false}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
