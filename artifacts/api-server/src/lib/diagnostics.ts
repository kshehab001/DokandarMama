import { logger } from "./logger";

type CheckStatus = "ok" | "error" | "not_configured";

export interface Check {
  status: CheckStatus;
  detail: string;
  latencyMs?: number;
}

export interface Diagnostics {
  status: "ok" | "degraded";
  timestamp: string;
  environment: {
    nodeEnv: string;
    nodeVersion: string;
    port: string;
    serveStaticDir: string;
    corsAllowedOrigins: string;
  };
  env: Record<string, boolean>;
  checks: {
    database: Check;
    clerk: Check;
  };
}

const REQUIRED_ENV = [
  "DATABASE_URL",
  "CLERK_SECRET_KEY",
  "CLERK_PUBLISHABLE_KEY",
  "PORT",
] as const;

async function checkDatabase(): Promise<Check> {
  if (!process.env.DATABASE_URL) {
    return { status: "not_configured", detail: "DATABASE_URL is not set" };
  }
  const startedAt = Date.now();
  try {
    // Imported lazily: @workspace/db throws at import time when DATABASE_URL
    // is missing, and this endpoint must stay usable in exactly that case.
    const { pool } = await import("@workspace/db");
    const result = await pool.query("select 1 as ok");
    return {
      status: result.rows.length === 1 ? "ok" : "error",
      detail:
        result.rows.length === 1
          ? "Connected and query succeeded"
          : "Unexpected query result",
      latencyMs: Date.now() - startedAt,
    };
  } catch (err) {
    logger.error({ err }, "Diagnostics: database check failed");
    return {
      status: "error",
      detail: err instanceof Error ? err.message : "Unknown database error",
      latencyMs: Date.now() - startedAt,
    };
  }
}

async function checkClerk(): Promise<Check> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    return { status: "not_configured", detail: "CLERK_SECRET_KEY is not set" };
  }
  if (!process.env.CLERK_PUBLISHABLE_KEY) {
    return {
      status: "error",
      detail:
        "CLERK_SECRET_KEY is set but CLERK_PUBLISHABLE_KEY is missing — the frontend cannot initialise Clerk",
    };
  }
  const startedAt = Date.now();
  try {
    const response = await fetch("https://api.clerk.com/v1/jwks", {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    if (!response.ok) {
      return {
        status: "error",
        detail: `Clerk API responded ${response.status} — the secret key is likely invalid or from a different instance`,
        latencyMs: Date.now() - startedAt,
      };
    }
    return {
      status: "ok",
      detail: "Clerk API reachable and secret key accepted",
      latencyMs: Date.now() - startedAt,
    };
  } catch (err) {
    logger.error({ err }, "Diagnostics: Clerk check failed");
    return {
      status: "error",
      detail: err instanceof Error ? err.message : "Unknown Clerk error",
      latencyMs: Date.now() - startedAt,
    };
  }
}

export async function collectDiagnostics(): Promise<Diagnostics> {
  const [database, clerk] = await Promise.all([checkDatabase(), checkClerk()]);

  const env: Record<string, boolean> = {};
  for (const name of REQUIRED_ENV) {
    env[name] = Boolean(process.env[name]);
  }

  const healthy = database.status === "ok" && clerk.status === "ok";

  return {
    status: healthy ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV ?? "(unset)",
      nodeVersion: process.version,
      port: process.env.PORT ?? "(unset)",
      serveStaticDir: process.env.SERVE_STATIC_DIR ?? "(unset)",
      corsAllowedOrigins: process.env.CORS_ALLOWED_ORIGINS ?? "(unset)",
    },
    env,
    checks: { database, clerk },
  };
}