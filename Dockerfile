# --- Build: Nuxt statisch generieren (SSG) ---
FROM oven/bun:latest AS build-stage

WORKDIR /app

# Abhängigkeiten zuerst (besseres Layer-Caching)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Quellcode + statische Generierung
COPY . .
RUN bun run generate

# --- Serve: statisches Output via nginx ---
FROM nginx:stable-alpine AS production-stage
COPY --from=build-stage /app/.output/public /usr/share/nginx/html
COPY ./nginx-default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
