# LEDGER_OS

A personal daily habit, task & money tracker. Fully static — no build step, no server, no account. Your data is saved in your browser's localStorage and stays on your machine.

Built with: vanilla HTML/CSS/JS · Chakra Petch + IBM Plex Mono · terminal / night-ops "operating system" aesthetic with scanlines and LED accents.

## Files

```
index.html        page structure
css/styles.css    all styling + 3 themes (Night / Ember / Ocean)
js/store.js       data model, localStorage
js/theme.js       theme switching + name onboarding
js/money.js       money ledger logic
js/app.js         habits, stats, heatmap, rendering
```

## Features

- **First visit** asks for your callsign/name (shown in greeting + topbar, changeable anytime)
- **3 themes** — Night (lime), Ember (amber), Ocean (cyan) — remembers your choice
- Sticky topbar with date, theme switcher and name chip
- Hero "today" module with big completion % + progress bar
- KPI strip: net today, current streak, best streak, weekly & all-time checks
- Daily check-off grid (last 14 days) with stamp animation
- **Per-habit detail pages** — click any habit for full progress: current/best streak, total checks, completion rate, 12-week chart, 52-week history grid, goal stepper, rename & delete
- Habits with weekly goals and streak chips
- **Funds panel** — today's earning & spending, all-time earned/spent, 14-day net chart (click a bar to edit that day)
- 16-week activity heatmap
- Add / rename (double-click) / delete habits
- Export / import backup as JSON, or full reset
- Fully offline after first load (fonts via Google Fonts CDN)
- Responsive + reduced-motion friendly

## Run locally

Open `index.html` in any browser. No server needed.

## Cache-busting note

Every `css`/`js` link in `index.html` carries a `?v=N` query string. **Bump `N` on every code change** so browsers and GitHub Pages don't serve a stale cached file. There's a reminder comment in the HTML too.

## Host for free on GitHub Pages

1. Create a GitHub repo, e.g. `progress-tracker` (public or private — Pages works on public for free).
2. Push this folder to the repo:

```bash
git init
git add .
git commit -m "Add daily ledger"
git branch -M main
git remote add origin https://github.com/<your-username>/progress-tracker.git
git push -u origin main
```

3. On GitHub: **Settings → Pages** → Source: **Deploy from a branch** → branch `main` / `/ (root)` → **Save**.
4. Wait ~1 minute, then visit `https://<your-username>.github.io/progress-tracker/`.

## Tips

- Each user's data is stored in that browser only (localStorage). Export regularly if you clear cookies.
- To host under your own domain, add a `CNAME` file and point DNS in Pages settings.