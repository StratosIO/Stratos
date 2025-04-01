# Stage 1: Build web

FROM alpine:latest AS web

ARG target=linux-x64-musl
ARG version=1.2.8

WORKDIR /web

RUN apk add --no-cache libstdc++

RUN wget -q https://github.com/oven-sh/bun/releases/download/bun-v${version}/bun-${target}.zip \
    && unzip -j bun-${target}.zip -d /usr/local/bin && rm bun-${target}.zip \
    && chmod +x /usr/local/bin/bun

COPY web .

RUN bun install && bun run build


# Stage 2: Build server

FROM alpine:latest AS server

ARG target=linux-x64-musl
ARG version=1.2.8

WORKDIR /app

RUN apk add --no-cache ffmpeg

RUN wget -q https://github.com/oven-sh/bun/releases/download/bun-v${version}/bun-${target}.zip \
    && unzip -j bun-${target}.zip -d /usr/local/bin && rm bun-${target}.zip \
    && chmod +x /usr/local/bin/bun

COPY server/package.json server/.env .
COPY --from=web /web/build dist

RUN bun install

COPY server/src src

EXPOSE 3000

CMD ["bun", "run", "--watch", "src/index.ts"]
