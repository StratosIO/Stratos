# AI Commands Documentation

The Stratos API supports AI-powered commands for advanced media processing capabilities.

## Command Syntax

AI commands follow this general syntax:

```
/ai-command-name fileId [--option1=value1] [--option2=value2] [--output=custom-name]
```

- **command-name**: The name of the AI command (e.g., `transcribe`)
- **fileId**: The UUID of the file to process (required)
- **--option=value**: Optional parameters specific to each command
- **--output=name**: Optional custom name for the output file (without extension)

## Available AI Commands

### /ai-transcribe

Transcribe speech from a video or audio file.

**Options:**
- `--language`: Source language (`auto`, `en`, `es`, `fr`, etc., default: `auto`)
- `--format`: Output format (`txt`, `srt`, `vtt`, default: `txt`)

**Examples:**
```
/ai-transcribe 5c12ecc5-f2f8-438b-892d-e23348cb1d81
/ai-transcribe 5c12ecc5-f2f8-438b-892d-e23348cb1d81 --language=en --format=srt
/ai-transcribe 5c12ecc5-f2f8-438b-892d-e23348cb1d81 --output=meeting-notes
```

### /ai-slowmotion

Create a slow motion version of a video.

**Options:**
- `--speed`: Speed factor (0.1 to 1.0, where 0.5 is half speed, default: 0.5)

**Examples:**
```
/ai-slowmotion 5c12ecc5-f2f8-438b-892d-e23348cb1d81
/ai-slowmotion 5c12ecc5-f2f8-438b-892d-e23348cb1d81 --speed=0.25
/ai-slowmotion 5c12ecc5-f2f8-438b-892d-e23348cb1d81 --output=slow-motion-clip
```

### /ai-fpsboost

Create a increased fps version of a video.

**Options**
- `--factor`: Factor by which to boost the frame rate (result is factor * current frame rate, default: 2)

**Examples:**
```
/ai-fpsboost 5c12ecc5-f2f8-438b-892d-e23348cb1d81
/ai-fpsboost 5c12ecc5-f2f8-438b-892d-e23348cb1d81 --factor=3
/ai-fpsboost 5c12ecc5-f2f8-438b-892d-e23348cb1d81 --output=fps-boost-clip
```

### /ai-subtitle

Automatically transcribe and apply subtitles to a video file.

**Options:**
- `--language`: Source language (`auto`, `en`, `es`, `fr`, etc., default: `auto`)
- `--format`: Output format (`mp4`, `mov`, `webm`, default: `mp4`)

**Examples:**
```
/ai-subtitle 5c12ecc5-f2f8-438b-892d-e23348cb1d81
/ai-subtitle 5c12ecc5-f2f8-438b-892d-e23348cb1d81 --language=en
/ai-subtitle 5c12ecc5-f2f8-438b-892d-e23348cb1d81 --output=subtitled-video
```

## How it works

When you use an AI command, the system:

1. Extracts audio from the video file 
2. Processes the content using specialized AI models
3. Returns the result in the requested format

The processing time depends on the file size and complexity of the task.