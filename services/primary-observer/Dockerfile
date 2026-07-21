FROM node:24-bookworm-slim AS build
WORKDIR /workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY services/primary-observer ./services/primary-observer
RUN corepack enable && pnpm install --frozen-lockfile && pnpm --filter @ember/primary-observer build

FROM node:24-bookworm-slim
WORKDIR /app
COPY --from=build /workspace/services/primary-observer/dist ./dist
USER node
CMD ["node", "dist/main.js"]
