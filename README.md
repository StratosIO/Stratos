# Stratos

> **⚠️ Work in Progress (WIP):**  
> This project is still under development. Features are subject to change.

Stratos is a client-server separated solution for video editing.

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
   cd stratos/backend
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

