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
    const btn = e.target.closest(".theme-toggle");
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
  if (!document.body.dataset.detailPage) return;
  let visited = JSON.parse(localStorage.getItem("murnova-visited") || "[]");
  const slug = document.body.dataset.detailPage;
  if (!visited.includes(slug)) visited.push(slug);
  localStorage.setItem("murnova-visited", JSON.stringify(visited));

  const milestones = { 1: "İlk keşif! 🎉", 3: "3 farklı içerik denedin 🔥", 5: "5 kartuş keşfettin ⭐", 10: "Gerçek bir kaşifsin 🏆" };
  const count = visited.length;
  if (milestones[count] && !sessionStorage.getItem("badge-" + count)) {
    sessionStorage.setItem("badge-" + count, "1");
    const toast = document.createElement("div");
    toast.className = "badge-toast";
    toast.textContent = milestones[count];
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
