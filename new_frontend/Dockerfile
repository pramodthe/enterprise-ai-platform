# Build from repository root:
#   docker build -f new_frontend/Dockerfile \
#     --build-arg VITE_API_BASE=https://YOUR-API-SERVICE-URL.run.app \
#     -t enterprise-ai-ui .
#
# VITE_API_BASE: origin of the FastAPI service (no /api suffix). The app resolves /api paths.

FROM node:22-alpine AS build
WORKDIR /app

COPY new_frontend/package.json new_frontend/package-lock.json ./
RUN npm ci

COPY new_frontend/ ./
ARG VITE_API_BASE=
ENV VITE_API_BASE=${VITE_API_BASE}
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY deploy/gcp/frontend-entrypoint.sh /frontend-entrypoint.sh
RUN chmod +x /frontend-entrypoint.sh && \
    rm /etc/nginx/conf.d/default.conf 2>/dev/null || true

EXPOSE 8080
ENTRYPOINT ["/frontend-entrypoint.sh"]
