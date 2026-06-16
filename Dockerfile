FROM node:22-alpine AS frontend-build

WORKDIR /app
COPY package.json package-lock.json* ./
COPY src/shared/package.json src/shared/
COPY src/frontend/package.json src/frontend/
COPY src/backend/package.json src/backend/

RUN npm install --include-workspace-root

COPY tsconfig.json ./
COPY src/shared/ src/shared/
COPY src/frontend/ src/frontend/

WORKDIR /app/src/shared
RUN npm run build

WORKDIR /app/src/frontend
RUN npm run build

FROM node:22-alpine AS backend-build

WORKDIR /app
COPY package.json package-lock.json* ./
COPY src/shared/package.json src/shared/
COPY src/backend/package.json src/backend/

RUN npm install --include-workspace-root

COPY tsconfig.json ./
COPY src/shared/ src/shared/
COPY --from=frontend-build /app/src/shared/dist /app/src/shared/dist
COPY src/backend/ src/backend/
COPY --from=frontend-build /app/src/frontend/dist /app/src/frontend/dist

WORKDIR /app/src/backend
RUN npm run build

FROM node:22-alpine

RUN apk add --no-cache ffmpeg su-exec

ENV PUID=1000
ENV PGID=1000
ENV NODE_ENV=production

WORKDIR /app

COPY package.json package-lock.json* ./
COPY src/shared/package.json src/shared/
COPY src/backend/package.json src/backend/

RUN npm install --include-workspace-root --omit=dev

COPY --from=backend-build /app/src/backend/dist /app/src/backend/dist
COPY --from=backend-build /app/src/shared/dist /app/src/shared/dist
COPY --from=backend-build /app/src/frontend/dist /app/src/frontend/dist

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
