FROM docker.io/oven/bun:1.2.4

# Install FFmpeg with more resilient approach
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json bun.lock ./
RUN bun install
RUN bun add -d tsx
COPY . .

EXPOSE 3000
CMD ["bun", "run", "--watch", "src/index.ts"] 
