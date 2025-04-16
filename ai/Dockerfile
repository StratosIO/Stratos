# FROM python:3.9-slim
FROM nvidia/cuda:11.8.0-devel-ubuntu22.04

WORKDIR /app

RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    && rm -f /usr/bin/python /usr/bin/pip \
    && ln -s /usr/bin/python3 /usr/bin/python \
    && ln -s /usr/bin/pip3 /usr/bin/pip

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install FFmpeg and its dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    build-essential \
    cmake \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install and Make Whisper CLI
RUN git clone https://github.com/ggerganov/whisper.cpp.git
WORKDIR /app/whisper.cpp
RUN make

WORKDIR /app
RUN mkdir -p models

# Download Whisper model
RUN wget -O models/ggml-base.en.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin

# Download SuperSloMo checkpoint from Google Drive
RUN gdown --id 1IvobLDbRiBgZr3ryCRrWL8xDbMZ-KnpF -O models/SuperSloMo.ckpt

# Copy application files
COPY app.py .

# Copy all slowmo files
COPY slowmo_scripts/ slowmo_scripts/

# Expose the Flask API port
EXPOSE 5001

CMD ["python", "app.py"]