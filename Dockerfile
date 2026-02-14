FROM node:22-bookworm

# Install Bun (required for build scripts)
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

RUN corepack enable

WORKDIR /app

ARG OPENCLAW_DOCKER_APT_PACKAGES=""
RUN if [ -n "$OPENCLAW_DOCKER_APT_PACKAGES" ]; then \
  apt-get update && \
  DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends $OPENCLAW_DOCKER_APT_PACKAGES && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*; \
  fi

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY patches ./patches
COPY scripts ./scripts

RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
# Force pnpm for UI build (Bun may fail on ARM/Synology architectures)
ENV OPENCLAW_PREFER_PNPM=1
RUN pnpm ui:build

ENV NODE_ENV=production

# Allow non-root user to write temp files during runtime/tests.
RUN chown -R node:node /app

# Pre-seed ACEE Agent workspace (identity, soul, user profile)
RUN mkdir -p /data/workspace && chown -R node:node /data

# Security hardening: Run as non-root user
# The node:22-bookworm image includes a 'node' user (uid 1000)
# This reduces the attack surface by preventing container escape via root privileges
USER node

# Default port for Render / Cloud Run (overridable via PORT env var).
ENV PORT=10000
EXPOSE $PORT

# Bundle deploy config for headless environments (sets Gemini as default LLM)
COPY deploy/openpoi.json /app/deploy/openpoi.json
ENV OPENCLAW_CONFIG_PATH=/app/deploy/openpoi.json

# Copy ACEE Agent workspace files into the image
COPY --chown=node:node deploy/workspace/ /data/workspace/

# Copy seed script + knowledge into /app/ (outside persistent disk)
# so seed-knowledge.sh can sync to /data/workspace/knowledge/ at startup
COPY --chown=node:node deploy/seed-knowledge.sh /app/deploy/seed-knowledge.sh
RUN chmod +x /app/deploy/seed-knowledge.sh
COPY --chown=node:node deploy/workspace/knowledge/ /app/deploy/workspace/knowledge/

# Start gateway server.
# 1. Seed knowledge from image → persistent disk (version-aware, fail-fast)
# 2. --bind lan: listen on 0.0.0.0 so the container platform can route traffic.
# 3. --allow-unconfigured: skip onboarding wizard in headless environments.
CMD ["bash", "-c", "/app/deploy/seed-knowledge.sh && node openclaw.mjs gateway --allow-unconfigured --bind lan --port ${PORT}"]
