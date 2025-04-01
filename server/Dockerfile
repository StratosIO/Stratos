FROM alpine:latest

WORKDIR /app

RUN apk add --no-cache ffmpeg

ARG target=linux-x64-musl
ARG version=1.2.8

RUN wget -q https://github.com/oven-sh/bun/releases/download/bun-v${version}/bun-${target}.zip \
    && unzip -j bun-${target}.zip -d /usr/local/bin && rm bun-${target}.zip \
    && chmod +x /usr/local/bin/bun

COPY package.json bun.lock .env .
RUN bun install

COPY src src

EXPOSE 3000

CMD ["bun", "run", "--watch", "src/index.ts"]
