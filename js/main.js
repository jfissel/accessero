/* accessero — interactions
   Parallax, split-text reveals, counters, magnetic buttons, nav.
   No dependencies; everything degrades gracefully. */

(() => {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isFinePointer = window.matchMedia("(pointer: fine)").matches;

  /* ---------- Loader ---------- */
  const loader = document.getElementById("loader");
  const finishLoad = () => {
    document.body.classList.add("is-loaded");
    if (loader) loader.classList.add("is-done");
  };
  if (prefersReduced) {
    finishLoad();
  } else {
    // Let the wordmark animation play, but never block longer than 1.6s.
    window.addEventListener("load", () => setTimeout(finishLoad, 600));
    setTimeout(finishLoad, 1600);
  }

  /* ---------- Split text into word spans ---------- */
  document.querySelectorAll("[data-split]").forEach((el) => {
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(" "));
            } else {
              const w = document.createElement("span");
              w.className = "w";
              const inner = document.createElement("i");
              inner.textContent = part;
              w.appendChild(inner);
              frag.appendChild(w);
            }
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child);
        }
      });
    };
    walk(el);
    el.querySelectorAll(".w > i").forEach((w, i) => w.style.setProperty("--wi", i));
  });

  /* ---------- Reveal on scroll ---------- */
  const revealIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealIO.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -6% 0px" }
  );
  document.querySelectorAll("[data-reveal], [data-split]").forEach((el) => revealIO.observe(el));

  /* ---------- Counters ---------- */
  const countIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        countIO.unobserve(el);
        const target = parseInt(el.dataset.count, 10) || 0;
        if (prefersReduced || target === 0) {
          el.textContent = target;
          return;
        }
        const dur = 1400;
        const start = performance.now();
        const easeOut = (t) => 1 - Math.pow(1 - t, 4);
        const tick = (now) => {
          const p = Math.min((now - start) / dur, 1);
          el.textContent = Math.round(easeOut(p) * target);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    },
    { threshold: 0.6 }
  );
  document.querySelectorAll("[data-count]").forEach((el) => countIO.observe(el));

  /* ---------- Parallax engine ----------
     data-parallax: whole-layer drift relative to viewport center.
     data-parallax-img: image drifts inside its clipped frame. */
  const parallaxEls = [...document.querySelectorAll("[data-parallax]")];
  const parallaxImgs = [...document.querySelectorAll("[data-parallax-img]")];
  let ticking = false;

  const updateParallax = () => {
    ticking = false;
    const vh = window.innerHeight;

    parallaxEls.forEach((el) => {
      const host = el.parentElement;
      const rect = host.getBoundingClientRect();
      if (rect.bottom < -vh || rect.top > vh * 2) return;
      const center = rect.top + rect.height / 2 - vh / 2;
      const speed = parseFloat(el.dataset.parallax) || 0;
      el.style.transform = `translate3d(0, ${(-center * speed).toFixed(1)}px, 0)`;
    });

    parallaxImgs.forEach((frame) => {
      const img = frame.tagName === "IMG" ? frame : frame.querySelector("img");
      const rect = frame.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > vh) return;
      const progress = (rect.top + rect.height / 2 - vh / 2) / (vh / 2 + rect.height / 2);
      const speed = parseFloat(frame.dataset.parallaxImg) || 0.12;
      const shift = progress * speed * rect.height;
      (img || frame).style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0)`;
    });
  };

  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateParallax);
    }
  };

  if (!prefersReduced) {
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    updateParallax();
  }

  /* ---------- Scroll progress + nav state ---------- */
  const progressBar = document.getElementById("progressBar");
  const nav = document.getElementById("nav");
  let lastY = window.scrollY;

  window.addEventListener(
    "scroll",
    () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (progressBar) progressBar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

      nav.classList.toggle("is-scrolled", y > 40);
      // Hide on scroll down, show on scroll up — but never near the top.
      if (y > 300 && y > lastY + 4 && !menuOpen) nav.classList.add("is-hidden");
      else if (y < lastY - 4 || y <= 300) nav.classList.remove("is-hidden");
      lastY = y;
    },
    { passive: true }
  );

  /* ---------- Mobile menu ---------- */
  const burger = document.getElementById("burger");
  const menu = document.getElementById("menu");
  let menuOpen = false;

  const setMenu = (open) => {
    menuOpen = open;
    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", String(!open));
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.style.overflow = open ? "hidden" : "";
  };
  burger.addEventListener("click", () => setMenu(!menuOpen));
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menuOpen) setMenu(false);
  });

  /* ---------- Magnetic buttons (fine pointers only) ---------- */
  if (isFinePointer && !prefersReduced) {
    document.querySelectorAll(".magnetic").forEach((el) => {
      const strength = 0.22;
      // Cache the rect on enter: reading it on every move creates a feedback
      // loop (the transform shifts the rect, which shifts the transform).
      let rect = null;
      el.addEventListener("mouseenter", () => {
        rect = el.getBoundingClientRect();
        el.style.transition = "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)";
      });
      el.addEventListener("mousemove", (e) => {
        if (!rect) return;
        const x = (e.clientX - rect.left - rect.width / 2) * strength;
        const y = (e.clientY - rect.top - rect.height / 2) * strength;
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      });
      el.addEventListener("mouseleave", () => {
        rect = null;
        el.style.transition = "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)";
        el.style.transform = "";
      });
    });
  }

  /* ---------- Scenes: list rows swap the section backdrop ---------- */
  const sceneRows = [...document.querySelectorAll("[data-scene]")];
  const sceneBgs = [...document.querySelectorAll("[data-scene-bg]")];
  if (sceneRows.length) {
    const setScene = (name) => {
      sceneRows.forEach((row) => row.classList.toggle("is-active", row.dataset.scene === name));
      sceneBgs.forEach((bg) => bg.classList.toggle("is-active", bg.dataset.sceneBg === name));
    };
    sceneRows.forEach((row) => {
      row.addEventListener("mouseenter", () => setScene(row.dataset.scene));
      row.addEventListener("focusin", () => setScene(row.dataset.scene));
      row.addEventListener("click", () => setScene(row.dataset.scene));
    });
    if (!isFinePointer && !prefersReduced) {
      // No hover on touch: run the scenes as a slow rotation while the
      // section is on screen. A tap picks a scene and restarts the clock.
      let idx = 0;
      let timer = null;
      const start = () => {
        if (timer) return;
        timer = setInterval(() => {
          idx = (idx + 1) % sceneRows.length;
          setScene(sceneRows[idx].dataset.scene);
        }, 3400);
      };
      const stop = () => {
        clearInterval(timer);
        timer = null;
      };
      new IntersectionObserver(
        (entries) => entries.forEach((e) => (e.isIntersecting ? start() : stop())),
        { threshold: 0.3 }
      ).observe(document.querySelector(".scenes"));
      sceneRows.forEach((row, i) => {
        row.addEventListener("click", () => {
          idx = i;
          stop();
          start();
        });
      });
    }
  }

  /* ---------- Cursor accent (fine pointers only) ---------- */
  if (isFinePointer && !prefersReduced) {
    const dot = document.createElement("div");
    dot.className = "cursor";
    document.body.appendChild(dot);
    let tx = -100, ty = -100, cx = -100, cy = -100, visible = false;
    window.addEventListener("mousemove", (e) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!visible) {
        visible = true;
        dot.style.opacity = "1";
      }
    }, { passive: true });
    document.documentElement.addEventListener("mouseleave", () => {
      visible = false;
      dot.style.opacity = "0";
    });
    const trail = () => {
      cx += (tx - cx) * 0.22;
      cy += (ty - cy) * 0.22;
      dot.style.transform = `translate(${cx.toFixed(1)}px, ${cy.toFixed(1)}px)`;
      requestAnimationFrame(trail);
    };
    requestAnimationFrame(trail);
    // Delegate hover state from the document: per-element enter/leave
    // listeners fire in rapid bursts across dense areas like the nav.
    document.addEventListener("mouseover", (e) => {
      dot.classList.toggle("is-on", !!e.target.closest("a, button, input, .scene"));
    }, { passive: true });
  }

  /* ---------- Waitlist form ---------- */
  const form = document.querySelector(".cta__form");
  if (form) {
    form.addEventListener("submit", () => {
      const btn = form.querySelector("button span");
      const input = form.querySelector("input");
      if (!input.value || !input.checkValidity()) return;
      btn.textContent = "You’re on the list ✓";
      input.value = "";
      input.placeholder = "Talk soon.";
      setTimeout(() => (btn.textContent = "Join the waitlist"), 4000);
    });
  }
})();
