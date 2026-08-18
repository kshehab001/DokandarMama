# Deploying Dokandar Mama — independently, no Replit

This guide gets Dokandar Mama live on the public internet, on your own
infrastructure, with no Replit branding or dependency anywhere. The
recommended path (Render) gets you to **one click** after about 10 minutes
of one-time account setup. A self-hosted Docker path is included at the end
for anyone who'd rather run it on their own VPS.

## What you're deploying

One combined web service (the Express API also serves the built React
frontend from the same URL — no CORS setup, no second domain, no
cross-origin cookie issues with Clerk's session cookie) plus one managed
Postgres database. This is defined declaratively in `render.yaml` at the
repo root.

---

## Part 1 — One-time account setup (~10 minutes)

You need three free accounts. No AI can create these or enter your payment
details for you — this is the one part you have to click through yourself.

1. **GitHub** (if you don't have one): https://github.com/signup
2. **Clerk** (handles login/signup for your shopkeepers):
   https://dashboard.clerk.com/sign-up
   - Create an application (any name, e.g. "Dokandar Mama")
   - Go to **Configure → API Keys** and keep that tab open — you'll need
     the **Publishable key** and **Secret key** in Part 3.
3. **Render** (hosting): https://dashboard.render.com/register — sign up
   with your GitHub account so Render can access your repo directly.

## Part 2 — Push the code to your own GitHub repo

From the project folder (the one containing `render.yaml`, `package.json`, etc.):

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create dokandar-mama --private --source=. --push
```

(No `gh` CLI? Create an empty repo at https://github.com/new, then:
`git remote add origin <your-repo-url> && git branch -M main && git push -u origin main`)

## Part 3 — Deploy the Blueprint (the one-click part)

1. Go to https://dashboard.render.com/blueprints and click **New Blueprint Instance**.
2. Select the GitHub repo you just pushed. Render will detect `render.yaml` automatically.
3. Render shows you the two resources it's about to create (the database
   and the web service) and asks for the environment variables marked
   `sync: false`. Fill in:
   - `CLERK_SECRET_KEY` — from the Clerk dashboard tab you kept open
   - `CLERK_PUBLISHABLE_KEY` — same page
   - `VITE_CLERK_PUBLISHABLE_KEY` — the **same value** as `CLERK_PUBLISHABLE_KEY`
   - `CORS_ALLOWED_ORIGINS` — leave this blank (only needed if you later split the frontend to a separate host)
4. Click **Apply**.

That's it — Render now provisions the Postgres database, runs the build
(which installs dependencies, builds the frontend, builds the API, and runs
the database schema push so your tables exist from the first deploy), and
starts the service. First deploy takes 5–10 minutes; watch the logs in the
Render dashboard.

When it finishes, Render gives you a URL like
`https://dokandar-mama.onrender.com` — that's your live app, frontend and
API both served from it.

### Free-tier note

The `render.yaml` in this repo uses Render's free plan for both the web
service and the database, so you can try this at zero cost. Render's free
web services spin down after 15 minutes of inactivity and take ~30-60
seconds to wake back up on the next request, and the free Postgres database
expires after 30 days unless upgraded. For a real shop depending on this
daily, upgrade both to a paid plan in the Render dashboard once you're
happy with it (Settings → change plan) — no code or config changes needed.

## Part 4 — After first deploy

- **Test it**: open the URL, sign up as a shopkeeper, add a product, make a
  sale, try the voice assistant.
- **Custom domain** (optional): Render → your service → Settings → Custom
  Domains → add your domain and follow the DNS instructions shown. Then, in
  your Clerk dashboard, add that same domain under **Configure → Domains**
  so Clerk's session cookies work on it.
- **Re-deploying after code changes**: just `git push` to `main` — Render
  redeploys automatically (including re-running the database schema push,
  so schema changes you make later go out automatically too).

---

## Alternative: self-hosting with Docker (VPS, Fly.io, Railway, etc.)

A combined `Dockerfile` is included at the repo root, building the same
single-service setup as the Render path.

```bash
docker build -t dokandar-mama \
  --build-arg VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxx .

docker run -p 5000:5000 \
  -e DATABASE_URL=postgres://user:pass@your-db-host:5432/dokandar_mama \
  -e CLERK_SECRET_KEY=sk_live_xxx \
  -e CLERK_PUBLISHABLE_KEY=pk_live_xxx \
  -e NODE_ENV=production \
  dokandar-mama
```

You'll need your own Postgres instance reachable from wherever the
container runs (a managed one from Neon, Supabase, or your VPS provider all
work — anything that gives you a `DATABASE_URL`). Before first run, push
the schema once:

```bash
DATABASE_URL=postgres://... pnpm --filter @workspace/db run push
```

This Dockerfile hasn't been run through an actual `docker build` in this
environment (no Docker available here) — it mirrors the exact build
commands (`pnpm install`, `pnpm --filter ... run build`) that were verified
directly, so it should work, but test it locally before trusting it in
production.

---

## Housekeeping: what to ignore in this repo

- `.local/` and `.agents/` — Replit's own agent tooling metadata, not part
  of the shipped app. Safe to delete, or just leave — nothing references
  them.
- `artifacts/mockup-sandbox/` — a Replit design-scratch workspace, unrelated
  to the deployed product. Not built or deployed by `render.yaml` or the
  `Dockerfile`.
- The root `@replit/connectors-sdk` dependency in `package.json` is unused
  by the app code — safe to remove, harmless to leave.

## Troubleshooting

- **Build fails on Render**: check the build logs for the failing
  `pnpm --filter` step; the three build steps (api-server build, frontend
  build, db push) run in sequence, so the log tells you which one failed.
- **Sign-up/sign-in doesn't work after deploy**: double-check
  `VITE_CLERK_PUBLISHABLE_KEY` matches `CLERK_PUBLISHABLE_KEY` exactly, and
  that you used the **live** keys (not test keys) if this is a real
  production deployment — Clerk test keys only work on `localhost` and a
  few preview domains.
- **"relation does not exist" errors from the API**: the database push step
  didn't run or failed. Check the build logs for the
  `pnpm --filter @workspace/db run push-force` step, or run it manually
  once against your production `DATABASE_URL`.
