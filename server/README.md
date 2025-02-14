# Stratos Backend

This is the backend service for Stratos, a cloud-based video processing platform. The service provides REST APIs for video upload, processing, and management.

## Prerequisites

Ensure you have the following installed:
- Docker and Docker Compose
- Bun (recommended) or Node.js
- Git

## Local Development

### Using Docker (Recommended)

The easiest way to get started is using Docker Compose, which will set up both the backend service and PostgreSQL database.

1. Build the containers:
```bash
docker compose build
```

2. Start the services:
```bash
# Run with logs in terminal
docker compose up

# Or run in detached mode
docker compose up -d
```

3. Stop the services:
```bash
#Stop containers
docker compose down

#Stop containers and remove volumes(this will delete all data in the db)
docker compose down -v
```

### Manual Setup

If you prefer to run the services directly:

1. Install dependencies:
```bash
bun install
```

2. Set up PostgreSQL:
   - Install PostgreSQL locally
   - Create a database named 'stratos'
   - Run the initialization script from `src/config/init.sql`

3. Start the development server:
```bash
bun run dev
```

## API Documentation

The API is documented using OpenAPI 3.0 specification. Once the server is running, you can access the following endpoints:

- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Authenticate user

Endpoints are still in development

For full API documentation, refer to `openapi.yaml` in the root of this directory.

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
DB_USER=user
DB_HOST=db
DB_NAME=stratos
DB_PASSWORD=pass
DB_PORT=5432
NODE_ENV=development
LOG_LEVEL='debug'
```

## License

This project is licensed under the MIT License
