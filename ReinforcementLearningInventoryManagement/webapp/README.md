# 🚀 DRL Inventory Management — Web Application

A full-stack web application for visualizing and interacting with **7 evolutionary phases** of Deep Reinforcement Learning (DRL) applied to supply chain inventory management.

| Layer    | Technology         | Port  |
|----------|--------------------|-------|
| Backend  | FastAPI + Uvicorn  | 8000  |
| Frontend | Next.js (React)    | 3000  |

---

## 📋 Prerequisites

| Requirement | Version       |
|-------------|---------------|
| Python      | 3.9 or higher |
| Node.js     | 18 or higher  |
| npm         | 9 or higher   |

> Make sure `python`, `pip`, `node`, and `npm` are available in your system PATH.

---

## 🛠️ How to Run (Step-by-Step in VS Code)

You need **two terminals** open side-by-side in VS Code.  
*(Tip: Click the `+` icon in VS Code's terminal panel, or use `Ctrl + Shift + `` to open a new terminal.)*

---

### 🔷 Terminal 1 — Start the Backend (FastAPI)

Open a **new terminal** in VS Code and run these commands **one by one**:

```bash
# Step 1: Navigate to the project root
cd d:\RL-PROJECT\ReinforcementLearningInventoryManagement

# Step 2: Activate the Python virtual environment
.\venv\Scripts\activate

# Step 3: Install backend dependencies (only needed once, or after updates)
pip install -r webapp\backend\requirements.txt

# Step 4: Navigate into the backend folder
cd webapp\backend

# Step 5: Start the FastAPI server
python main.py
```

✅ **Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Started reloader process ...
```

> **Verify:** Open [http://localhost:8000/docs](http://localhost:8000/docs) in your browser — you should see the Swagger API documentation with all endpoints.

---

### 🟢 Terminal 2 — Start the Frontend (Next.js)

Open a **second terminal** in VS Code and run these commands **one by one**:

```bash
# Step 6: Navigate to the frontend folder
cd d:\RL-PROJECT\ReinforcementLearningInventoryManagement\webapp\frontend

# Step 7: Install frontend dependencies (only needed once, or after updates)
npm install

# Step 8: Start the Next.js development server
npm run dev
```

✅ **Expected output:**
```
  ▲ Next.js 16.x.x
  - Local:   http://localhost:3000
  ✓ Ready
```

> **Verify:** Open [http://localhost:3000](http://localhost:3000) in your browser — you should see the DRL Inventory Management Dashboard.

---

## 🎮 Using the Dashboard

1. Open **http://localhost:3000** in your browser.
2. Select any of the **7 phases** from the sidebar/dashboard controls.
3. Click **Initialize** to load the selected phase's simulation environment.
4. Use **Step** to advance the simulation one tick at a time, or **Run** for continuous simulation.
5. Observe real-time metrics, supply chain node maps, and inventory charts updating live.

---

## 📡 API Endpoints (Backend)

| Method | Endpoint            | Description                          |
|--------|---------------------|--------------------------------------|
| GET    | `/api/phase_info`   | Returns metadata for all 7 phases    |
| POST   | `/api/init_phase`   | Initialize a specific phase (1–7)    |
| POST   | `/api/step`         | Advance simulation by one step       |
| POST   | `/api/reset`        | Reset the current phase environment  |
| GET    | `/api/history`      | Get full step history for episode    |

> Interactive API docs available at **http://localhost:8000/docs**

---

## 🧩 The 7 Phases

| Phase | Name                                    | Description                                         |
|-------|-----------------------------------------|-----------------------------------------------------|
| 1     | MVP                                     | Basic single-warehouse inventory management         |
| 2     | Multiple Warehouses                     | Expanded to multi-warehouse environments            |
| 3     | Production Plant                        | Added production plant nodes to supply chain         |
| 4     | Variable Ordering Size                  | Dynamic order quantities with variable sizing        |
| 5     | Stochastic Params & Prioritisation      | Stochastic demand/lead-times with priority logic     |
| 6     | Observation Space Testing               | Experimentation with different observation spaces    |
| 7     | Demand Forecasting                      | Integrated demand forecasting into the RL agent      |

---

## 🛑 Stopping the Servers

- In each terminal, press **`Ctrl + C`** to stop the running server.
- To deactivate the Python virtual environment, type `deactivate` in Terminal 1.

---

## 🐛 Troubleshooting

| Issue                              | Solution                                                                 |
|------------------------------------|--------------------------------------------------------------------------|
| `venv\Scripts\activate` fails      | Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` in PowerShell  |
| Port 8000 already in use           | Kill the process: `netstat -ano \| findstr :8000` then `taskkill /PID <PID> /F` |
| Port 3000 already in use           | Kill the process: `netstat -ano \| findstr :3000` then `taskkill /PID <PID> /F` |
| `ModuleNotFoundError` in backend   | Make sure venv is activated and `pip install -r requirements.txt` was run |
| Frontend shows connection error    | Ensure the backend is running first on port 8000                         |
| `npm install` fails                | Delete `node_modules` folder and `package-lock.json`, then run `npm install` again |

---

## 📁 Project Structure

```
webapp/
├── backend/
│   ├── main.py                 # FastAPI entry point (run this to start backend)
│   ├── phase_adapter.py        # Adapter bridging 7 phase environments
│   ├── phase_configs.py        # Configuration for each phase
│   ├── supply_chain_engine.py  # Core supply chain simulation logic
│   ├── requirements.txt        # Python dependencies
│   └── test_phases.py          # Phase unit tests
│
└── frontend/
    ├── src/
    │   ├── app/                # Next.js app router pages
    │   └── components/         # React components (NodeMap, MetricsCards, etc.)
    ├── package.json            # Node.js dependencies & scripts
    └── next.config.mjs         # Next.js configuration
```
