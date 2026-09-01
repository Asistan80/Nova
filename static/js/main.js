// ---------- Mobil hamburger menü ----------
(function () {
  const btn = document.querySelector(".mobile-menu-btn");
  const panel = document.getElementById("mobile-menu-panel");
  if (!btn || !panel) return;
  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    const open = panel.classList.toggle("open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });
  panel.addEventListener("click", function (e) {
    if (e.target.tagName === "A") panel.classList.remove("open");
  });
  document.addEventListener("click", function (e) {
    if (!panel.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
      panel.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    }
  });
})();

// ---------- Boot sekansı (sadece oturum başına bir kez) ----------
(function () {
  const overlay = document.getElementById("boot-overlay");
  if (!overlay) return;

  const alreadyBooted = sessionStorage.getItem("murnova-booted");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (alreadyBooted || reduceMotion) {
    overlay.remove();
    return;
  }

  sessionStorage.setItem("murnova-booted", "1");
  setTimeout(function () {
    overlay.classList.add("boot-hide");
    setTimeout(function () { overlay.remove(); }, 650);
  }, 950);
})();

// ---------- Tema geçişi ----------
(function () {
  const root = document.documentElement;
  const saved = localStorage.getItem("murnova-theme");
  if (saved) root.setAttribute("data-theme", saved);

  document.addEventListener("click", function (e) {
    const btn = e.target.closest(".theme-toggle:not(.sound-toggle)");
    if (!btn) return;
    const current = root.getAttribute("data-theme") === "light" ? "light" : "dark";
    const next = current === "light" ? "dark" : "light";
    if (next === "dark") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", "light");
    }
    localStorage.setItem("murnova-theme", next);
  });
})();

// ---------- Filtre / arama ----------
(function () {
  const bar = document.querySelector(".filter-bar");
  if (!bar) return;

  const chips = bar.querySelectorAll(".chip-btn");
  const searchInput = bar.querySelector("input[type='search']");
  const carts = document.querySelectorAll(".rack .cart[data-kind]");
  const emptyMsgs = document.querySelectorAll(".empty-msg");

  let activeKind = "all";

  function applyFilter() {
    const query = (searchInput ? searchInput.value : "").trim().toLowerCase();
    let anyVisible = false;

    carts.forEach((cart) => {
      const kind = cart.dataset.kind;
      const haystack = cart.dataset.search || "";
      const kindMatch = activeKind === "all" || kind === activeKind;
      const searchMatch = !query || haystack.includes(query);
      const visible = kindMatch && searchMatch;
      cart.classList.toggle("hidden-by-filter", !visible);
      if (visible) anyVisible = true;
    });

    emptyMsgs.forEach((m) => m.classList.toggle("show", !anyVisible));
  }

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      activeKind = chip.dataset.filter;
      applyFilter();
    });
  });

  if (searchInput) {
    searchInput.addEventListener("input", applyFilter);
  }
})();

// ---------- Scroll reveal ----------
(function () {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("in"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  items.forEach((el) => io.observe(el));
})();

// ---------- Galeri lightbox ----------
(function () {
  const grid = document.querySelector(".gallery-grid");
  const lightbox = document.getElementById("lightbox");
  if (!grid || !lightbox) return;

  const lbImg = lightbox.querySelector("img");

  grid.querySelectorAll("img").forEach((img) => {
    img.addEventListener("click", () => {
      lbImg.src = img.src;
      lightbox.classList.add("open");
    });
  });

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox || e.target.classList.contains("lightbox-close")) {
      lightbox.classList.remove("open");
      lbImg.src = "";
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      lightbox.classList.remove("open");
      lbImg.src = "";
    }
  });
})();

// ---------- GIF kartlarında hover'da oynatma ----------
(function () {
  document.querySelectorAll(".gif-hover-preview").forEach((img) => {
    const posterSrc = img.getAttribute("src");
    const gifSrc = img.dataset.gif;
    img.addEventListener("mouseenter", () => { img.src = gifSrc; });
    img.addEventListener("mouseleave", () => { img.src = posterSrc; });
  });
})();

