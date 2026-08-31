# notifications.py
# Yeni bir yorum geldiğinde admin'e (sana) haber verir -- 3 bağımsız kanal:
# e-posta (Gmail), Discord (webhook), telefon (ntfy.sh push).
# Her biri kendi ortam değişkeni tanımlıysa çalışır; tanımlı değilse
# sessizce atlanır. Hiçbiri site çalışmasını engellemez (hepsi try/except
# ile korunur).

import os
import socket
import smtplib
import threading
import contextlib
from email.mime.text import MIMEText

import requests

# Render gibi bazı barındırma ortamlarında konteynerin IPv6 çıkışı çalışmıyor.
# smtp.gmail.com hem IPv4 hem IPv6 adresi döndürdüğü için Python bazen önce
# IPv6'yı dener ve "Network is unreachable" ile başarısız olur. Bu blok
# içinde DNS çözümlemesini geçici olarak IPv4'e zorluyoruz. Thread-safe
# olması için bir kilitle seri hale getiriyoruz (aynı anda tek SMTP
# gönderimi bu şekilde bağlansın, başka bir iş parçacığının ağ çağrılarını
# etkilemesin).
_ipv4_lock = threading.Lock()


@contextlib.contextmanager
def _force_ipv4_dns():
    original_getaddrinfo = socket.getaddrinfo

    def ipv4_only(host, port, family=0, type=0, proto=0, flags=0):
        return original_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)

    with _ipv4_lock:
        socket.getaddrinfo = ipv4_only
        try:
            yield
        finally:
            socket.getaddrinfo = original_getaddrinfo


def _smtp_ssl_connect():
    """IPv4'e zorlanmış bir smtplib.SMTP_SSL bağlantısı açar."""
    with _force_ipv4_dns():
        return smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=15)


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
        with _smtp_ssl_connect() as server:
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
    """Tüm bildirim kanallarını arka planda tetikler -- yorum gönderen
    ziyaretçiyi e-posta/Discord/Telegram isteklerinin süresi kadar bekletmez."""
    import threading

    def _fire():
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

    threading.Thread(target=_fire, daemon=True).start()


# ---------- Bülten: yeni içerik/devlog e-postası ----------

def notify_subscribers(subject, body_lines, subscribers, unsubscribe_url_fn):
    """Her aboneye ayrı ayrı, kendi çıkış linkiyle e-posta gönderir (arka planda)."""
    cfg = _email_config()
    if not cfg:
        print("[newsletter] Gmail bilgileri (GMAIL_ADDRESS/GMAIL_APP_PASSWORD) tanımlı değil, bülten gönderilemedi.")
        return
    if not subscribers:
        print("[newsletter] Aktif abone yok, bülten gönderilmedi.")
        return

    import threading

    def _fire():
        sent, failed = 0, 0
        for sub in subscribers:
            try:
                unsub_url = unsubscribe_url_fn(sub.get("token", ""))
                body = "\n".join(body_lines) + f"\n\n---\nBu e-postaları almak istemiyorsan: {unsub_url}"
                msg = MIMEText(body, "plain", "utf-8")
                msg["Subject"] = subject
                msg["From"] = cfg["address"]
                msg["To"] = sub["email"]
                with _smtp_ssl_connect() as server:
                    server.login(cfg["address"], cfg["app_password"])
                    server.sendmail(cfg["address"], [sub["email"]], msg.as_string())
                sent += 1
            except Exception as e:
                failed += 1
                print(f"[newsletter] {sub.get('email')} adresine gönderilemedi: {e}")
        print(f"[newsletter] '{subject}' -> {sent} gönderildi, {failed} başarısız.")

    threading.Thread(target=_fire, daemon=True).start()


def notify_new_project(project_name, project_url, tagline, subscribers, unsubscribe_url_fn):
    subject = f"🆕 Yeni: {project_name} — Derin Murnova Dünyası"
    body_lines = [
        f'"{project_name}" rafa eklendi!',
        tagline or "",
        "",
        f"Hemen bak: {project_url}",
    ]
    notify_subscribers(subject, body_lines, subscribers, unsubscribe_url_fn)


def notify_new_devlog(title, devlog_url, subscribers, unsubscribe_url_fn):
    subject = f"📝 Yeni devlog: {title} — Derin Murnova Dünyası"
    body_lines = [
        f'Yeni bir devlog kaydı yayınlandı: "{title}"',
        "",
        f"Oku: {devlog_url}",
    ]
    notify_subscribers(subject, body_lines, subscribers, unsubscribe_url_fn)


# ---------- Yorum yanıtı: ziyaretçiye bildirim (iletişim bilgisi bıraktıysa) ----------

def notify_comment_reply(to_email, project_name, reply_text, project_url):
    if not to_email or "@" not in to_email:
        return
    import threading

    def _fire():
        subject = f"MuBiKu yorumuna cevap verdi — {project_name}"
        body = (
            f'"{project_name}" için yaptığın yoruma bir cevap geldi:\n\n'
            f"\"{reply_text}\"\n\n"
            f"Sayfayı gör: {project_url}"
        )
        cfg = _email_config()
        if not cfg:
            return
        try:
            msg = MIMEText(body, "plain", "utf-8")
            msg["Subject"] = subject
            msg["From"] = cfg["address"]
            msg["To"] = to_email
            with _smtp_ssl_connect() as server:
                server.login(cfg["address"], cfg["app_password"])
                server.sendmail(cfg["address"], [to_email], msg.as_string())
        except Exception:
            pass

    threading.Thread(target=_fire, daemon=True).start()


def send_test_email(to_email):
    """Bülten SMTP ayarlarını hemen (arka plana atmadan) test eder,
    gerçek sonucu (ok, detay) olarak döner -- admin panelde anında görünsün diye."""
    cfg = _email_config()
    if not cfg:
        return False, "GMAIL_ADDRESS / GMAIL_APP_PASSWORD tanımlı değil, e-posta gönderilemiyor."
    try:
        msg = MIMEText(
            "Bu bir test mesajıdır -- Derin Murnova Dünyası bülten sistemi çalışıyor.",
            "plain", "utf-8",
        )
        msg["Subject"] = "🧪 Test e-postası — Derin Murnova Dünyası"
        msg["From"] = cfg["address"]
        msg["To"] = to_email
        with _smtp_ssl_connect() as server:
            server.login(cfg["address"], cfg["app_password"])
            server.sendmail(cfg["address"], [to_email], msg.as_string())
        return True, f"{to_email} adresine test maili gönderildi."
    except Exception as e:
        return False, f"Gönderilemedi: {e}"


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
