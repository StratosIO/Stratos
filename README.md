<div align="center">
  <!-- Add your project logo here when available -->
  <img src="docs/logo.png" alt="Stratos Logo" width="800"/>

  [![Build Status](https://github.com/StratosIO/Stratos/actions/workflows/build.yml/badge.svg)](https://github.com/StratosIO/Stratos/actions)
  [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/StratosIO/Stratos/blob/master/LICENSE)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  ![Python](https://img.shields.io/badge/-Python-3776AB?style=flat&logo=python&logoColor=white)
  [![Svelte](https://img.shields.io/badge/Svelte-FF3E00?style=flat&logo=svelte&logoColor=white)](https://svelte.dev/)
  [![Bun](https://img.shields.io/badge/Bun-000000?style=flat&logo=bun&logoColor=white)](https://bun.sh/)
  [![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
  ![GitHub tag (latest by date)](https://img.shields.io/github/v/tag/StratosIO/Stratos)
  [![GitHub Stars](https://img.shields.io/github/stars/StratosIO/Stratos?style=social)](https://github.com/StratosIO/Stratos/stargazers)
  [![GitHub Forks](https://img.shields.io/github/forks/StratosIO/Stratos?style=social)](https://github.com/StratosIO/Stratos/network/members)

</div>

# 🎬 Stratos

> **⚠️ Development Status**  
> Stratos is currently in active development. We're working hard to bring you a powerful video editing solution. Features and APIs are subject to change as we refine the platform.

## 📑 Table of Contents

- [🎬 Stratos](#-stratos)
  - [📑 Table of Contents](#-table-of-contents)
  - [📋 Overview](#-overview)
  - [🎮 Demo](#-demo)
  - [🚀 Features](#-features)
  - [🛠️ Tech Stack](#️-tech-stack)
    - [Frontend](#frontend)
    - [Backend](#backend)
    - [Development Tools](#development-tools)
  - [🏗️ Project Structure](#️-project-structure)
  - [📘 Documentation](#-documentation)
    - [User Manual](#user-manual)
    - [API Documentation](#api-documentation)
  - [🏁 Getting Started](#-getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Docker Deployment](#docker-deployment)
    - [Commit Guidelines](#commit-guidelines)
  - [📄 License](#-license)
  - [🤝 Support](#-support)
  - [👥 Contributors](#-contributors)

## 📋 Overview

Stratos is a modern, client-server separated solution for video editing, built with cutting-edge technologies to provide a seamless editing experience. The platform is designed with scalability and performance in mind, offering a robust foundation for video processing and editing workflows.

## 🎮 Demo

See Stratos in action with our command interface:

![DEMO](https://github.com/user-attachments/assets/d52d7b5e-f178-427d-b374-f98c2cebf73c)


## 🚀 Features

- **Modern Architecture**: Client-server separation for optimal performance
- **Type Safety**: Built with TypeScript for enhanced reliability
- **Fast Development**: Powered by Bun for rapid development cycles
- **Modern UI**: Svelte-based frontend for smooth user experience
- **Containerized**: Docker support for easy deployment
- **AI Integration**: Built-in AI capabilities for enhanced editing
- **Real-time Processing**: Efficient video processing pipeline
- **Extensible**: Plugin system for custom functionality
- **Cross-platform**: Works on Windows, macOS, and Linux

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Svelte](https://svelte.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)

### Backend
- **Runtime**: [Bun](https://bun.sh/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **API**: RESTful architecture

### Development Tools
- **Version Control**: [Git](https://git-scm.com/)
- **Containerization**: [Docker](https://www.docker.com/)
- **CI/CD**: [GitHub Actions](https://github.com/StratosIO/Stratos/actions)

## 🏗️ Project Structure

```
Stratos/
├── server/          # Backend server code
│   ├── src/         # Source code
│   ├── test/        # Test files
│   └── docs/        # Documentation
├── web/             # Frontend application
│   ├── src/         # Source code
│   └── test/        # Test files
├── ai/              # AI-related functionality
├── .github/         # GitHub configuration
├── docker/          # Docker configuration
└── docs/            # Project documentation
```

## 📘 Documentation

### User Manual

Detailed instructions for using Stratos can be found in our [User Manual](./docs/userManual.md). The manual covers:

- Command syntax and usage
- Built-in slash commands for video processing
- AI-powered commands for advanced media processing
- Advanced usage with raw FFmpeg commands
- Technical specifications and troubleshooting

For specialized commands, please see the following resources:
- [Slash Commands Documentation](./docs/slash-commands.md)
- [AI Commands Documentation](./docs/ai-commands.md)

### API Documentation

Stratos provides a RESTful API that allows developers to integrate with the platform programmatically:

- The full API specification is available in [OpenAPI format](./docs/openapi.yaml)
- You can use this specification with tools like [Swagger UI](https://swagger.io/tools/swagger-ui/) to explore the API interactively

## 🏁 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or [Node.js](https://nodejs.org/)
- [Docker](https://www.docker.com/) (recommended for deployment)
- [Git](https://git-scm.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/StratosIO/Stratos.git
   cd Stratos
   ```

2. Install dependencies:
   ```bash
   # Install server dependencies
   cd server
   bun install

   # Install web dependencies
   cd ../web
   bun install
   ```

3. Start the development environment:
   ```bash
   # Start the server
   cd server
   bun run dev

   # In a new terminal, start the web client
   cd web
   bun run dev
   ```

### Docker Deployment

For containerized deployment:

```bash
docker-compose up -d
```

### Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) for consistent commit messages:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test additions/modifications
- `chore:` - Build process or auxiliary tool changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

For support, please:
- Open an issue in the [GitHub repository](https://github.com/StratosIO/Stratos/issues)

## 👥 Contributors

<a href="https://github.com/StratosIO/Stratos/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=StratosIO/Stratos" />
</a>

---

<div align="center">
  Made with ❤️ by the Stratos Team
</div>
