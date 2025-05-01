# Stage 1: Build web
FROM oven/bun:alpine AS web

WORKDIR /web
COPY web .

RUN bun install && bun run build


# Stage 2: Build server
FROM oven/bun:alpine AS server

WORKDIR /app

RUN apk add --no-cache ffmpeg ttf-dejavu

COPY server/package.json .env .
COPY --from=web /web/build dist
COPY server/src src

RUN bun install

EXPOSE 3000

CMD ["bun", "run", "--watch", "src/index.ts"]
