import { RouteError } from "./lib/numeric";
import express, { type Express } from "express";
import path from "node:path";
import fs from "node:fs";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import router from "./routes";
import { logger } from "./lib/logger";
import { collectDiagnostics } from "./lib/diagnostics";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Unauthenticated liveness check, deliberately mounted before Clerk/CORS/DB
// concerns so a misconfigured auth or database env var can never make the
// host platform's health check fail and kill an otherwise-fine deploy.
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Deeper, still-unauthenticated diagnostics: which env vars are present and
// whether the database and Clerk are actually reachable from this process.
// Mounted before Clerk/CORS/DB wiring for the same reason as /health — it has
// to answer even when that wiring is broken. Reports presence of secrets only,
// never their values.
const diagnosticsHandler = async (
  _req: express.Request,
  res: express.Response,
) => {
  const diagnostics = await collectDiagnostics();
  res.status(diagnostics.status === "ok" ? 200 : 503).json(diagnostics);
};
app.get("/diagnostics", diagnosticsHandler);
app.get("/api/diagnostics", diagnosticsHandler);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)
  .map((origin) => (origin.startsWith("http") ? origin : `https://${origin}`));

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      // Same-origin/non-browser requests (curl, health checks) send no Origin header.
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"));
    },
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Optional: serve the built frontend from this same process/origin.
//
// Set SERVE_STATIC_DIR to the frontend's built `dist/public` directory to
// run frontend + API as ONE deployed service on one URL — the simplest
// possible independent deployment (one process, no CORS config, no
// cross-origin cookie concerns for Clerk's session cookie). Leave it unset
// to run the API standalone (e.g. when the frontend is deployed separately,
// such as a Render static site or a different host entirely).
//
// Mounted BEFORE clerkMiddleware: serving the app's HTML/JS/CSS shell must
// never depend on Clerk's config being valid — the shell is what shows the
// user a sign-in screen (or a clear error) in the first place. Only the
// actual /api/* calls the loaded app makes need Clerk.
const staticDir = process.env.SERVE_STATIC_DIR;
if (staticDir) {
  const resolvedDir = path.resolve(staticDir);
  const indexHtmlPath = path.join(resolvedDir, "index.html");
  if (!fs.existsSync(indexHtmlPath)) {
    logger.warn(
      { staticDir: resolvedDir },
      "SERVE_STATIC_DIR is set but index.html was not found there — static serving disabled",
    );
  } else {
    app.use(express.static(resolvedDir));
  }
}

app.use(
  "/api",
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

app.use("/api", router);

// Central error handler: tenancy/role failures (and any other RouteError)
// become their intended HTTP status instead of a generic 500. Express 5
// forwards rejected promises from async handlers here automatically.
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    if (res.headersSent) {
      next(err);
      return;
    }
    if (err instanceof RouteError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    logger.error({ err }, "Unhandled API error");
    res.status(500).json({ error: "Internal server error" });
  },
);

// SPA fallback: any route that isn't an API call and didn't match a real
// static file (client-side routing paths like /app/billing, /sign-in) resolves to
// index.html so React Router can take over. Mounted last, after /api, so
// it never shadows a real API 404.
if (staticDir) {
  const resolvedDir = path.resolve(staticDir);
  const indexHtmlPath = path.join(resolvedDir, "index.html");
  if (fs.existsSync(indexHtmlPath)) {
    app.use((req, res, next) => {
      if (req.method === "GET" && !req.path.startsWith("/api")) {
        return res.sendFile(indexHtmlPath);
      }
      next();
    });
  }
}

export default app;
