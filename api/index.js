import app from "../artifacts/api-server/dist/index.mjs";

export default function handler(req, res) {
  // Ensure the URL matches Express route prefix whether Vercel stripped /api or not
  if (req.url && !req.url.startsWith("/api") && !req.url.startsWith("/health") && !req.url.startsWith("/diagnostics")) {
    req.url = `/api${req.url}`;
  }
  return app(req, res);
}

