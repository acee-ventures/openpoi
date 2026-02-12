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
RUN OPENCLAW_A2UI_SKIP_MISSING=1 pnpm build
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

# Start gateway server.
# --bind lan: listen on 0.0.0.0 so the container platform can route traffic.
# --allow-unconfigured: skip onboarding wizard in headless environments.
CMD ["sh", "-c", "node openclaw.mjs gateway --allow-unconfigured --bind lan --port ${PORT}"]
