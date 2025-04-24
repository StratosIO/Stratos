# Stratos User Manual

## Introduction

Welcome to Stratos - A Client-Server Separated Video Processing Platform! This user manual will guide you through using the command-line interface to process and enhance your videos efficiently.

Stratos is an open-source, web-based platform that enables you to upload videos, process them through an intuitive interface, and leverage both standard and AI-powered video processing tools. Whether you're an occasional user, content creator, or business handling large video libraries, Stratos provides powerful tools to meet your needs.

## Getting Started

After uploading your video to the platform, you'll be able to use various commands to process your content. Stratos supports two types of commands:

1. **Built-in Slash Commands**: Standard video processing operations based on FFmpeg
2. **AI-powered Commands**: Advanced media processing capabilities using AI models

## Command Syntax

All commands in Stratos follow a consistent syntax pattern:

```
/command-name @filename [--option1=value1] [--option2=value2] [--output=custom-name]
```

- **command-name**: The specific operation you want to perform
- **@filename**: Reference to your file using the '@' symbol (required)
- **--option=value**: Optional parameters specific to each command
- **--output=name**: Optional custom name for the output file (without extension)

> **Important:** You don't need to know or enter the file's UUID manually. Simply type '@' and select your file from the dropdown menu. The frontend will automatically convert your selection to the appropriate UUID for processing.

## Available Commands

Stratos offers a wide range of commands to process your videos. Below is a brief overview of the available commands. For detailed documentation with all options and examples, please refer to the following resources:

### Built-in Slash Commands

For complete documentation on built-in commands, please refer to: [slash-commands.md](slash-commands.md)

- **/extract-audio**: Extract audio from a video file in various formats (mp3, wav, aac)
- **/convert-video**: Convert videos to different formats with quality options
- **/trim-video**: Extract specific segments from a video
- **/compress-video**: Reduce file size while maintaining acceptable quality
- **/create-thumbnail**: Create image thumbnails from specific points in a video
- **/create-gif**: Create animated GIFs from video segments

### AI-Powered Commands

For complete documentation on AI commands, please refer to: [ai-commands.md](ai-commands.md)

- **/ai-transcribe**: Automatically transcribe speech from videos to text
- **/ai-slowmo**: Create smooth slow-motion effects using AI interpolation

## Advanced Usage

### Raw FFmpeg Commands

For more advanced operations, you can still use raw FFmpeg commands:

```
ffmpeg -i 5c12ecc5-f2f8-438b-892d-e23348cb1d81 -vf "setpts=0.5*PTS" -an output.mp4
```

## How Stratos Works

When you use a command in Stratos, the system:

1. For built-in commands: Automatically transforms your command into a full FFmpeg command with the appropriate parameters and executes it
2. For AI commands: 
   - Processes the content using specialized AI models
   - Returns the result in the requested format

The processing time depends on the file size and complexity of the task.

## Technical Specifications

- **File Size**: Supports uploads up to 5GB
- **Concurrent Jobs**: Capability to handle up to 5 simultaneous tasks
- **Transcription Accuracy**: Aims for at least 90% accuracy in auto-generated transcriptions
- **Video Storage**: Videos are temporarily stored for 1 day by default after processing

## Troubleshooting

If you encounter issues with your video processing:

1. **Processing Failures**: The system preserves original videos in case of processing failures
2. **File Format Issues**: Try converting your video to a standard format (mp4,mov,webm) before applying other commands
3. **Performance Issues**: For large files, consider compressing the video first before applying other operations

