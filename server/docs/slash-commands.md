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

### /compress-video

Compress a video to reduce file size while maintaining acceptable quality.

**Options:**
- `--level`: Compression level (`light`, `medium`, `heavy`, default: `medium`)
- `--keep-resolution`: Maintain original resolution (`true`, `false`, default: `true`)
- `--codec`: Video codec (`h264`, `h265`, `vp9`, default: `h264`)
- `--format`: Output format (`mp4`, `webm`, default: `mp4`)

**Examples:**
```
/compress-video 5c12ecc5-f2f8-438b-892d-e23348cb1d81
/compress-video 5c12ecc5-f2f8-438b-892d-e23348cb1d81 --level=heavy --codec=h265
/compress-video 5c12ecc5-f2f8-438b-892d-e23348cb1d81 --keep-resolution=false --output=compressed
```

**Notes:**
- `light` compression preserves higher quality but results in larger files
- `heavy` compression creates smaller files but may reduce visual quality
- The `h265` codec generally provides better compression than `h264` but may not be compatible with all devices
- When using `vp9` codec, the output format will automatically be set to `webm`

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

## How it works?

When you use a built-in command, the system automatically transforms it into a full FFmpeg command with the appropriate parameters and executes it. This simplifies common operations while still providing the flexibility of FFmpeg.

You can still use raw FFmpeg commands for more advanced operations:

```
ffmpeg -i 5c12ecc5-f2f8-438b-892d-e23348cb1d81 -vf "setpts=0.5*PTS" -an output.mp4
```
