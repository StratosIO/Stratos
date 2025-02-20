FROM python:3.9

WORKDIR /app

# Install Dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Whisper.cpp
RUN apt-get update && apt-get install -y build-essential cmake git wget ffmpeg
RUN git clone https://github.com/ggerganov/whisper.cpp.git
WORKDIR /app/whisper.cpp
RUN make

# Download Whisper model
WORKDIR /app
RUN mkdir -p models uploads
RUN wget -O models/ggml-base.en.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin

# Copy application files
COPY app.py .

# Expose the Flask API port
EXPOSE 5001

CMD ["python", "app.py"]