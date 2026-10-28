import io
import json
import pathlib

import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from .services.cleaning import REQUIRED, clean, validate_columns
from .services.detection import DEFAULTS, detect

ROOT = pathlib.Path(__file__).resolve().parents[2]
DATA = ROOT / "backend" / "data"
SAMPLE = ROOT / "sample_data" / "sample_transactions.csv"
MAX_BYTES = 5 * 1024 * 1024

app = FastAPI(title="Credit Card Fraud Detection API")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
                   allow_methods=["*"], allow_headers=["*"])
S = {"clean": None, "report": None, "result": None, "cfg": dict(DEFAULTS), "source": None}


def js(df):
    return json.loads(df.to_json(orient="records", date_format="iso"))


def load(raw, source):
    missing = validate_columns(raw)
    if missing:
        raise HTTPException(400, f"Missing required columns: {', '.join(missing)}. Expected: {', '.join(REQUIRED)}")
    if raw.empty:
        raise HTTPException(400, "The file has no data rows.")
    S["clean"], S["report"] = clean(raw)
    if S["clean"].empty:
        raise HTTPException(400, "No usable rows after cleaning. Check user IDs and dates.")
    S["source"] = source
    run_analysis()


def run_analysis(cfg=None):
    if S["clean"] is None:
        raise HTTPException(400, "No dataset loaded. Upload a CSV first.")
    S["result"], S["cfg"] = detect(S["clean"], {**S["cfg"], **(cfg or {})})


def need():
    if S["result"] is None:
        raise HTTPException(404, "No dataset loaded. Upload a CSV or use the sample.")
    return S["result"]


@app.on_event("startup")
def startup():
    DATA.mkdir(exist_ok=True)
    if SAMPLE.exists():
        load(pd.read_csv(SAMPLE, dtype=str), "sample_transactions.csv")


@app.get("/api/health")
def health():
    return {"status": "ok", "dataset_loaded": S["result"] is not None, "source": S["source"]}


@app.get("/api/sample")
def sample():
    return FileResponse(SAMPLE, filename="sample_transactions.csv")


@app.post("/api/upload")
async def upload(file: UploadFile = File(...)):
    if not (file.filename or "").lower().endswith(".csv"):
        raise HTTPException(400, "Only .csv files are accepted.")
    body = await file.read()
    if len(body) > MAX_BYTES:
        raise HTTPException(413, "File is larger than 5 MB.")
    try:
        raw = pd.read_csv(io.BytesIO(body), dtype=str)
    except Exception:
        raise HTTPException(400, "Could not read the file as CSV.")
    DATA.mkdir(exist_ok=True)
    (DATA / "original_upload.csv").write_bytes(body)  # original preserved untouched
    load(raw, file.filename)
    S["result"].drop(columns=["reasons"]).to_csv(DATA / "cleaned_dataset.csv", index=False)
    return {"filename": file.filename, "columns": list(raw.columns), "preview": js(raw.head(10)), "report": S["report"]}


@app.post("/api/analyze")
def analyze(cfg: dict = None):
    run_analysis(cfg)
    return {"config": S["cfg"], "flagged": int(S["result"].flagged.sum())}


@app.get("/api/transactions")
def transactions():
    return {"config": S["cfg"], "items": js(need().drop(columns=["date_status"]))}


@app.get("/api/alerts")
def alerts():
    d = need()
    d = d[d.flagged].copy()
    d["_o"] = d.risk.map({"High": 0, "Medium": 1, "Low": 2})
    return {"items": js(d.sort_values(["_o", "ts"]).drop(columns="_o"))}


@app.get("/api/data-quality")
def data_quality():
    need()
    return S["report"]


@app.get("/api/summary")
def summary():
    d = need()
    f = d[d.flagged]
    cnt = lambda s: [{"name": str(k), "value": float(v)} for k, v in s.items()]
    reasons = pd.Series([r[0] for rs in f.reasons for r in rs if r[0] != "Multiple signals"], dtype=object).value_counts()
    return {"total": len(d), "total_value": float(d.value.sum()), "customers": int(d.user.nunique()), "flagged": len(f),
            "flagged_pct": round(100 * len(f) / len(d), 1), "high": int((d.risk == "High").sum()),
            "over_time": cnt(d.groupby(d.ts.dt.strftime("%Y-%m-%d")).value.sum()),
            "count_by_customer": cnt(d.groupby("user").size()), "value_by_customer": cnt(d.groupby("user").value.sum()),
            "by_category": cnt(d.groupby(d.category.fillna("Unknown")).size()), "by_reason": cnt(reasons),
            "normal_vs_flagged": [{"name": "Normal", "value": len(d) - len(f)}, {"name": "Flagged", "value": len(f)}],
            "recent": js(f.sort_values("ts", ascending=False).head(5)[["txn_id", "user", "ts", "value", "risk"]])}


@app.get("/api/customers")
def customers():
    return sorted(need().user.unique().tolist())


@app.get("/api/customers/{customer_id}")
def customer(customer_id: str):
    d = need()
    c = d[d.user == customer_id].sort_values("ts")
    if c.empty:
        raise HTTPException(404, f"Customer '{customer_id}' not found.")
    ok = c[~c.flagged]
    has = c.value.notna().any()
    return {"customer": customer_id, "n": len(c), "total": float(c.value.sum()),
            "avg": float(c.value.mean()) if has else None, "max": float(c.value.max()) if has else None,
            "span_days": round((c.ts.max() - c.ts.min()).total_seconds() / 86400, 1),
            "categories": c.category.value_counts().to_dict(), "ips": c.ip.dropna().value_counts().to_dict(),
            "usual_address": ok.address.mode().iloc[0] if not ok.address.dropna().empty else None,
            "flagged": int(c.flagged.sum()), "enough_history": len(c) >= 4,
            "series": js(c[["txn_id", "ts", "value", "risk"]])}


@app.get("/api/reports")
def reports():
    return {"available": ["cleaned_dataset.csv (written to backend/data after upload)", "Filtered CSV (Explorer page)"],
            "report": S["report"]}
