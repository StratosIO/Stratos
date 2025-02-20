# Register
curl -X POST http://localhost:3000/api/auth/register \
-H "Content-Type: application/json" \
-d '{"username":"testuser","email":"test@example.com","password":"password123"}'
# Login
curl -X POST http://localhost:3000/api/auth/login \
-H "Content-Type: application/json" \
-d '{"email":"admin@example.com","password":"admin123"}'

# Uploading video
curl http://localhost:3000/api/upload -F "video=@test.mp4"

# Status
curl http://localhost:3000/api/status

# Clear tables
curl -X POST http://localhost:3000/dev/reset-db
