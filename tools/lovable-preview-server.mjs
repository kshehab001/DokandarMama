// Lovable's sandbox preview cannot run this repo: Dokandar Mama is a pnpm
// monorepo with an Express API server, Clerk auth and a Postgres/Drizzle
// database, and it is built + deployed on Render (see render.yaml / Dockerfile).
// This tiny static server only exists so the sandbox has something healthy on
// the preview port. It is not part of the app and is not deployed anywhere.
import { createServer } from "node:http";

const port = Number(process.env.PORT) || 8080;
const html = `<!doctype html><html lang="bn"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Dokandar Mama — source workspace</title>
<style>
  :root { color-scheme: light }
  body { margin:0; min-height:100vh; display:grid; place-items:center;
    background:hsl(35 25% 97%); color:hsl(20 40% 15%);
    font-family: system-ui, -apple-system, sans-serif; padding:24px }
  .card { max-width:34rem; background:#fff; border:1px solid hsl(20 20% 88%);
    border-radius:1rem; padding:1.75rem; box-shadow:0 10px 30px -20px hsl(20 40% 15% / .4) }
  h1 { margin:0 0 .25rem; font-size:1.35rem; color:hsl(15 85% 50%) }
  p { line-height:1.6; color:hsl(20 20% 35%) }
  code { background:hsl(35 25% 95%); padding:.15rem .35rem; border-radius:.35rem; font-size:.9em }
</style></head><body><div class="card">
<h1>দোকানদার মামা — source workspace</h1>
<p>This project holds the Dokandar Mama monorepo (React + Vite frontend,
Express API, Drizzle/Postgres, Clerk auth). It runs on Render, not in this
sandbox preview.</p>
<p>To run it locally: <code>pnpm install</code>, then
<code>pnpm --filter @workspace/db push</code>,
<code>pnpm --filter @workspace/api-server dev</code> and
<code>pnpm --filter @workspace/dokandar-mama dev</code> with
<code>DATABASE_URL</code> and the Clerk keys set.</p>
</div></body></html>`;

createServer((_req, res) => {
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(html);
}).listen(port, "0.0.0.0");
