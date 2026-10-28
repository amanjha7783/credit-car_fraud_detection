import re
import numpy as np
import pandas as pd

REQUIRED = ["IP Address", "User ID", "Account Number", "Age", "Shipping Address", "Transaction Date",
            "Transaction Time", "Transaction Value", "Product Category", "Units Purchased"]
FMTS = ["%Y-%m-%d", "%d-%m-%y", "%d-%m-%Y", "%d %B %Y", "%d %b %Y"]


def parse_date(s):
    """Return (date, status). Numeric day-first dates with day<=12 are 'ambiguous' (could be month-first)."""
    if not isinstance(s, str) or s.strip() == "":
        return None, "missing"
    s = str(s).strip()
    for f in FMTS:
        try:
            d = pd.to_datetime(s, format=f)
        except Exception:
            continue
        return d.normalize(), ("ambiguous" if f in ("%d-%m-%y", "%d-%m-%Y") and d.day <= 12 else "ok")
    return None, "invalid"


def validate_columns(df):
    have = [c.strip() for c in df.columns]
    return [c for c in REQUIRED if c not in have]


def _blank_to_none(x):
    return None if not isinstance(x, str) or x.strip() == "" else x.strip()


def clean(raw):
    df = raw.copy()
    df.columns = [c.strip() for c in df.columns]
    df = df.astype(object).apply(lambda col: col.map(_blank_to_none))
    n0 = len(df)
    q = {"missing_value": int(df["Transaction Value"].isna().sum()), "missing_ip": int(df["IP Address"].isna().sum()),
         "missing_user": int(df["User ID"].isna().sum()), "missing_age": int(df["Age"].isna().sum()),
         "missing_address": int(df["Shipping Address"].isna().sum())}
    val = pd.to_numeric(df["Transaction Value"].map(lambda s: re.sub(r"[$,\s]", "", s) if isinstance(s, str) else s), errors="coerce")
    q["invalid_amount"] = int(((val <= 0) | (df["Transaction Value"].notna() & val.isna())).sum())
    val = val.where(val > 0)
    units = pd.to_numeric(df["Units Purchased"], errors="coerce")
    q["invalid_units"] = int((units.isna() | (units <= 0)).sum())
    units = units.where(units > 0)
    parsed = df["Transaction Date"].map(parse_date)
    date = pd.to_datetime(parsed.map(lambda x: x[0]))
    status = parsed.map(lambda x: x[1])
    q["ambiguous_dates"] = int((status == "ambiguous").sum())
    q["invalid_dates"] = int(status.isin(["invalid", "missing"]).sum())
    q["date_formats_used"] = int(df["Transaction Date"].dropna().map(
        lambda s: re.sub(r"[A-Za-z]+", "A", re.sub(r"\d+", "9", s))).nunique())
    t = pd.to_datetime(df["Transaction Time"], format="%H:%M:%S", errors="coerce")
    t = t.fillna(pd.to_datetime(df["Transaction Time"], format="%H:%M", errors="coerce"))
    q["invalid_times"] = int(t.isna().sum())
    secs = t.dt.hour * 3600 + t.dt.minute * 60 + t.dt.second
    ts = date + pd.to_timedelta(secs, unit="s")
    out = pd.DataFrame({
        "user": df["User ID"],
        "account": df["Account Number"].map(lambda a: "****" + a[-4:] if isinstance(a, str) else None),
        "ip": df["IP Address"], "age": pd.to_numeric(df["Age"], errors="coerce"),
        "address": df["Shipping Address"], "ts": ts, "value": val, "category": df["Product Category"],
        "units": units, "date_status": status})
    bad = out["user"].isna() | out["ts"].isna()
    rejected = [{"row": int(i) + 2, "reason": "missing user ID" if pd.isna(out.at[i, "user"]) else "invalid or missing date/time"}
                for i in out.index[bad]]
    out = out[~bad]
    dup = out.duplicated(subset=["user", "ts", "value", "address", "units"], keep="first")
    q["duplicates"] = int(dup.sum())
    out = out[~dup].sort_values(["user", "ts"]).reset_index(drop=True)
    out.insert(0, "txn_id", ["TXN-%04d" % (i + 1) for i in range(len(out))])
    rep = {"rows_uploaded": n0, "rows_rejected": len(rejected), "rejected": rejected, "duplicates_removed": q["duplicates"],
           "rows_clean": len(out), "issues": q,
           "notes": ["Missing values are kept empty and never invented.",
                     "Numeric dates such as 3-6-20 are read day-first and flagged 'ambiguous'; ISO and named-month dates are unambiguous."]}
    return out, rep
