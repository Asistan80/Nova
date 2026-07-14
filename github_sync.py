# github_sync.py
# Admin panelden yapılan her değişikliği (projects.json + yüklenen dosyalar)
# GitHub reposuna otomatik commit'ler. Böylece Render'ın diski silinse bile
# bir sonraki deploy GitHub'daki güncel veriyi çeker, hiçbir şey kaybolmaz.
#
# Çalışması için Render'da (ya da yerelde) şu ortam değişkenlerinin
# tanımlı olması gerekir:
#   GITHUB_TOKEN  -> repo izinli bir Personal Access Token
#   GITHUB_REPO   -> ör. "Asistan80/Nova"
#   GITHUB_BRANCH -> ör. "main" (tanımlı değilse "main" varsayılır)
#
# Bu değişkenler tanımlı değilse, senkronizasyon sessizce atlanır --
# site normal çalışmaya devam eder, sadece yedekleme yapılmaz.

import os
import base64
import requests

API_ROOT = "https://api.github.com"


def _config():
    token = os.environ.get("GITHUB_TOKEN")
    repo = os.environ.get("GITHUB_REPO")
    branch = os.environ.get("GITHUB_BRANCH", "main")
    if not token or not repo:
        return None
    return {"token": token, "repo": repo, "branch": branch}


def _headers(token):
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
    }


def is_enabled():
    return _config() is not None


def push_file(local_path, repo_path, message):
    """local_path'teki dosyayı repo_path konumuna commit'ler (varsa günceller)."""
    cfg = _config()
    if not cfg or not os.path.exists(local_path):
        return False

    url = f"{API_ROOT}/repos/{cfg['repo']}/contents/{repo_path}"
    headers = _headers(cfg["token"])

    # Dosya zaten repoda var mı, varsa sha'sını al (güncelleme için gerekli)
    sha = None
    try:
        r = requests.get(url, headers=headers, params={"ref": cfg["branch"]}, timeout=15)
        if r.status_code == 200:
            sha = r.json().get("sha")
    except requests.RequestException:
        return False

    with open(local_path, "rb") as f:
        content_b64 = base64.b64encode(f.read()).decode("utf-8")

    payload = {"message": message, "content": content_b64, "branch": cfg["branch"]}
    if sha:
        payload["sha"] = sha

    try:
        r = requests.put(url, headers=headers, json=payload, timeout=30)
        return r.status_code in (200, 201)
    except requests.RequestException:
        return False


def delete_file(repo_path, message):
    """Repodaki bir dosyayı siler (varsa)."""
    cfg = _config()
    if not cfg:
        return False

    url = f"{API_ROOT}/repos/{cfg['repo']}/contents/{repo_path}"
    headers = _headers(cfg["token"])

    try:
        r = requests.get(url, headers=headers, params={"ref": cfg["branch"]}, timeout=15)
        if r.status_code != 200:
            return False
        sha = r.json().get("sha")
        payload = {"message": message, "sha": sha, "branch": cfg["branch"]}
        r = requests.delete(url, headers=headers, json=payload, timeout=15)
        return r.status_code == 200
    except requests.RequestException:
        return False
