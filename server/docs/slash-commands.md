# Built-in slash Commands Documentation

The Stratos API provides a set of built-in slash commands that simplify common FFmpeg operations and make performing video processing operations simple!

## Command Syntax

Built-in commands follow this general syntax:

```
/command-name fileId [--option1=value1] [--option2=value2] [--output=custom-name]
```

- **command-name**: The name of the built-in command (e.g., `extract-audio`)
- **fileId**: The UUID of the file to process (required) --> this will be the file name in the frontend(as the frontend converts a video to a uuid)
- **--option=value**: Optional parameters specific to each command
- **--output=name**: Optional custom name for the output file (without extension)

## Available Commands

### /extract-audio

Extract audio from a video file and convert it to an audio format.

**Options:**
- `--quality`: Audio quality (`low`, `medium`, `high`, default: `medium`)
- `--format`: Output format (`mp3`, `wav`, `aac`, default: `mp3`)

**Examples:**
```
/extract-audio 5c12ecc5-f2f8-438b-892d-e23348cb1d81
/extract-audio 5c12ecc5-f2f8-438b-892d-e23348cb1d81 --quality=high --format=wav
/extract-audio 5c12ecc5-f2f8-438b-892d-e23348cb1d81 --output=soundtrack
```

### /convert-video

Convert a video file to a different format with optional quality settings.

**Options:**
- `--format`: Output format (`mp4`, `mov`, `webm`, default: `mp4`)
- `--quality`: Video quality (`low`, `medium`, `high`, default: `medium`)
- `--resolution`: Output resolution (e.g., `1280x720`)

**Examples:**
```
/convert-video 5c12ecc5-f2f8-438b-892d-e23348cb1d81
/convert-video 5c12ecc5-f2f8-438b-892d-e23348cb1d81 --format=webm --quality=high
/convert-video 5c12ecc5-f2f8-438b-892d-e23348cb1d81 --resolution=1920x1080 --output=high-res
```

### /create-thumbnail

Create a thumbnail image from a specific time point in a video.

**Options:**
- `--time`: Time position in the video (format: `HH:MM:SS`, default: `00:00:01`)
- `--resolution`: Output resolution (e.g., `640x360`, default: `640x360`)

**Examples:**
```
/create-thumbnail 5c12ecc5-f2f8-438b-892d-e23348cb1d81
/create-thumbnail 5c12ecc5-f2f8-438b-892d-e23348cb1d81 --time=00:01:30
/create-thumbnail 5c12ecc5-f2f8-438b-892d-e23348cb1d81 --resolution=1280x720 --output=preview
```

### /create-gif

Create an animated GIF from a segment of a video.

**Options:**
- `--start`: Start time in the video (format: `HH:MM:SS`, default: `00:00:00`)
- `--duration`: Duration in seconds (default: `5`)
- `--fps`: Frames per second (default: `10`)
- `--width`: Width in pixels, height auto-calculated (default: `320`)

**Examples:**
```
/create-gif 5c12ecc5-f2f8-438b-892d-e23348cb1d81
/create-gif 5c12ecc5-f2f8-438b-892d-e23348cb1d81 --start=00:01:45 --duration=3
/create-gif 5c12ecc5-f2f8-438b-892d-e23348cb1d81 --width=480 --fps=15 --output=animation
```
### /trim-video

Trim video to extract a specific segment.

**Options:**
- `--start`: Start time in format HH:MM:SS (default: `00:00:00`)
- `--duration`: Duration in seconds
- `--end`: End time in format HH:MM:SS (alternative to duration)
- `--fast`: Use fast copy mode (default: `true`)

**Fast Copy Mode:**
The `--fast` option uses FFmpeg's stream copying approach (`-c:v copy -c:a copy`), which:
- Provides much faster processing (10-100x faster than re-encoding)
- Preserves original video quality with no generation loss
- May be less precise with trim points (can only cut at keyframes)
- Works best when keeping the same container format

Set `--fast=false` for frame-accurate trimming when precision is more important than speed.

**Examples:**
```
/trim-video 5c12ecc5-f2f8-438b-892d-e23348cb1d81 --start=00:01:30 --duration=45
/trim-video 5c12ecc5-f2f8-438b-892d-e23348cb1d81 --start=00:01:30 --end=00:02:15
/trim-video 5c12ecc5-f2f8-438b-892d-e23348cb1d81 --fast=false --output=precise-clip
```
### /compress-video

Compress video to reduce file size.

**Options:**
- `--preset`: Compression speed/efficiency (ultrafast, fast, medium, slow, veryslow) (default: `medium`)
- `--crf`: Quality factor (0-51, lower is better quality) (default: `23`)
- `--format`: Output format (mp4, webm) (default: `mp4`)
- `--width`: Resize to width while keeping aspect ratio

**Examples:**
```
/compress-video 5c12ecc5-f2f8-438b-892d-e23348cb1d81
/compress-video 5c12ecc5-f2f8-438b-892d-e23348cb1d81 --preset=slow --crf=18
/compress-video 5c12ecc5-f2f8-438b-892d-e23348cb1d81 --width=720 --format=webm --output=compressed
```

## How it works?

When you use a built-in command, the system automatically transforms it into a full FFmpeg command with the appropriate parameters and executes it. This simplifies common operations while still providing the flexibility of FFmpeg.

You can still use raw FFmpeg commands for more advanced operations:

```
ffmpeg -i 5c12ecc5-f2f8-438b-892d-e23348cb1d81 -vf "setpts=0.5*PTS" -an output.mp4
```
