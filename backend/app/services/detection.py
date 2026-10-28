import numpy as np
import pandas as pd

DEFAULTS = {"value_multiplier": 5.0, "rapid_minutes": 10, "bulk_multiplier": 3.0, "bulk_min_units": 5, "min_history": 1}
SPECIAL = ("in-store", "p.o. box", "po box")


def detect(df, cfg=None):
    """Rule-based detection. A customer's 'normal' history only contains earlier transactions that raised no flag."""
    cfg = {**DEFAULTS, **(cfg or {})}
    res = {}
    for _, g in df.groupby("user"):
        hist, prev_ts = [], None
        for r in g.sort_values("ts").itertuples():
            rs, n = [], len(hist)
            h = pd.DataFrame(hist, columns=["value", "address", "ip", "units"])
            if n >= cfg["min_history"]:
                if pd.notna(r.value) and h["value"].notna().any():
                    base = h["value"].mean()
                    if r.value > cfg["value_multiplier"] * base:
                        rs.append(["High amount", f"Value ${r.value:,.2f} is {r.value / base:.0f}x the usual average ${base:,.2f} (threshold {cfg['value_multiplier']}x)."])
                if pd.notna(r.address) and h["address"].notna().any() and r.address not in set(h["address"].dropna()):
                    kind = " (in-store / P.O. Box)" if any(s in str(r.address).lower() for s in SPECIAL) else ""
                    rs.append(["Address change", f"Shipping address '{r.address}'{kind} is not in the customer's usual history."])
                if pd.notna(r.ip) and h["ip"].notna().any() and r.ip not in set(h["ip"].dropna()):
                    rs.append(["Unusual IP", f"IP {r.ip} differs from usual IPs {sorted(set(h['ip'].dropna()))}. Geographic location is not inferred."])
                if pd.notna(r.units) and h["units"].notna().any():
                    ub = h["units"].mean()
                    if r.units >= cfg["bulk_min_units"] and r.units > cfg["bulk_multiplier"] * ub:
                        rs.append(["Bulk purchase", f"{int(r.units)} units vs usual average {ub:.1f} (threshold {cfg['bulk_multiplier']}x and at least {cfg['bulk_min_units']} units)."])
            if prev_ts is not None:
                gap = (r.ts - prev_ts).total_seconds() / 60
                if gap <= cfg["rapid_minutes"]:
                    rs.append(["Rapid transactions", f"Only {gap:.0f} min after the customer's previous transaction (window {cfg['rapid_minutes']} min)."])
            prev_ts = r.ts
            if not rs:
                hist.append({"value": r.value, "address": r.address, "ip": r.ip, "units": r.units})
            k = len(rs)
            risk = "None" if k == 0 else "Low" if k == 1 else "Medium" if k == 2 else "High"
            if k >= 2:
                rs.append(["Multiple signals", f"{k} independent rules triggered together, so review priority is raised."])
            res[r.txn_id] = (risk, rs, n)
    out = df.copy()
    out["risk"] = out.txn_id.map(lambda i: res[i][0])
    out["reasons"] = out.txn_id.map(lambda i: res[i][1])
    out["history_size"] = out.txn_id.map(lambda i: res[i][2])
    out["flagged"] = out.risk != "None"
    out["next_step"] = out.risk.map({"None": "", "Low": "Optional check against the customer's usual behaviour.",
                                     "Medium": "Verify with the customer or review manually.",
                                     "High": "Priority manual review and customer verification. This is a signal, not confirmed fraud."})
    return out, cfg