// ---------- Görsel yüklenene kadar iskelet (skeleton) efekti ----------
(function () {
  document.querySelectorAll(".cart-cover img, .media-preview img").forEach((img) => {
    if (img.complete) return;
    img.classList.add("skeleton");
    img.addEventListener("load", () => img.classList.remove("skeleton"), { once: true });
    img.addEventListener("error", () => img.classList.remove("skeleton"), { once: true });
  });
})();

// ---------- Linki kopyala ----------
(function () {
  document.addEventListener("click", function (e) {
    const btn = e.target.closest(".copy-link-btn");
    if (!btn) return;
    const url = btn.dataset.url || window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      const original = btn.textContent;
      btn.textContent = "Kopyalandı!";
      setTimeout(() => { btn.textContent = original; }, 1600);
    });
  });
})();


// ---------- Beğeni butonu ----------
(function () {
  document.querySelectorAll(".like-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const slug = btn.dataset.slug;
      fetch("/begen/" + slug, { method: "POST" })
        .then((r) => r.json())
        .then((data) => {
          btn.classList.toggle("liked", data.liked);
          btn.querySelector(".like-count").textContent = data.count;
          btn.classList.add("pop");
          setTimeout(() => btn.classList.remove("pop"), 250);
        })
        .catch(() => {});
    });
  });
})();

// ---------- Ses efekti aç/kapa + tıklama sesleri ----------
(function () {
  const root = document.documentElement;
  const saved = localStorage.getItem("murnova-sound");
  if (saved === "off") root.setAttribute("data-sound", "off");

  let audioCtx = null;
  function beep(freq, dur) {
    if (root.getAttribute("data-sound") === "off") return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + dur);
    } catch (e) {}
  }

  document.addEventListener("click", function (e) {
    const soundBtn = e.target.closest(".sound-toggle");
    if (soundBtn) {
      const next = root.getAttribute("data-sound") === "off" ? "on" : "off";
      if (next === "off") root.setAttribute("data-sound", "off");
      else root.removeAttribute("data-sound");
      localStorage.setItem("murnova-sound", next);
      beep(440, 0.08);
      return;
    }
    if (e.target.closest(".btn, .mini-btn, .like-btn, .chip-btn")) {
      beep(520, 0.06);
    }
  });
})();

