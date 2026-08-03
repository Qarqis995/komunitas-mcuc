#!/usr/bin/env python3
"""
ShieldScan Proxy Server
Proxy backend buat manggil VirusTotal, Hybrid Analysis, dan MetaDefender
API key disimpan di .env, gak pernah dikirim ke client.

Jalanin:
    pip install flask flask-cors requests python-dotenv --break-system-packages
    python server.py
"""

import os
import time
import json
import hashlib
import sqlite3
from pathlib import Path

import requests
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

VT_API_KEY = os.getenv("VT_API_KEY", "")
HA_API_KEY = os.getenv("HA_API_KEY", "")
MD_API_KEY = os.getenv("MD_API_KEY", "")
PORT = int(os.getenv("PORT", 8080))

BASE_DIR = Path(__file__).parent
DB_PATH = BASE_DIR / "cache.db"

app = Flask(__name__)
CORS(app)

# ── CACHE (SQLite) ──────────────────────────────────────────────────────────
def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS scan_cache (
            sha256 TEXT PRIMARY KEY,
            result TEXT NOT NULL,
            created_at INTEGER NOT NULL
        )
    """)
    conn.commit()
    conn.close()

def cache_get(sha256):
    conn = sqlite3.connect(DB_PATH)
    row = conn.execute("SELECT result, created_at FROM scan_cache WHERE sha256=?", (sha256,)).fetchone()
    conn.close()
    if not row:
        return None
    result, created_at = row
    # cache valid 24 jam
    if time.time() - created_at > 86400:
        return None
    return json.loads(result)

def cache_set(sha256, result):
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "INSERT OR REPLACE INTO scan_cache (sha256, result, created_at) VALUES (?, ?, ?)",
        (sha256, json.dumps(result), int(time.time()))
    )
    conn.commit()
    conn.close()

# ── RATE LIMIT SEDERHANA (in-memory) ────────────────────────────────────────
_last_call = {"vt": 0, "ha": 0, "md": 0}
_MIN_INTERVAL = {"vt": 15, "ha": 5, "md": 2}  # detik antar call (VT free = 4/menit)

def throttle(service):
    elapsed = time.time() - _last_call[service]
    wait = _MIN_INTERVAL[service] - elapsed
    if wait > 0:
        time.sleep(wait)
    _last_call[service] = time.time()

# ── VIRUSTOTAL ───────────────────────────────────────────────────────────────
def vt_lookup_hash(sha256):
    if not VT_API_KEY:
        return {"available": False, "error": "VT_API_KEY not set"}
    throttle("vt")
    url = f"https://www.virustotal.com/api/v3/files/{sha256}"
    headers = {"x-apikey": VT_API_KEY}
    try:
        r = requests.get(url, headers=headers, timeout=20)
        if r.status_code == 404:
            return {"available": True, "found": False}
        r.raise_for_status()
        data = r.json()["data"]["attributes"]
        stats = data.get("last_analysis_stats", {})
        return {
            "available": True,
            "found": True,
            "malicious": stats.get("malicious", 0),
            "suspicious": stats.get("suspicious", 0),
            "undetected": stats.get("undetected", 0),
            "total_engines": sum(stats.values()) if stats else 0,
            "reputation": data.get("reputation", 0),
            "names": data.get("names", [])[:5],
            "link": f"https://www.virustotal.com/gui/file/{sha256}"
        }
    except requests.exceptions.RequestException as e:
        return {"available": True, "error": str(e)}

def vt_upload_file(file_bytes, filename):
    if not VT_API_KEY:
        return {"available": False, "error": "VT_API_KEY not set"}
    throttle("vt")
    url = "https://www.virustotal.com/api/v3/files"
    headers = {"x-apikey": VT_API_KEY}
    try:
        files = {"file": (filename, file_bytes)}
        r = requests.post(url, headers=headers, files=files, timeout=60)
        r.raise_for_status()
        analysis_id = r.json()["data"]["id"]
        return {"available": True, "submitted": True, "analysis_id": analysis_id}
    except requests.exceptions.RequestException as e:
        return {"available": True, "error": str(e)}

def vt_poll_analysis(analysis_id, max_wait=30):
    if not VT_API_KEY:
        return {"available": False, "error": "VT_API_KEY not set"}
    url = f"https://www.virustotal.com/api/v3/analyses/{analysis_id}"
    headers = {"x-apikey": VT_API_KEY}
    waited = 0
    while waited < max_wait:
        throttle("vt")
        try:
            r = requests.get(url, headers=headers, timeout=20)
            r.raise_for_status()
            data = r.json()["data"]["attributes"]
            if data["status"] == "completed":
                stats = data.get("stats", {})
                return {
                    "available": True,
                    "found": True,
                    "malicious": stats.get("malicious", 0),
                    "suspicious": stats.get("suspicious", 0),
                    "undetected": stats.get("undetected", 0),
                    "total_engines": sum(stats.values()) if stats else 0,
                }
        except requests.exceptions.RequestException as e:
            return {"available": True, "error": str(e)}
        time.sleep(5)
        waited += 5
    return {"available": True, "error": "analysis timeout, still processing"}

# ── HYBRID ANALYSIS ──────────────────────────────────────────────────────────
def ha_lookup_hash(sha256):
    if not HA_API_KEY:
        return {"available": False, "error": "HA_API_KEY not set"}
    throttle("ha")
    url = "https://www.hybrid-analysis.com/api/v2/search/hash"
    headers = {"api-key": HA_API_KEY, "user-agent": "Falcon Sandbox", "accept": "application/json"}
    try:
        r = requests.post(url, headers=headers, data={"hash": sha256}, timeout=20)
        r.raise_for_status()
        results = r.json()
        if not results:
            return {"available": True, "found": False}
        top = results[0]
        return {
            "available": True,
            "found": True,
            "verdict": top.get("verdict", "unknown"),
            "threat_score": top.get("threat_score", 0),
            "av_detect": top.get("av_detect", 0),
            "vx_family": top.get("vx_family"),
            "link": f"https://www.hybrid-analysis.com/sample/{sha256}"
        }
    except requests.exceptions.RequestException as e:
        return {"available": True, "error": str(e)}

def ha_upload_file(file_bytes, filename):
    if not HA_API_KEY:
        return {"available": False, "error": "HA_API_KEY not set"}
    throttle("ha")
    url = "https://www.hybrid-analysis.com/api/v2/submit/file"
    headers = {"api-key": HA_API_KEY, "user-agent": "Falcon Sandbox"}
    try:
        files = {"file": (filename, file_bytes)}
        data = {"environment_id": 160}  # Windows 10 64-bit default
        r = requests.post(url, headers=headers, files=files, data=data, timeout=60)
        r.raise_for_status()
        return {"available": True, "submitted": True, "job_id": r.json().get("job_id")}
    except requests.exceptions.RequestException as e:
        return {"available": True, "error": str(e)}

# ── METADEFENDER ─────────────────────────────────────────────────────────────
def md_lookup_hash(sha256):
    if not MD_API_KEY:
        return {"available": False, "error": "MD_API_KEY not set"}
    throttle("md")
    url = f"https://api.metadefender.com/v4/hash/{sha256}"
    headers = {"apikey": MD_API_KEY}
    try:
        r = requests.get(url, headers=headers, timeout=20)
        if r.status_code == 404:
            return {"available": True, "found": False}
        r.raise_for_status()
        data = r.json()
        scan_results = data.get("scan_results", {})
        return {
            "available": True,
            "found": True,
            "total_detected": scan_results.get("total_detected_avs", 0),
            "total_avs": scan_results.get("total_avs", 0),
            "scan_all_result": scan_results.get("scan_all_result_a", "unknown"),
            "file_type": data.get("file_info", {}).get("file_type_description", "")
        }
    except requests.exceptions.RequestException as e:
        return {"available": True, "error": str(e)}

def md_upload_file(file_bytes, filename):
    if not MD_API_KEY:
        return {"available": False, "error": "MD_API_KEY not set"}
    throttle("md")
    url = "https://api.metadefender.com/v4/file"
    headers = {"apikey": MD_API_KEY, "filename": filename}
    try:
        r = requests.post(url, headers=headers, data=file_bytes, timeout=60)
        r.raise_for_status()
        return {"available": True, "submitted": True, "data_id": r.json().get("data_id")}
    except requests.exceptions.RequestException as e:
        return {"available": True, "error": str(e)}

def md_poll_result(data_id, max_wait=30):
    if not MD_API_KEY:
        return {"available": False, "error": "MD_API_KEY not set"}
    url = f"https://api.metadefender.com/v4/file/{data_id}"
    headers = {"apikey": MD_API_KEY}
    waited = 0
    while waited < max_wait:
        throttle("md")
        try:
            r = requests.get(url, headers=headers, timeout=20)
            r.raise_for_status()
            data = r.json()
            progress = data.get("scan_results", {}).get("progress_percentage", 0)
            if progress >= 100:
                scan_results = data.get("scan_results", {})
                return {
                    "available": True,
                    "found": True,
                    "total_detected": scan_results.get("total_detected_avs", 0),
                    "total_avs": scan_results.get("total_avs", 0),
                    "scan_all_result": scan_results.get("scan_all_result_a", "unknown"),
                }
        except requests.exceptions.RequestException as e:
            return {"available": True, "error": str(e)}
        time.sleep(5)
        waited += 5
    return {"available": True, "error": "analysis timeout, still processing"}

# ── ROUTES ───────────────────────────────────────────────────────────────────
@app.route("/", methods=["GET"])
def index():
    """Buka http://localhost:8080/ langsung nampilin file_deteksi.html"""
    return send_from_directory(BASE_DIR, "file_deteksi.html")

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "vt_configured": bool(VT_API_KEY),
        "ha_configured": bool(HA_API_KEY),
        "md_configured": bool(MD_API_KEY),
    })

