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


def test_connection():
    """Gerçek bir API çağrısıyla token/repo/izinlerin çalışıp çalışmadığını
    kontrol eder. (ok, mesaj) döner -- admin panelde gösterilir."""
    cfg = _config()
    if not cfg:
        return False, "GITHUB_TOKEN veya GITHUB_REPO tanımlı değil."

    url = f"{API_ROOT}/repos/{cfg['repo']}"
    try:
        r = requests.get(url, headers=_headers(cfg["token"]), timeout=15)
    except requests.RequestException as e:
        return False, f"Bağlantı hatası: {e}"

    if r.status_code == 401:
        return False, "Token geçersiz veya süresi dolmuş (401)."
    if r.status_code == 403:
        return False, "Token'ın yetkisi yok / rate limit (403)."
    if r.status_code == 404:
        return False, f"Repo bulunamadı: '{cfg['repo']}' (404) — GITHUB_REPO değerini kontrol et (ör. Asistan80/Nova)."
    if r.status_code != 200:
        return False, f"Beklenmeyen hata: {r.status_code} {r.text[:200]}"

    data = r.json()
    permissions = data.get("permissions", {})
    if not permissions.get("push"):
        return False, f"Token repoyu görebiliyor ama YAZMA izni yok. Token'ı 'repo' izniyle yeniden oluştur."

    # Yazma testi: küçük bir test dosyası commit'leyip sil
    test_path = "_sync_test.txt"
    ok = push_file_content(test_path, "senkronizasyon testi", "sync test")
    if not ok:
        return False, "Repoyu görebiliyor ama test dosyası yazılamadı (izin ya da branch adı sorunu olabilir)."
    delete_file(test_path, "sync test temizliği")

    return True, f"Bağlantı sağlam — '{cfg['repo']}' reposuna '{cfg['branch']}' branch'ine yazabiliyor."


def push_file_content(repo_path, text_content, message):
    """push_file'ın dosya yerine düz metin alan hali (test için)."""
    cfg = _config()
    if not cfg:
        return False
    url = f"{API_ROOT}/repos/{cfg['repo']}/contents/{repo_path}"
    headers = _headers(cfg["token"])
    sha = None
    try:
        r = requests.get(url, headers=headers, params={"ref": cfg["branch"]}, timeout=15)
        if r.status_code == 200:
            sha = r.json().get("sha")
    except requests.RequestException:
        return False
    content_b64 = base64.b64encode(text_content.encode("utf-8")).decode("utf-8")
    payload = {"message": message, "content": content_b64, "branch": cfg["branch"]}
    if sha:
        payload["sha"] = sha
    try:
        r = requests.put(url, headers=headers, json=payload, timeout=30)
        return r.status_code in (200, 201)
    except requests.RequestException:
        return False


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


# ---------- Otomatik deploy tetikleme ----------
# Render'ın "Deploy Hook" URL'si tanımlıysa, admin panelden yapılan her
# değişiklikten sonra bu URL'e istek atılır ve Render otomatik olarak
# en son commit'i (yeni yüklenen dosyalar dahil) deploy eder. Böylece
# kullanıcının elle "Manual Deploy" yapmasına gerek kalmaz.

def deploy_hook_enabled():
    return bool(os.environ.get("RENDER_DEPLOY_HOOK_URL"))


def trigger_deploy():
    hook_url = os.environ.get("RENDER_DEPLOY_HOOK_URL")
    if not hook_url:
        return False
    try:
        r = requests.post(hook_url, timeout=15)
        return r.status_code in (200, 201, 202)
    except requests.RequestException:
        return False
