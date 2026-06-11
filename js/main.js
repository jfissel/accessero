/* accessero — interactions
   Parallax, split-text reveals, counters, marquee fill, nav.
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
          if (child.tagName === "EM") {
            // Keep ems whole: their background-clip:text gradients go
            // invisible when the text sits inside transformed descendants,
            // so the em reveals as a single unit instead of per word.
            const w = document.createElement("span");
            w.className = "w";
            const inner = document.createElement("i");
            node.replaceChild(w, child);
            w.appendChild(inner);
            inner.appendChild(child);
          } else {
            walk(child);
          }
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
    menu.inert = !open;
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.style.overflow = open ? "hidden" : "";
    if (open) menu.querySelector("a").focus({ preventScroll: true });
    else if (menu.contains(document.activeElement)) burger.focus({ preventScroll: true });
  };
  burger.addEventListener("click", () => setMenu(!menuOpen));
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menuOpen) setMenu(false);
  });

  /* ---------- Marquee: clone the authored line until the loop can't gap ----------
     The keyframe shifts one copy width per cycle, so the other (copies - 1)
     spans must cover the viewport or a blank gap slides in before the wrap. */
  const marqueeTrack = document.querySelector("[data-marquee]");
  if (marqueeTrack) {
    const fillMarquee = () => {
      const spanW = marqueeTrack.firstElementChild.getBoundingClientRect().width;
      if (!spanW) return;
      const needed = Math.ceil(window.innerWidth / spanW) + 1;
      while (marqueeTrack.children.length < needed) {
        marqueeTrack.appendChild(marqueeTrack.firstElementChild.cloneNode(true));
      }
      marqueeTrack.style.setProperty("--marquee-copies", marqueeTrack.children.length);
    };
    fillMarquee();
    document.fonts.ready.then(fillMarquee);
    window.addEventListener("resize", fillMarquee);
  }

  /* ---------- Park ambient loops while their section is off-screen ---------- */
  const offstageIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => e.target.classList.toggle("is-offstage", !e.isIntersecting));
  });
  document.querySelectorAll(".marquee, .cta").forEach((el) => offstageIO.observe(el));

  /* ---------- Scenes: list rows swap the section backdrop ---------- */
  const sceneRows = [...document.querySelectorAll("[data-scene]")];
  const sceneBgs = [...document.querySelectorAll("[data-scene-bg]")];
  if (sceneRows.length) {
    const setScene = (name) => {
      sceneRows.forEach((row) => {
        const active = row.dataset.scene === name;
        row.classList.toggle("is-active", active);
        row.setAttribute("aria-pressed", String(active));
      });
      sceneBgs.forEach((bg) => bg.classList.toggle("is-active", bg.dataset.sceneBg === name));
    };
    sceneRows.forEach((row) => {
      row.addEventListener("mouseenter", () => setScene(row.dataset.scene));
      row.addEventListener("focusin", () => setScene(row.dataset.scene));
      row.addEventListener("click", () => setScene(row.dataset.scene));
      row.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setScene(row.dataset.scene);
        }
      });
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

  /* ---------- Waitlist form ---------- */
  const form = document.querySelector(".cta__form");
  if (form) {
    const status = document.getElementById("formStatus");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const btn = form.querySelector("button span");
      const input = form.querySelector("input");
      if (!input.value || !input.checkValidity()) return;
      btn.textContent = "You’re on the list ✓";
      if (status) status.textContent = "You’re on the waitlist. Talk soon.";
      input.value = "";
      input.placeholder = "Talk soon.";
      setTimeout(() => (btn.textContent = "Join the waitlist"), 4000);
    });
  }
})();
