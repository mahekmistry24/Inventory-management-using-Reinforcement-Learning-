import sys
sys.path.insert(0, "webapp/backend")
from phase_adapter import PhaseAdapter

a = PhaseAdapter()
for p in range(1, 8):
    try:
        r = a.load_phase(p)
        s = a.step()
        print(f"Phase {p}: {r['phase_name']} | Step OK | inv={s['rw_inventories']} reward={s['reward']}")
    except Exception as e:
        print(f"Phase {p}: FAILED — {e}")
print("\nAll phases tested!")
