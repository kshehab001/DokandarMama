import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"] || "10000";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const host = process.env["HOST"] || "0.0.0.0";

const server = app.listen(port, host, () => {
  logger.info({ port, host }, `Server listening on ${host}:${port}`);
});

server.on("error", (err) => {
  logger.error({ err }, "Error listening on port");
  process.exit(1);
});

