# accessero

**Power, perfected.** A cinematic single-page site for accessero, a
technology accessory company focused on charging products.

Pure static HTML/CSS/JS — no build step, no dependencies.

## Structure

```
index.html        # single page, five acts: hero → craft → products → design → specs/cta
css/styles.css    # design system, parallax layers, reveal choreography, responsive
js/main.js        # parallax engine, split-text reveals, counters, magnetic buttons, nav
assets/           # brand imagery
```

## Run locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy to GitHub Pages

1. Push to `main`.
2. Repo **Settings → Pages → Source**: deploy from branch `main`, folder `/ (root)`.

All asset paths are relative, so the site works both at a custom domain and at
`username.github.io/accessero/`.

## Notes

- Honors `prefers-reduced-motion` — all parallax, loaders, and reveals collapse
  to static rendering.
- Magnetic buttons and card tilt only activate on fine pointers (mouse/trackpad).
