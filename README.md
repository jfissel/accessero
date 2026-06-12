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

## Deploy

Hosted on **Cloudflare Pages** at [accessero.com](https://accessero.com).
Pushing to `main` triggers a deploy automatically (no build step — the repo
root is served as-is).

All asset paths are relative, so the site also works under a subpath.

## Notes

- Honors `prefers-reduced-motion` — all parallax, loaders, and reveals collapse
  to static rendering.
- Magnetic buttons and card tilt only activate on fine pointers (mouse/trackpad).
