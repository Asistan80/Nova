# notifications.py
# Yeni bir yorum geldiğinde admin'e (sana) haber verir -- 3 bağımsız kanal:
# e-posta (Gmail), Discord (webhook), telefon (ntfy.sh push).
# Her biri kendi ortam değişkeni tanımlıysa çalışır; tanımlı değilse
# sessizce atlanır. Hiçbiri site çalışmasını engellemez (hepsi try/except
# ile korunur).

import os
import smtplib
from email.mime.text import MIMEText

import requests


def _site_url():
    return os.environ.get("SITE_URL", "").rstrip("/")


# ---------- E-posta (Gmail SMTP) ----------

def _email_config():
    address = os.environ.get("GMAIL_ADDRESS")
    app_password = os.environ.get("GMAIL_APP_PASSWORD")
    to_addr = os.environ.get("NOTIFY_EMAIL_TO", address)
    if not address or not app_password:
        return None
    return {"address": address, "app_password": app_password, "to": to_addr}


def notify_email(subject, body):
    cfg = _email_config()
    if not cfg:
        return False
    try:
        msg = MIMEText(body, "plain", "utf-8")
        msg["Subject"] = subject
        msg["From"] = cfg["address"]
        msg["To"] = cfg["to"]
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=15) as server:
            server.login(cfg["address"], cfg["app_password"])
            server.sendmail(cfg["address"], [cfg["to"]], msg.as_string())
        return True
    except Exception:
        return False


# ---------- Discord (webhook) ----------

def notify_discord(text):
    url = os.environ.get("DISCORD_WEBHOOK_URL")
    if not url:
        return False
    try:
        r = requests.post(url, json={"content": text}, timeout=15)
        return r.status_code in (200, 204)
    except requests.RequestException:
        return False


# ---------- Telefon (ntfy.sh push -- uygulamasız, anlık) ----------

def notify_ntfy(title, message):
    topic = os.environ.get("NTFY_TOPIC")
    if not topic:
        return False
    try:
        r = requests.post(
            f"https://ntfy.sh/{topic}",
            data=message.encode("utf-8"),
            headers={"Title": title.encode("utf-8"), "Priority": "default"},
            timeout=15,
        )
        return r.status_code == 200
    except requests.RequestException:
        return False


# ---------- Telegram (bot üzerinden mesaj) ----------

def notify_telegram(text):
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID")
    if not token or not chat_id:
        return False
    try:
        r = requests.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json={"chat_id": chat_id, "text": text},
            timeout=15,
        )
        return r.status_code == 200
    except requests.RequestException:
        return False


# ---------- Ortak: yeni yorum bildirimi ----------

def notify_new_comment(project_name, comment_name, comment_text, admin_url):
    subject = f"Yeni yorum: {project_name}"
    body = (
        f'"{project_name}" için yeni bir yorum geldi.\n\n'
        f"Yazan: {comment_name}\n"
        f"Yorum: {comment_text}\n\n"
        f"Onaylamak/silmek için: {admin_url}"
    )
    notify_email(subject, body)
    notify_discord(f"💬 **Yeni yorum** — *{project_name}*\n**{comment_name}:** {comment_text}\n{admin_url}")
    notify_ntfy(subject, f"{comment_name}: {comment_text}")
    notify_telegram(f"💬 Yeni yorum — {project_name}\n{comment_name}: {comment_text}\n{admin_url}")


def any_enabled():
    return bool(
        _email_config()
        or os.environ.get("DISCORD_WEBHOOK_URL")
        or os.environ.get("NTFY_TOPIC")
        or (os.environ.get("TELEGRAM_BOT_TOKEN") and os.environ.get("TELEGRAM_CHAT_ID"))
    )


def status():
    return {
        "email": bool(_email_config()),
        "discord": bool(os.environ.get("DISCORD_WEBHOOK_URL")),
        "ntfy": bool(os.environ.get("NTFY_TOPIC")),
        "telegram": bool(os.environ.get("TELEGRAM_BOT_TOKEN") and os.environ.get("TELEGRAM_CHAT_ID")),
    }
