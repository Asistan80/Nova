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