@app.route("/scan/hash", methods=["POST"])
def scan_hash():
    """
    Body JSON: { "sha256": "..." }
    Cek ke 3 API sekaligus berdasarkan hash. Gagal di satu API -> skip, lanjut yang lain.
    """
    body = request.get_json(force=True, silent=True) or {}
    sha256 = body.get("sha256", "").strip().lower()
    if not sha256 or len(sha256) != 64:
        return jsonify({"error": "sha256 tidak valid"}), 400

    cached = cache_get(sha256)
    if cached:
        cached["from_cache"] = True
        return jsonify(cached)

    result = {
        "sha256": sha256,
        "from_cache": False,
        "vt": vt_lookup_hash(sha256),
        "ha": ha_lookup_hash(sha256),
        "md": md_lookup_hash(sha256),
    }

    # cache hanya kalau minimal 1 API punya hasil "found"
    if any(result[k].get("found") for k in ("vt", "ha", "md")):
        cache_set(sha256, result)

    return jsonify(result)

@app.route("/scan/upload", methods=["POST"])
def scan_upload():
    """
    multipart/form-data: file
    Dipanggil kalau hash gak ketemu di ketiga API (file baru/jarang).
    Upload ke VT + HA + MD sekaligus, lalu poll hasil (dengan batas waktu).
    """
    if "file" not in request.files:
        return jsonify({"error": "file tidak ditemukan di request"}), 400

    f = request.files["file"]
    file_bytes = f.read()
    filename = f.filename or "unknown"
    sha256 = hashlib.sha256(file_bytes).hexdigest()

    vt_result = {"available": False}
    ha_result = {"available": False}
    md_result = {"available": False}

    # VirusTotal: submit lalu poll
    try:
        vt_submit = vt_upload_file(file_bytes, filename)
        if vt_submit.get("submitted"):
            vt_result = vt_poll_analysis(vt_submit["analysis_id"])
        else:
            vt_result = vt_submit
    except Exception as e:
        vt_result = {"available": True, "error": str(e)}

    # Hybrid Analysis: submit (async, hasil biasanya gak instant, jadi cukup confirm submitted)
    try:
        ha_result = ha_upload_file(file_bytes, filename)
    except Exception as e:
        ha_result = {"available": True, "error": str(e)}

    # MetaDefender: submit lalu poll
    try:
        md_submit = md_upload_file(file_bytes, filename)
        if md_submit.get("submitted"):
            md_result = md_poll_result(md_submit["data_id"])
        else:
            md_result = md_submit
    except Exception as e:
        md_result = {"available": True, "error": str(e)}

    result = {
        "sha256": sha256,
        "from_cache": False,
        "vt": vt_result,
        "ha": ha_result,
        "md": md_result,
    }

    if any(result[k].get("found") for k in ("vt", "ha", "md")):
        cache_set(sha256, result)

    return jsonify(result)

@app.route("/<path:filename>", methods=["GET"])
def static_files(filename):
    """Serve file statis lain di folder yang sama (favicon, sw.js, dll).
    Didaftarkan paling akhir supaya semua endpoint API di atas (/health,
    /scan/hash, /scan/upload) tetap diprioritaskan lebih dulu."""
    file_path = BASE_DIR / filename
    if file_path.exists() and file_path.is_file():
        return send_from_directory(BASE_DIR, filename)
    return jsonify({"error": "not found"}), 404

if __name__ == "__main__":
    init_db()
    print(f"🛡️  ShieldScan Proxy jalan di http://0.0.0.0:{PORT}")
    print(f"   VT configured: {bool(VT_API_KEY)}")
    print(f"   HA configured: {bool(HA_API_KEY)}")
    print(f"   MD configured: {bool(MD_API_KEY)}")
    app.run(host="0.0.0.0", port=PORT, debug=False)