// ---------- Ziyaretçi rozetleri (localStorage tabanlı, eğlence amaçlı) ----------
(function () {
  const MILESTONES = [
    { count: 1, emoji: "🎉", label: "İlk keşif" },
    { count: 3, emoji: "🔥", label: "3 farklı içerik" },
    { count: 5, emoji: "⭐", label: "5 kartuş keşfettin" },
    { count: 10, emoji: "🏆", label: "Gerçek bir kaşifsin" },
    { count: 20, emoji: "🌌", label: "Efsane kaşif" },
  ];

  function getVisited() {
    try { return JSON.parse(localStorage.getItem("murnova-visited") || "[]"); }
    catch (e) { return []; }
  }
  function getUnlocked() {
    try { return JSON.parse(localStorage.getItem("murnova-badges") || "[]"); }
    catch (e) { return []; }
  }
  function setUnlocked(list) {
    localStorage.setItem("murnova-badges", JSON.stringify(list));
  }
  function getSeen() {
    try { return JSON.parse(localStorage.getItem("murnova-badges-seen") || "[]"); }
    catch (e) { return []; }
  }
  function markAllSeen() {
    localStorage.setItem("murnova-badges-seen", JSON.stringify(getUnlocked()));
    const countEl = document.getElementById("badge-shelf-count");
    if (countEl) countEl.textContent = "";
  }

  function renderShelf() {
    const countEl = document.getElementById("badge-shelf-count");
    const panel = document.getElementById("badge-shelf-panel");
    if (!panel) return;
    const visited = getVisited().length;
    const unlocked = getUnlocked();
    const seen = getSeen();
    const unseenCount = unlocked.filter(function (c) { return !seen.includes(c); }).length;
    if (countEl) countEl.textContent = unseenCount ? unseenCount : "";

    panel.innerHTML =
      '<div class="badge-shelf-title">Rozetlerim (' + unlocked.length + '/' + MILESTONES.length + ')</div>' +
      MILESTONES.map(function (m) {
        const has = unlocked.includes(m.count);
        return (
          '<div class="badge-shelf-item' + (has ? " unlocked" : "") + '">' +
          '<span class="badge-shelf-emoji">' + (has ? m.emoji : "🔒") + "</span>" +
          '<span class="badge-shelf-info"><strong>' + m.label + "</strong>" +
          (has ? "" : '<span class="badge-shelf-progress">' + visited + "/" + m.count + " içerik</span>") +
          "</span></div>"
        );
      }).join("") +
      (unlocked.length ? '<button type="button" class="badge-shelf-share-btn" id="badge-shelf-share-btn">📤 Rozetlerimi Paylaş</button>' : "");

    const shareBtn = document.getElementById("badge-shelf-share-btn");
    if (shareBtn) shareBtn.addEventListener("click", shareBadgeCard);
  }

  function shareBadgeCard() {
    const unlocked = getUnlocked();
    const earned = MILESTONES.filter(function (m) { return unlocked.includes(m.count); });

    const canvas = document.createElement("canvas");
    canvas.width = 800; canvas.height = 420;
    const ctx = canvas.getContext("2d");

    const grad = ctx.createLinearGradient(0, 0, 800, 420);
    grad.addColorStop(0, "#4C8DFF"); grad.addColorStop(0.5, "#A56BFF"); grad.addColorStop(1, "#FF5C7A");
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 800, 420);
    ctx.fillStyle = "rgba(8,8,18,0.45)"; ctx.fillRect(0, 0, 800, 420);

    ctx.fillStyle = "#fff";
    ctx.font = "700 34px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Derin Murnova Dünyası'nda", 400, 90);
    ctx.fillText(earned.length + " rozet açtım! 🏆", 400, 140);

    ctx.font = "56px sans-serif";
    const emojis = earned.map(function (m) { return m.emoji; }).join("   ");
    ctx.fillText(emojis || "—", 400, 240);

    ctx.font = "600 22px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText(window.location.hostname, 400, 380);

    canvas.toBlob(function (blob) {
      if (!blob) return;
      const file = new File([blob], "rozetlerim.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({
          files: [file],
          title: "Rozetlerim",
          text: earned.length + " rozet açtım! Derin Murnova Dünyası'nda sen de keşfet:",
        }).catch(() => {});
      } else {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "rozetlerim.png";
        link.click();
      }
    }, "image/png");
  }

  // Rozet paneli aç/kapa
  const shelfBtn = document.querySelector(".badge-shelf-btn");
  const shelfPanel = document.getElementById("badge-shelf-panel");
  if (shelfBtn && shelfPanel) {
    renderShelf();
    shelfBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      shelfPanel.classList.toggle("open");
      if (shelfPanel.classList.contains("open")) markAllSeen();
    });
    document.addEventListener("click", function (e) {
      if (!shelfPanel.contains(e.target) && e.target !== shelfBtn) shelfPanel.classList.remove("open");
    });
  }

  if (!document.body.dataset.detailPage) return;
  let visited = getVisited();
  const slug = document.body.dataset.detailPage;
  if (!visited.includes(slug)) visited.push(slug);
  localStorage.setItem("murnova-visited", JSON.stringify(visited));

  const count = visited.length;
  const unlocked = getUnlocked();
  const newlyUnlocked = MILESTONES.filter(function (m) { return m.count <= count && !unlocked.includes(m.count); });
  if (newlyUnlocked.length) {
    const merged = unlocked.concat(newlyUnlocked.map(function (m) { return m.count; }));
    setUnlocked(merged);
    renderShelf();
    const latest = newlyUnlocked[newlyUnlocked.length - 1];
    const toast = document.createElement("div");
    toast.className = "badge-toast";
    toast.textContent = latest.emoji + " " + latest.label + "!";
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => { toast.classList.remove("show"); setTimeout(() => toast.remove(), 400); }, 3200);
  }
})();

