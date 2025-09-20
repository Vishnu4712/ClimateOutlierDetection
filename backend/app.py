from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import pandas as pd
import numpy as np
import io

app = FastAPI(title="Vector-Aware Anomaly API")

# CORS: allow your Next.js origin in prod
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # TODO: replace with ["http://localhost:3000"] or your domain in prod
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"service": "Vector-Aware Anomaly API", "routes": ["/health", "/analyze"]}

@app.get("/health")
def health():
    return {"ok": True}

# ---------------------- Schema handling ----------------------

# Exact headers from your data (case-insensitive match):
# Lat, Lon, Year, Month, Date, WS10M, WD10M, QV2M, Prec
REQUIRED = ["Lat", "Lon", "Year", "Month", "Date", "WS10M", "WD10M", "Prec"]

def normalize_from_ws10m_wd10m_schema(df: pd.DataFrame) -> pd.DataFrame:
    """
    - Validates required columns (case-insensitive).
    - Renames to internal names: lat, lon, wind_speed, wind_dir, prec, Year, Month, Date
    - Builds 'time' = datetime(Year, Month, Date)
    - Drops rows with missing critical fields.
    """
    cols = {c.lower(): c for c in df.columns}
    missing = [c for c in REQUIRED if c.lower() not in cols]
    if missing:
        raise HTTPException(400, detail=f"Missing required columns: {missing}. Found: {list(df.columns)}")

    rename = {
        cols["lat"]:   "lat",
        cols["lon"]:   "lon",
        cols["ws10m"]: "wind_speed",
        cols["wd10m"]: "wind_dir",
        cols["prec"]:  "prec",
        cols["year"]:  "Year",
        cols["month"]: "Month",
        cols["date"]:  "Date",
    }
    df = df.rename(columns=rename)

    for c in ["lat","lon","wind_speed","wind_dir","prec","Year","Month","Date"]:
        df[c] = pd.to_numeric(df[c], errors="coerce")

    # Build a proper datetime
    try:
        df["time"] = pd.to_datetime(
            dict(year=df["Year"].astype(int), month=df["Month"].astype(int), day=df["Date"].astype(int)),
            errors="coerce"
        )
    except Exception:
        df["time"] = pd.to_datetime(
            df["Year"].astype(str) + "-" + df["Month"].astype(str) + "-" + df["Date"].astype(str),
            errors="coerce"
        )

    df = df.dropna(subset=["lat","lon","time","prec","wind_speed","wind_dir"]).reset_index(drop=True)
    if df.empty:
        raise HTTPException(400, detail="No valid rows after parsing/cleaning.")
    return df

# ---------------------- Math helpers ----------------------

def _to_uv_toward(ws: np.ndarray, wd_from_deg: np.ndarray):
    """
    Convert wind speed + FROM-direction (met, degrees cw from North) to a vector TOWARD.
    u = -sin(theta)*ws, v = -cos(theta)*ws
    """
    th = np.deg2rad(wd_from_deg.astype(float))
    u = -np.sin(th) * ws
    v = -np.cos(th) * ws
    return u, v

def _robust_z(x: np.ndarray) -> np.ndarray:
    x = x.astype(float)
    med = np.median(x)
    mad = np.median(np.abs(x - med)) + 1e-9
    return 0.6745 * (x - med) / mad

def _coherence_knn_numpy(lat, lon, u, v, k=8):
    """
    Pure NumPy kNN (O(n^2)) in degree space.
    For each i: find k nearest neighbors, compare neighbor wind (unit) with
    ideal vector pointing neighbor -> i. Average cosine similarities.
    """
    n = len(lat)
    if n == 0:
        return np.zeros(0, float)

    dlon = lon.reshape(-1,1) - lon.reshape(1,-1)
    dlat = lat.reshape(-1,1) - lat.reshape(1,-1)
    dist2 = dlon**2 + dlat**2
    np.fill_diagonal(dist2, np.inf)
    kk = min(int(k), n)
    nbrs = np.argpartition(dist2, kk-1, axis=1)[:, :kk]

    wnorm = np.hypot(u, v) + 1e-12
    un = u / wnorm
    vn = v / wnorm

    coh = np.zeros(n, float)
    for i in range(n):
        neigh = nbrs[i]
        if neigh.size == 0:
            coh[i] = 0.0
            continue
        iu = (lon[i] - lon[neigh])
        iv = (lat[i] - lat[neigh])
        inorm = np.hypot(iu, iv) + 1e-12
        iu /= inorm; iv /= inorm
        dots = un[neigh] * iu + vn[neigh] * iv
        coh[i] = float(np.mean(dots))
    return np.clip(coh, -1.0, 1.0)

def _process(df: pd.DataFrame, z_thresh=3.0, k=8, coh_thresh=0.4) -> pd.DataFrame:
    """
    Per-day robust-z on 'prec' + kNN coherence on wind direction.
    Adds: coherence_score, robust_z, is_anomaly, flag
    """
    out = df.copy()
    out["coherence_score"] = np.nan
    out["robust_z"] = np.nan
    out["is_anomaly"] = False
    out["flag"] = "none"

    for _, g in out.groupby("time", sort=False):
        idx = g.index.to_numpy()
        if len(idx) == 0:
            continue

        lat = g["lat"].to_numpy(float)
        lon = g["lon"].to_numpy(float)
        ws  = g["wind_speed"].to_numpy(float)
        wd  = g["wind_dir"].to_numpy(float)

        u, v = _to_uv_toward(ws, wd)
        coh = _coherence_knn_numpy(lat, lon, u, v, k=int(k) if k else 8)
        rz  = _robust_z(g["prec"].to_numpy(float))

        out.loc[idx, "coherence_score"] = coh
        out.loc[idx, "robust_z"] = rz
        out.loc[idx, "is_anomaly"] = rz > float(z_thresh)
        mask_an = out.loc[idx, "is_anomaly"].to_numpy()
        flag = np.where(~mask_an, "none", np.where(coh >= float(coh_thresh), "true", "false"))
        out.loc[idx, "flag"] = flag

    return out

# ---------------------- API ----------------------

@app.post("/analyze")
async def analyze(
    file: UploadFile = File(...),
    z_thresh: float = 3.0,
    k: int = 8,
    coh_thresh: float = 0.4
):
    """
    Accepts .csv or .csv.gz with columns:
      Lat, Lon, Year, Month, Date, WS10M, WD10M, QV2M, Prec
    Streams read (good for large files), normalizes columns, and returns a CSV
    with coherence/anomaly flags.
    """
    name = (file.filename or "").lower()
    if not (name.endswith(".csv") or name.endswith(".csv.gz")):
        raise HTTPException(400, detail="Upload a .csv or .csv.gz file")

    try:
        # Stream read to avoid loading all bytes into RAM at once
        df = pd.read_csv(file.file, compression="infer")
        df = normalize_from_ws10m_wd10m_schema(df)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, detail=f"CSV parse/normalize error: {e}")

    try:
        out = _process(df, z_thresh=z_thresh, k=k, coh_thresh=coh_thresh)
    except Exception as e:
        raise HTTPException(500, detail=f"Detection error: {e}")

    buf = io.StringIO()
    out.to_csv(buf, index=False)
    buf.seek(0)
    download_name = (file.filename or "uploaded.csv").rsplit(".", 1)[0] + "_flagged.csv"
    headers = {"Content-Disposition": f'attachment; filename="{download_name}"'}
    return StreamingResponse(iter([buf.getvalue()]), media_type="text/csv", headers=headers)
