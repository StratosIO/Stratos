from flask import Flask, jsonify
import subprocess

WHISPER_BIN = "/app/whisper.cpp/build/bin/whisper-cli"
WHISPER_MODEL_BASE_EN = "/app/models/ggml-base.en.bin"

app = Flask(__name__)

@app.route("/transcribe/<file_path>/<options>", methods=["POST"])
def transcribe(file_path, options):

    file_path = file_path.replace("+", "/")
    base_name = file_path.split("/")[-1].replace("-audio.wav", "-transcript.txt")
    output_path = "/".join(file_path.split("/")[:-1]) + "/" + base_name
    options = options.split("-")

    try:
        result = subprocess.run(
            [WHISPER_BIN, "-m", WHISPER_MODEL_BASE_EN, "-f", file_path],
            capture_output=True,
            text=True,
            check=True,
        )
        # Write the output to a file
        with open(output_path, "w") as f:
            f.write(result.stdout.strip())

        return jsonify({"message": "Transcription completed"}), 200
    except subprocess.CalledProcessError as e:
        return jsonify({"error": str(e)}), 500

@app.route("/slowmo/<file_path>/<options>", methods=["POST"])
def slowmo(file_path, options):
    file_path = file_path.replace("+", "/")
    base_name = file_path.split("/")[-1].replace(".mp4", "-slowmo.mp4")
    output_path = "/".join(file_path.split("/")[:-1]) + "/" + base_name
    options = options.split("-")
    
    # Default speed factor is 0.5 (half speed)
    speed_factor = 0.5
    for option in options:
        if option.startswith("speed="):
            try:
                speed_factor = float(option.split("=")[1])
            except ValueError:
                return jsonify({"error": "Invalid speed factor"}), 400
    
    try:
        # Use FFmpeg to create slow motion effect
        # setpts filter adjusts the presentation timestamp of each frame
        result = subprocess.run(
            [
                "ffmpeg",
                "-i", file_path,
                "-filter:v", f"setpts={1/speed_factor}*PTS",
                "-c:v", "libx264",
                "-preset", "medium",
                "-crf", "23",
                "-c:a", "aac",
                "-b:a", "128k",
                output_path
            ],
            capture_output=True,
            text=True,
            check=True,
        )
        
        return jsonify({"message": "Slow motion video created successfully"}), 200
    except subprocess.CalledProcessError as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True) 