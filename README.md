# Stratos
[![Build Status](https://github.com/StratosIO/Stratos/actions/workflows/build.yml/badge.svg)](https://github.com/StratosIO/Stratos/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/StratosIO/Stratos/blob/master/LICENSE)
> **⚠️ Work in Progress (WIP):**  
> This project is still under development. Features are subject to change.

## Introduction

Welcome to Stratos - A Client-Server Separated Media Processing Platform! This user manual will guide you through using the command-line interface to process and enhance your videos efficiently.

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
- **/ai-slowmotion**: Create smooth slow-motion effects using AI interpolation

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
   - Extracts audio from the video file 
   - Processes the content using specialized AI models
   - Returns the result in the requested format

The processing time depends on the file size and complexity of the task.

## Developing

You'll need to install the required dependencies and set up the project environment.

### Dependencies

#### macOS and Linux

Install [Bun](https://bun.sh/) as the package manager:

```bash
$ curl -fsSL https://bun.sh/install | bash
```

Alternatively, you can use [Node.js](https://nodejs.org/en), but note that it may be slower in comparison.

#### Windows

Install Bun on Windows using PowerShell:

```powershell
powershell -c "irm bun.sh/install.ps1|iex"
```

### Get Started

1. Clone the repository:

   ```bash
   git clone 
   # cd stratos/server
   # cd stratos/web
   ```

2. Install dependencies using Bun:

   ```bash
   bun install
   ```

3. Start the development server:

   ```bash
   bun run dev
   ```

### Conventional Commits

We use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/#summary) to maintain consistent commit messages and automatically generate changelogs.

Examples of commit message formats:

- `fix: resolve a bug`
- `feat: add a new feature`
- `docs: update documentation`

## License

Stratos is licensed under the [MIT License](LICENSE).

