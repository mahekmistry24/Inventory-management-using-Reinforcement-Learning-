"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import ControlBar from "@/components/ControlBar";
import ManualControlPanel from "@/components/ManualControlPanel";
import MetricsCards from "@/components/MetricsCards";
import NodeMap from "@/components/NodeMap";
import InventoryChart from "@/components/InventoryChart";
import ForecastChart from "@/components/ForecastChart";
import { initPhase, stepSimulation, resetSimulation, getPhaseInfo } from "@/lib/api";
import { AlertTriangle } from "lucide-react";

const MAX_HISTORY = 500;

export default function Dashboard() {
  // Phase info from backend
  const [phases, setPhases] = useState([]);
  const [activePhase, setActivePhase] = useState(null);
  const [phaseConfig, setPhaseConfig] = useState(null);

  // Simulation state
  const [stepData, setStepData] = useState(null);
  const [history, setHistory] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Manual control state
  const [isManual, setIsManual] = useState(false);
  const [manualAction, setManualAction] = useState(null);

  const intervalRef = useRef(null);

  // Load phase info on mount
  useEffect(() => {
    getPhaseInfo()
      .then((data) => setPhases(data.phases || []))
      .catch((e) => setError(`Failed to connect to backend: ${e.message}. Make sure the FastAPI server is running on port 8000.`));
  }, []);

  // Select a phase
  const handleSelectPhase = useCallback(
    async (phaseNum) => {
      if (loading) return;
      // Stop any running simulation
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsRunning(false);
      setLoading(true);
      setError(null);

      try {
        const result = await initPhase(phaseNum);
        setActivePhase(phaseNum);
        setPhaseConfig(result);
        setStepData(result.state);
        setHistory([]);
        setManualAction(null); // Reset manual actions
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [loading]
  );

  // Step simulation
  const handleStep = useCallback(async (action = null) => {
    if (stepData?.done) return;
    setError(null);
    try {
      const result = await stepSimulation(action);
      setStepData(result);
      setHistory((prev) => {
        const next = [...prev, result];
        return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
      });
      return result;
    } catch (e) {
      setError(e.message);
      return null;
    }
  }, [stepData]);

  // Auto-run
  const handleStart = useCallback(() => {
    if (stepData?.done || isRunning) return;
    setIsRunning(true);

    const runStep = async () => {
      try {
        const result = await stepSimulation();
        setStepData(result);
        setHistory((prev) => {
          const next = [...prev, result];
          return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
        });
        if (result.done) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setIsRunning(false);
        }
      } catch (e) {
        setError(e.message);
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setIsRunning(false);
      }
    };

    intervalRef.current = setInterval(runStep, 250);
  }, [stepData, isRunning]);

  // Pause
  const handlePause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  // Reset
  const handleReset = useCallback(async () => {
    handlePause();
    setLoading(true);
    setError(null);
    try {
      const result = await resetSimulation();
      setPhaseConfig(result);
      setStepData(result.state);
      setHistory([]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [handlePause]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const showForecasts = phaseConfig?.features?.forecasting;

  return (
    <div className="flex min-h-screen">
      <Sidebar
        phases={phases}
        activePhase={activePhase}
        onSelectPhase={handleSelectPhase}
        loading={loading}
      />

      <main className="flex-1 p-6 overflow-y-auto grid-bg">
        <div className="max-w-[1400px] mx-auto space-y-5">
          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-rose/10 border border-rose/20">
              <AlertTriangle className="w-5 h-5 text-rose flex-shrink-0" />
              <p className="text-sm text-rose">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-rose/60 hover:text-rose text-xs"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Control Bar */}
          <ControlBar
            isRunning={isRunning}
            onStart={handleStart}
            onPause={handlePause}
            onStep={() => handleStep()}
            onReset={handleReset}
            done={stepData?.done || false}
            currentRound={stepData?.round || 0}
            simLength={phaseConfig?.sim_length || 100}
            phaseName={phaseConfig?.phase_name}
            loading={loading}
            isManual={isManual}
            onToggleManual={() => setIsManual(!isManual)}
          />

          {/* Manual Control Panel */}
          {isManual && activePhase && (
            <ManualControlPanel
              phaseConfig={phaseConfig}
              action={manualAction}
              onChange={setManualAction}
              onSubmit={() => handleStep(manualAction)}
              disabled={stepData?.done || loading}
            />
          )}

          {/* Phase Description */}
          {phaseConfig && (
            <div className="glass-card-sm px-5 py-3 flex items-center gap-3 flex-wrap">
              <div className="flex gap-2">
                {Object.entries(phaseConfig.features || {}).map(([key, val]) =>
                  val ? (
                    <span
                      key={key}
                      className="px-2 py-0.5 rounded-full bg-electric/10 text-electric text-[10px] font-bold uppercase"
                    >
                      {key.replace(/_/g, " ")}
                    </span>
                  ) : null
                )}
              </div>
              <p className="text-xs text-white/40 flex-1">{phaseConfig.description}</p>
            </div>
          )}

          {/* Metrics */}
          <MetricsCards stepData={stepData} />

          {/* Node Map */}
          <NodeMap
            features={phaseConfig?.features}
            stepData={stepData}
            numRw={phaseConfig?.num_regional_warehouses || 1}
          />

          {/* Charts */}
          <div className={showForecasts ? "grid grid-cols-1 xl:grid-cols-2 gap-5" : ""}>
            <InventoryChart
              history={history}
              numRw={phaseConfig?.num_regional_warehouses || 1}
              showCw={phaseConfig?.features?.manufacturer}
            />
            {showForecasts && (
              <ForecastChart
                history={history}
                numRw={phaseConfig?.num_regional_warehouses || 1}
              />
            )}
          </div>

          {/* Welcome State */}
          {!activePhase && (
            <div className="glass-card p-12 text-center">
              <h2 className="text-2xl font-bold gradient-text mb-3">
                Welcome to the RL Inventory Control Tower
              </h2>
              <p className="text-white/40 max-w-lg mx-auto text-sm leading-relaxed">
                Select a project phase from the sidebar to load the simulation environment.
                Then use the control bar to step through or auto-run the simulation and watch
                the supply chain dynamics unfold in real time.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