// ---------- Easter egg: Konami kodu ----------
(function () {
  const seq = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
  let pos = 0;
  document.addEventListener("keydown", function (e) {
    pos = (e.key === seq[pos]) ? pos + 1 : 0;
    if (pos === seq.length) {
      pos = 0;
      triggerEasterEgg();
    }
  });

  function triggerEasterEgg() {
    const overlay = document.createElement("div");
    overlay.className = "easter-egg-overlay";
    overlay.innerHTML = '<div class="easter-egg-msg">🐍 KARTUŞ MODU AÇILDI 🐍</div>';
    document.body.appendChild(overlay);
    for (let i = 0; i < 30; i++) {
      const bit = document.createElement("span");
      bit.className = "confetti-bit";
      bit.style.left = Math.random() * 100 + "vw";
      bit.style.animationDelay = (Math.random() * 0.6) + "s";
      bit.style.background = ["#FFB347", "#5EEAD4", "#FF5D5D"][i % 3];
      overlay.appendChild(bit);
    }
    setTimeout(() => overlay.remove(), 2800);
  }
})();

// ---------- PWA: service worker kaydı ----------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("/static/sw.js").catch(function () {});
  });
}

// ---------- Favoriler (localStorage, hesap gerektirmez) ----------
(function () {
  function getFavorites() {
    try { return JSON.parse(localStorage.getItem("murnova-favorites") || "[]"); }
    catch (e) { return []; }
  }
  function setFavorites(list) {
    localStorage.setItem("murnova-favorites", JSON.stringify(list));
  }
  function isFavorited(slug) {
    return getFavorites().includes(slug);
  }
  function paintStar(el, slug) {
    el.classList.toggle("favorited", isFavorited(slug));
  }

  // Sayfadaki tüm favori butonlarını başlangıç durumuna göre boya
  document.querySelectorAll(".favorite-star, .favorite-btn").forEach((el) => {
    paintStar(el, el.dataset.slug);
  });

  document.addEventListener("click", function (e) {
    const btn = e.target.closest(".favorite-star, .favorite-btn");
    if (!btn) return;
    e.preventDefault();
    const slug = btn.dataset.slug;
    let favs = getFavorites();
    if (favs.includes(slug)) {
      favs = favs.filter((s) => s !== slug);
    } else {
      favs.push(slug);
    }
    setFavorites(favs);
    document.querySelectorAll('[data-slug="' + slug + '"].favorite-star, [data-slug="' + slug + '"].favorite-btn').forEach((el) => {
      paintStar(el, slug);
      el.classList.add("pop");
      setTimeout(() => el.classList.remove("pop"), 250);
    });
  });

  // Favoriler sayfasındaysa: sadece favorilenmiş kartları göster
  const favPage = document.getElementById("favorites-page");
  if (favPage) {
    const favs = getFavorites();
    const cards = favPage.querySelectorAll(".cart[data-slug]");
    let visibleCount = 0;
    cards.forEach((card) => {
      const match = favs.includes(card.dataset.slug);
      card.style.display = match ? "" : "none";
      if (match) visibleCount++;
    });
    const emptyMsg = document.getElementById("favorites-empty");
    if (emptyMsg) emptyMsg.style.display = visibleCount ? "none" : "block";
  }
})();

