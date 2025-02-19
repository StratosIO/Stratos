FROM oven/bun:latest
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install
RUN bun add -d tsx
COPY . .
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    gcc \
    g++ \
    wget \
    git \
    ffmpeg
RUN mkdir -p /app/uploads
RUN git clone https://github.com/ggerganov/whisper.cpp.git && \
    cd whisper.cpp && \
    make
RUN cd whisper.cpp/models && ./download-ggml-model.sh base.en
EXPOSE 3000
CMD ["bun", "run", "--watch", "src/index.ts"] 
