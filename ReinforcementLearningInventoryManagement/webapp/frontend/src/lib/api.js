const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function initPhase(phase) {
  const res = await fetch(`${API_BASE}/api/init_phase`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phase }),
  });
  if (!res.ok) throw new Error(`Failed to init phase ${phase}`);
  return res.json();
}

export async function stepSimulation(action = null) {
  const res = await fetch(`${API_BASE}/api/step`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) throw new Error("Step failed");
  return res.json();
}

export async function resetSimulation() {
  const res = await fetch(`${API_BASE}/api/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Reset failed");
  return res.json();
}

export async function getPhaseInfo() {
  const res = await fetch(`${API_BASE}/api/phase_info`);
  if (!res.ok) throw new Error("Failed to get phase info");
  return res.json();
}
