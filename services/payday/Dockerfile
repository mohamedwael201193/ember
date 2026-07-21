FROM node:24-bookworm-slim AS build
WORKDIR /workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY services/payday ./services/payday
RUN corepack enable && pnpm install --frozen-lockfile && pnpm --filter @ember/payday build

FROM node:24-bookworm-slim
WORKDIR /app
COPY --from=build /workspace/services/payday/dist ./dist
USER node
CMD ["node", "dist/main.js"]
