# Combined single-container build for Dokandar Mama: builds the frontend and
# the API in one image, then runs the API server which also serves the
# built frontend (via SERVE_STATIC_DIR) — one container, one process, one
# port. Alternative to the Render Blueprint (render.yaml) for anyone
# self-hosting on their own VPS, Railway, Fly.io, etc.
#
# Build:  docker build -t dokandar-mama --build-arg VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxx .
# Run:    docker run -p 5000:5000 --env-file .env dokandar-mama
#
# NOTE: VITE_CLERK_PUBLISHABLE_KEY is baked into the frontend bundle at BUILD
# time (that's how Vite env vars work), so it must be passed as a
# --build-arg, not just a runtime -e/--env-file variable.

FROM node:22-slim AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.17.0 --activate

# Copy the whole workspace (pnpm workspaces need the full tree to resolve
# internal package links) and install once for all packages.
COPY . .
RUN pnpm install --frozen-lockfile

ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=${VITE_CLERK_PUBLISHABLE_KEY}

RUN pnpm --filter @workspace/api-server... run build \
 && pnpm --filter @workspace/dokandar-mama run build

# --- Runtime image: only what's needed to run the built server ---
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV SERVE_STATIC_DIR=/app/frontend-dist

COPY --from=build /app/artifacts/api-server/dist ./server
COPY --from=build /app/artifacts/dokandar-mama/dist/public ./frontend-dist

EXPOSE 5000
CMD ["node", "--enable-source-maps", "server/index.mjs"]