// ---------- Video kartuş kartlarında gerçek bir önizleme karesi göster ----------
// preload="metadata" + #t=0.5 bazı tarayıcılarda (özellikle mobil) siyah/boş
// kare bırakabiliyor -- metadata yüklenince kareyi bilinçli olarak "seek" edip
// gerçekten bir kareyi decode ettiriyoruz.
(function () {
  document.querySelectorAll(".cart-video-thumb").forEach((video) => {
    video.addEventListener("loadedmetadata", function () {
      const target = Math.min(0.5, (video.duration || 1) / 4);
      try { video.currentTime = target; } catch (e) {}
    });
  });
})();

// ---------- Takma ad ile cihazlar arası favori senkronu (hesapsız) ----------
(function () {
  const btn = document.getElementById("nickname-sync-btn");
  if (!btn) return;
  const label = document.getElementById("nickname-btn-label");

  function getNickname() {
    return localStorage.getItem("murnova-nickname") || "";
  }
  function getFavorites() {
    try { return JSON.parse(localStorage.getItem("murnova-favorites") || "[]"); }
    catch (e) { return []; }
  }
  function setFavorites(list) {
    localStorage.setItem("murnova-favorites", JSON.stringify(list));
  }
  function refreshStars() {
    const favs = getFavorites();
    document.querySelectorAll(".favorite-star, .favorite-btn").forEach((el) => {
      el.classList.toggle("favorited", favs.includes(el.dataset.slug));
    });
  }
  function updateLabel() {
    const name = getNickname();
    label.textContent = name ? ("Senkron: " + name + " (değiştir)") : "Takma Ad ile Senkronla";
  }
  updateLabel();

  btn.addEventListener("click", function () {
    const current = getNickname();
    const name = window.prompt(
      "Bir takma ad gir — favorilerin/beğenilerin bu adı kullandığın her cihazda senkron olsun (hesap gerekmez):",
      current
    );
    if (name === null) return; // vazgeçildi
    const trimmed = name.trim();
    if (!trimmed) {
      localStorage.removeItem("murnova-nickname");
      updateLabel();
      return;
    }
    localStorage.setItem("murnova-nickname", trimmed);
    updateLabel();

    fetch("/takma-ad/senkron", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed, favorites: getFavorites() }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setFavorites(data.favorites);
          refreshStars();
        }
      })
      .catch(() => {});
  });

  // Favori butonlarına her basıldığında, takma ad ayarlıysa sunucuya da yaz.
  document.addEventListener("click", function (e) {
    const fbtn = e.target.closest(".favorite-star, .favorite-btn");
    if (!fbtn) return;
    const name = getNickname();
    if (!name) return;
    const slug = fbtn.dataset.slug;
    fetch("/takma-ad/favori/" + slug, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name }),
    }).catch(() => {});
  });
})();

// ---------- Native paylaşım (Web Share API destekleniyorsa) ----------
(function () {
  const shareBtn = document.querySelector(".native-share-btn");
  const copyBtn = document.querySelector(".copy-link-btn");
  if (!shareBtn) return;
  if (navigator.share) {
    shareBtn.style.display = "";
    if (copyBtn) copyBtn.style.display = "none";
    shareBtn.addEventListener("click", function () {
      navigator.share({
        title: shareBtn.dataset.title || document.title,
        text: shareBtn.dataset.text || "",
        url: shareBtn.dataset.url || window.location.href,
      }).catch(() => {});
    });
  }
})();

// ---------- Yorum beğenisi ----------
(function () {
  document.addEventListener("click", function (e) {
    const btn = e.target.closest(".comment-like-btn");
    if (!btn) return;
    const id = btn.dataset.commentId;
    fetch("/begen-yorum/" + id, { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        btn.classList.toggle("liked", data.liked);
        btn.querySelector(".like-num").textContent = data.count;
      })
      .catch(() => {});
  });
})();
