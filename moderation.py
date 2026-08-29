# moderation.py
# Yorumlar için basit, kelime-listesi tabanlı küfür/spam tespiti.
# Amaç yorumu ENGELLEMEK değil -- her yorum zaten admin onayından geçiyor.
# Burada yapılan tek şey, şüpheli yorumları admin panelde bir uyarı
# rozetiyle işaretlemek, böylece admin onay verirken önceliklendirebilir.

import re

# Kaba/küfür kelimeleri (Türkçe + yaygın İngilizce) -- kısaltılmış, temsili liste.
_BANNED_WORDS = {
    "amk", "aq", "orospu", "piç", "yavşak", "siktir", "göt", "amcık",
    "salak", "gerizekalı", "mal herif", "fuck", "shit", "bitch", "asshole",
    "cunt", "motherfucker",
}

# Spam belirtileri: link bombardımanı, tekrarlayan karakterler, promosyon dili.
_SPAM_PATTERNS = [
    re.compile(r"(https?://|www\.)\S+"),
    re.compile(r"(.)\1{6,}"),  # aynı karakterin 7+ kez tekrarı
    re.compile(r"\b(bedava|ücretsiz kazan|bit\.ly|tıkla kazan|casino|bahis sitesi)\b", re.IGNORECASE),
]


def check_text(text):
    """(flagged: bool, reason: str) döner. Metni değiştirmez, sadece işaretler."""
    if not text:
        return False, ""
    lowered = text.lower()

    for word in _BANNED_WORDS:
        if re.search(r"\b" + re.escape(word) + r"\b", lowered):
            return True, "olası küfür/hakaret"

    for pattern in _SPAM_PATTERNS:
        if pattern.search(text):
            return True, "olası spam (link/tekrar/promosyon)"

    return False, ""
