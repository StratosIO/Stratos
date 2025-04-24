from flask import Flask, jsonify
import subprocess
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

WHISPER_BIN = "/app/whisper.cpp/build/bin/whisper-cli"
WHISPER_MODEL = "/app/models/ggml-base.en.bin"

SLOMO_CHECKPOINT = "/app/models/SuperSloMo.ckpt"

app = Flask(__name__)

@app.route("/transcribe/<file_path>/<options>", methods=["POST"])
def transcribe(file_path, options):
    logger.info(f"Starting transcription for file: {file_path}")
    file_path = file_path.replace("+", "/")
    base_name = file_path.split("/")[-1].replace("-audio.wav", "-transcript.txt")
    output_path = "/".join(file_path.split("/")[:-1]) + "/" + base_name
    options = options.split("-")

    try:
        logger.info(f"Running Whisper CLI with model: {WHISPER_MODEL}")
        result = subprocess.run(
            [WHISPER_BIN, "-m", WHISPER_MODEL, "-f", file_path],
            capture_output=True,
            text=True,
            check=True,
        )
        logger.info("Whisper CLI completed successfully")
        
        # Write the output to a file
        logger.info(f"Writing transcription to: {output_path}")
        with open(output_path, "w") as f:
            f.write(result.stdout.strip())

        logger.info("Transcription completed successfully")
        return jsonify({"message": "Transcription completed"}), 200
    except subprocess.CalledProcessError as e:
        logger.error(f"Whisper CLI failed: {e.stderr}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        logger.error(f"Unexpected error during transcription: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/slowmo/<file_path>/<options>", methods=["POST"])
def slowmo(file_path, options):
    logger.info(f"Starting Slow Motion processing for file: {file_path}")
    file_path = file_path.replace("+", "/")
    base_name = file_path.split("/")[-1].replace(".mp4", "-slowmo.mkv")
    output_path = "/".join(file_path.split("/")[:-1]) + "/" + base_name
    
    # Default speed factor is 0.5 (half speed)
    speed_factor = 0.5
    for option in options:
        if option.startswith("speed="):
            try:
                speed_factor = float(option.split("=")[1])
                logger.info(f"Using custom speed factor: {speed_factor}")
            except ValueError:
                logger.error(f"Invalid speed factor in options: {option}")
                return jsonify({"error": "Invalid speed factor"}), 400

    try:
        logger.info("Running Slow Motion script")
        logger.info(f"Input file: {file_path}")
        logger.info(f"Output file: {output_path}")

        # Get the current video frame rate
        result = subprocess.run(
            ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate", "-of", "default=noprint_wrappers=1:nokey=1", file_path],
            capture_output=True,
            text=True,
            check=True,
        )
        frame_rate = result.stdout.strip()
        frame_rate = int(frame_rate.split("/")[0]) / int(frame_rate.split("/")[1])
        logger.info(f"Frame rate: {frame_rate} => {int(frame_rate)}")
        frame_rate = int(frame_rate)
        sf_value = int(1 / speed_factor)
        logger.info(f"SF value: {sf_value}")
        
        result = subprocess.run(
            ["python",
             "slowmo/video_to_slomo.py",
             "--video", file_path,
             "--sf", str(sf_value),
             "--checkpoint", SLOMO_CHECKPOINT,
             "--fps", str(frame_rate),
             "--batch_size", "1",
             "--output", output_path
            ],
            capture_output=True,
            text=True,
            check=True,
        )
        
        logger.info("Slow Motion script completed successfully")
        # Convert the output file to MP4 format
        logger.info(f"Converting output file to MP4 format: {output_path}")
        result = subprocess.run(
            ["ffmpeg", "-i", output_path, "-c:v", "libx264", "-c:a", "aac", "-b:a", "128k", output_path.replace(".mkv", ".mp4")],
            capture_output=True,
            text=True,
            check=True,
        )
        
        logger.info("Output file converted to MP4 format successfully")
        # Delete the original output file
        result = subprocess.run(
            ["rm", "-f", output_path],
            capture_output=True,
            text=True,
            check=True,
        )
        
        return jsonify({"message": "Slow motion video created successfully"}), 200
    except subprocess.CalledProcessError as e:
        logger.error("Slow Motion script failed")
        logger.error(f"Command: {' '.join(e.cmd)}")
        logger.error(f"Error output: {e.stderr}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        logger.error(f"Unexpected error during Slow Motion processing: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/fpsboost/<file_path>/<options>", methods=["POST"])
def fpsboost(file_path, options):
    logger.info(f"Starting Frame Rate Boost processing for file: {file_path}")
    file_path = file_path.replace("+", "/")
    base_name = file_path.split("/")[-1].replace(".mp4", "-fpsboost.mkv")
    output_path = "/".join(file_path.split("/")[:-1]) + "/" + base_name
    
    # Default frame rate factor is 2 (double fps)
    factor = 2
    for option in options:
        if option.startswith("factor="):
            try:
                factor = int(option.split("=")[1])
                logger.info(f"Using custom frame rate factor: {factor}")
            except ValueError:
                logger.error(f"Invalid frame rate factor in options: {option}")
                return jsonify({"error": "Invalid frame rate factor"}), 400

    try:
        logger.info("Running Frame Rate script")
        logger.info(f"Input file: {file_path}")
        logger.info(f"Output file: {output_path}")

        # Get the current video frame rate
        result = subprocess.run(
            ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate", "-of", "default=noprint_wrappers=1:nokey=1", file_path],
            capture_output=True,
            text=True,
            check=True,
        )
        frame_rate = result.stdout.strip()
        frame_rate = int(frame_rate.split("/")[0]) / int(frame_rate.split("/")[1])
        logger.info(f"Frame rate: {frame_rate} => {int(frame_rate)}")
        frame_rate = int(frame_rate)
        sf_value = factor
        logger.info(f"SF value: {sf_value}")
        
        result = subprocess.run(
            ["python",
             "slowmo/video_to_slomo.py",
             "--video", file_path,
             "--sf", str(sf_value),
             "--checkpoint", SLOMO_CHECKPOINT,
             "--fps", str(frame_rate * sf_value),
             "--batch_size", "1",
             "--output", output_path
            ],
            capture_output=True,
            text=True,
            check=True,
        )
        
        logger.info("Frame Rate Boost script completed successfully")
        # Convert the output file to MP4 format
        logger.info(f"Converting output file to MP4 format: {output_path}")
        result = subprocess.run(
            ["ffmpeg", "-i", output_path, "-c:v", "libx264", "-c:a", "aac", "-b:a", "128k", output_path.replace(".mkv", ".mp4")],
            capture_output=True,
            text=True,
            check=True,
        )
        
        logger.info("Output file converted to MP4 format successfully")
        # Delete the original output file
        result = subprocess.run(
            ["rm", "-f", output_path],
            capture_output=True,
            text=True,
            check=True,
        )
        
        return jsonify({"message": "Frame Rate Boost video created successfully"}), 200
    except subprocess.CalledProcessError as e:
        logger.error("Frame Rate Boost script failed")
        logger.error(f"Command: {' '.join(e.cmd)}")
        logger.error(f"Error output: {e.stderr}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        logger.error(f"Unexpected error during Frame Rate Boost processing: {str(e)}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    logger.info("Starting Flask application")
    app.run(host="0.0.0.0", port=5001, debug=True) 