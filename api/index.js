import app from "../artifacts/api-server/dist/index.mjs";

export default function handler(req, res) {
  const matchedPath = req.headers["x-matched-path"] || req.headers["x-vercel-matched-path"];
  if (matchedPath && (matchedPath.startsWith("/api") || matchedPath.startsWith("/diagnostics") || matchedPath.startsWith("/health"))) {
    const queryIdx = req.url.indexOf("?");
    const queryString = queryIdx >= 0 ? req.url.slice(queryIdx) : "";
    req.url = `${matchedPath}${queryString}`;
  } else if (req.url && !req.url.startsWith("/api") && !req.url.startsWith("/health") && !req.url.startsWith("/diagnostics")) {
    req.url = `/api${req.url}`;
  }
  return app(req, res);
}

