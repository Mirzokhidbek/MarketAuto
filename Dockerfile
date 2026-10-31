# Backend image (API or batch). Build: docker build --build-arg APP=nestar-api -t marketauto-api .
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG APP=nestar-api
RUN npx nest build ${APP}

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
ARG APP=nestar-api
ENV APP=${APP}
COPY --from=build /app/dist ./dist
# one-off tools (e.g. docker compose exec api node scripts/create-admin.mjs ...)
COPY scripts ./scripts
# local image storage (mount a volume, or set S3_BUCKET to use S3)
RUN mkdir -p uploads && chown -R node:node /app
USER node
EXPOSE 3007
CMD node dist/apps/${APP}/main
