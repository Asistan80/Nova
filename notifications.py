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


# ---------- E-posta: SendGrid (HTTP API, önerilen) + Gmail SMTP (yedek) ----------
#
# Render'ın (ve birçok ücretsiz barındırmanın) giden SMTP portlarını (25/465/587)
# engellediği doğrulandı -- bu yüzden asıl yol artık SendGrid'in HTTP API'si
# (port 443, hiçbir zaman engellenmiyor). SENDGRID_API_KEY tanımlıysa o
# kullanılır. Tanımlı değilse (ör. yerel geliştirmede, ya da SMTP'nin açık
# olduğu başka bir barındırmada), eski Gmail SMTP yöntemine düşülür.

def _sendgrid_config():
    api_key = os.environ.get("SENDGRID_API_KEY")
    from_email = os.environ.get("SENDGRID_FROM_EMAIL") or os.environ.get("GMAIL_ADDRESS")
    if not api_key or not from_email:
        return None
    return {"api_key": api_key, "from_email": from_email}


def _email_config():
    """Sadece yedek plan olan Gmail SMTP için (SendGrid tanımlı değilse)."""
    address = os.environ.get("GMAIL_ADDRESS")
    app_password = os.environ.get("GMAIL_APP_PASSWORD")
    to_addr = os.environ.get("NOTIFY_EMAIL_TO", address)
    if not address or not app_password:
        return None
    return {"address": address, "app_password": app_password, "to": to_addr}


def _email_enabled():
    return bool(_sendgrid_config() or _email_config())


def _send_via_sendgrid(to_email, subject, body):
    cfg = _sendgrid_config()
    try:
        r = requests.post(
            "https://api.sendgrid.com/v3/mail/send",
            headers={"Authorization": f"Bearer {cfg['api_key']}", "Content-Type": "application/json"},
            json={
                "personalizations": [{"to": [{"email": to_email}]}],
                "from": {"email": cfg["from_email"], "name": "Derin Murnova Dünyası"},
                "subject": subject,
                "content": [{"type": "text/plain", "value": body}],
            },
            timeout=15,
        )
        if r.status_code in (200, 202):
            return True, "gönderildi (SendGrid)"
        return False, f"SendGrid HTTP {r.status_code}: {r.text[:200]}"
    except requests.RequestException as e:
        return False, f"SendGrid bağlantı hatası: {e}"


def _send_via_smtp(to_email, subject, body):
    cfg = _email_config()
    try:
        msg = MIMEText(body, "plain", "utf-8")
        msg["Subject"] = subject
        msg["From"] = cfg["address"]
        msg["To"] = to_email
        with _smtp_ssl_connect() as server:
            server.login(cfg["address"], cfg["app_password"])
            server.sendmail(cfg["address"], [to_email], msg.as_string())
        return True, "gönderildi (SMTP)"
    except Exception as e:
        return False, f"SMTP hatası: {e}"


def send_email(to_email, subject, body):
    """Tüm gönderimlerin geçtiği tek nokta: önce SendGrid, yoksa Gmail SMTP.
    (ok: bool, detay: str) döner."""
    if _sendgrid_config():
        return _send_via_sendgrid(to_email, subject, body)
    if _email_config():
        return _send_via_smtp(to_email, subject, body)
    return False, "Ne SENDGRID_API_KEY ne GMAIL_ADDRESS/GMAIL_APP_PASSWORD tanımlı."


def notify_email(subject, body):
    cfg = _sendgrid_config()
    to_addr = os.environ.get("NOTIFY_EMAIL_TO") or (cfg["from_email"] if cfg else None) or os.environ.get("GMAIL_ADDRESS")
    if not to_addr:
        return False
    ok, detail = send_email(to_addr, subject, body)
    if not ok:
        print(f"[notify_email] gönderilemedi: {detail}")
    return ok


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
    if not _email_enabled():
        print("[newsletter] Ne SendGrid ne Gmail SMTP tanımlı, bülten gönderilemedi.")
        return
    if not subscribers:
        print("[newsletter] Aktif abone yok, bülten gönderilmedi.")
        return

    import threading

    def _fire():
        sent, failed = 0, 0
        for sub in subscribers:
            unsub_url = unsubscribe_url_fn(sub.get("token", ""))
            body = "\n".join(body_lines) + f"\n\n---\nBu e-postaları almak istemiyorsan: {unsub_url}"
            ok, detail = send_email(sub["email"], subject, body)
            if ok:
                sent += 1
            else:
                failed += 1
                print(f"[newsletter] {sub.get('email')} adresine gönderilemedi: {detail}")
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
        ok, detail = send_email(to_email, subject, body)
        if not ok:
            print(f"[comment_reply] {to_email} adresine gönderilemedi: {detail}")

    threading.Thread(target=_fire, daemon=True).start()


def send_test_email(to_email):
    """Bülten e-posta ayarlarını hemen (arka plana atmadan) test eder,
    gerçek sonucu (ok, detay) olarak döner -- admin panelde anında görünsün diye."""
    return send_email(
        to_email,
        "🧪 Test e-postası — Derin Murnova Dünyası",
        "Bu bir test mesajıdır -- Derin Murnova Dünyası bülten sistemi çalışıyor.",
    )


def test_smtp_ports():
    """Render'ın giden SMTP portlarını gerçekten engelleyip engellemediğini
    kanıtlamak için birkaç hedefe kısa süreli ham soket bağlantısı dener.
    google.com:443 bir referans noktasıdır (bu her zaman açık olmalı --
    kapalıysa sorun SMTP'ye özgü değil, genel giden bağlantıdadır)."""
    import time as _time

    targets = [
        ("google.com", 443, "referans (HTTPS -- her zaman açık olmalı)"),
        ("smtp.gmail.com", 465, "SMTPS (SSL)"),
        ("smtp.gmail.com", 587, "SMTP (STARTTLS)"),
        ("smtp.gmail.com", 25, "SMTP (düz)"),
    ]
    results = []
    for host, port, label in targets:
        start = _time.time()
        try:
            with _force_ipv4_dns():
                s = socket.create_connection((host, port), timeout=6)
            s.close()
            results.append({"host": host, "port": port, "label": label, "ok": True,
                             "detail": "bağlandı", "ms": int((_time.time() - start) * 1000)})
        except Exception as e:
            results.append({"host": host, "port": port, "label": label, "ok": False,
                             "detail": str(e), "ms": int((_time.time() - start) * 1000)})
    return results


def any_enabled():
    return bool(
        _email_enabled()
        or os.environ.get("DISCORD_WEBHOOK_URL")
        or os.environ.get("NTFY_TOPIC")
        or (os.environ.get("TELEGRAM_BOT_TOKEN") and os.environ.get("TELEGRAM_CHAT_ID"))
    )


def status():
    return {
        "email": _email_enabled(),
        "email_via": "SendGrid" if _sendgrid_config() else ("Gmail SMTP" if _email_config() else None),
        "discord": bool(os.environ.get("DISCORD_WEBHOOK_URL")),
        "ntfy": bool(os.environ.get("NTFY_TOPIC")),
        "telegram": bool(os.environ.get("TELEGRAM_BOT_TOKEN") and os.environ.get("TELEGRAM_CHAT_ID")),
    }
