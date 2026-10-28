# Credit Card Fraud Detection Dashboard

Educational project based on the case study "Using Data Analysis for Detecting Credit Card Fraud". It cleans transaction data, flags unusual transactions with explainable rules and shows them in a dashboard. **A flag is a signal for review, not confirmed fraud.**

## Features
Overview dashboard (6 charts, live stats) · CSV upload with validation, cleaning and quality report · Transaction Explorer (filters, sorting, details, CSV download, masked accounts) · Alerts with reasons and next steps · Customer analysis with history chart · Configurable thresholds.

## Stack
React + Vite + Tailwind + Recharts + lucide-react; Python FastAPI + Pandas + NumPy. CSV storage, no paid APIs.

## Run on Windows (VS Code)
Open the `credit-card-fraud-detection` folder in VS Code, then open two terminals (Terminal > New Terminal).

**Terminal 1, backend** (run from the project root):
```
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cd ..
uvicorn app.main:app --reload --app-dir backend
```
If PowerShell blocks activation: `Set-ExecutionPolicy -Scope Process Bypass`, then activate again.
API docs: http://127.0.0.1:8000/docs

**Terminal 2, frontend** (run from the project root):
```
cd frontend
npm install
npm run dev
```
Open http://localhost:5173. The sample data loads automatically. On the Upload page you can download and re-upload `sample_transactions.csv`.

Common errors: "Cannot reach the backend" means Terminal 1 is not running; `uvicorn not found` means the venv is not activated; port in use means close the other process or change the port.

## Data workflow
Upload (original saved in `backend/data/original_upload.csv`) → validate columns → clean (blanks to empty, amounts to numbers, dates parsed, duplicates removed, bad rows rejected with reasons) → detect → API → dashboard. Cleaned data: `backend/data/cleaned_dataset.csv`.

## Detection rules (all thresholds configurable)
Compared with the customer's earlier *unflagged* transactions ("normal history"):
1. **High amount**: value > 5x the usual average.
2. **Rapid transactions**: within 10 minutes of the previous one.
3. **Address change**: address not in usual history (in-store / P.O. Box noted).
4. **Unusual IP**: IP not in usual history. No geographic inference is made.
5. **Bulk purchase**: at least 5 units and more than 3x the usual average.
6. **Multiple signals**: 1 rule = Low, 2 = Medium, 3 or more = High.

## API
`GET /api/health` · `POST /api/upload` · `POST /api/analyze` · `GET /api/transactions` · `GET /api/alerts` · `GET /api/summary` · `GET /api/data-quality` · `GET /api/customers` · `GET /api/customers/{id}` · `GET /api/reports` · `GET /api/sample`

## Sample dataset
`sample_data/sample_transactions.csv` contains the 13 rows visible in the case-study table (no synthetic rows were added). Dates are kept in their mixed original formats on purpose. Expected: johnp's three 3 June orders and ellend's $4,895 order are flagged High; davidg is not flagged.

## Testing status
Tested: cleaning and detection logic on the sample and on invalid-date, missing-user and duplicate rows (`pandas` 3.0.2). Not tested: FastAPI endpoints, the React frontend, `npm install` and the browser UI (no network or FastAPI in the build environment). Expect to fix small issues on first run.

## Limitations
Few rows per customer means weak baselines. Early anomalies are excluded from history, so a genuine permanent change keeps being flagged. Ambiguous numeric dates are assumed day-first. State is held in memory (one dataset at a time). No labelled data, so no accuracy claims.

## Not included yet
Investigation workflow with analyst notes, report export, a Data Quality page separate from Upload, date-range filter, Isolation Forest, and viva Q&A.
