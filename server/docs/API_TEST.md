# Register
curl -X POST http://localhost:3000/auth/register \
-H "Content-Type: application/json" \
-d '{"username":"testuser","email":"test@example.com","password":"password123"}'
# Login
curl -X POST http://localhost:3000/auth/login \
-H "Content-Type: application/json" \
-d '{"email":"admin@example.com","password":"admin123"}'

# uploading video
curl http://localhost:3000/videos/upload -F "video=@test.mp4"

# Clear tables
curl -X POST http://localhost:3000/dev/reset-db
