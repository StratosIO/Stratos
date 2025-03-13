FROM python:3.9-alpine

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install system dependencies
RUN apk update && apk add --no-cache build-base cmake git

# Install and Make Whisper CLI
RUN git clone https://github.com/ggerganov/whisper.cpp.git
WORKDIR /app/whisper.cpp
RUN make

# Download Whisper model
WORKDIR /app
RUN mkdir -p models
RUN wget -O models/ggml-base.en.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin

# Copy application files
COPY app.py .

# Expose the Flask API port
EXPOSE 5001

CMD ["python", "app.py"]