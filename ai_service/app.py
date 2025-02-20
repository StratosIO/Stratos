from flask import Flask, request, jsonify
import os
import subprocess

UPLOAD_FOLDER = "/app/uploads"
WHISPER_MODEL = "/app/models/ggml-base.en.bin"
WHISPER_BIN = "/app/whisper.cpp/build/bin/whisper-cli"

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/transcribe", methods=["POST"])
def transcribe():
    if "audio" not in request.files:
        return jsonify({"error" : "No audio file provided"}), 400
    
    audio_file = request.files["audio"]
    file_path = os.path.join(app.config["UPLOAD_FOLDER"], audio_file.filename)
    audio_file.save(file_path)

    try:
        result = subprocess.run(
            [WHISPER_BIN, "-m", WHISPER_MODEL, "-f", file_path],
            capture_output=True,
            text=True,
            check=True,
        )
        return jsonify({"transcription": result.stdout.strip()})
    except subprocess.CalledProcessError as e:
        return jsonify({"error": "Error processing transcription", "details": str(e)}), 500
    
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True) 