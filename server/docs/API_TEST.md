# Register
curl -X POST http://localhost:3000/api/auth/register \
-H "Content-Type: application/json" \
-d '{"username":"testuser","email":"test@example.com","password":"password123"}'
# Login
curl -X POST http://localhost:3000/api/auth/login \
-H "Content-Type: application/json" \
-d '{"email":"admin@example.com","password":"admin123"}'

# Upload any file (video, audio, or image)
curl -X POST http://localhost:3000/api/uploads -F "file=@test.mp4"

# List uploaded files (with default limit)
curl -X GET http://localhost:3000/api/uploads

# List uploaded files (with custom limit)
curl -X GET http://localhost:3000/api/uploads?limit=20

# List uploaded files (with pagination)
curl -X GET http://localhost:3000/api/uploads?limit=20&cursor=base64cursor

# Delete an uploaded file
curl -X DELETE http://localhost:3000/api/uploads/:id

# Get server status
curl -X GET http://localhost:3000/api/status

# Clear tables
curl -X POST http://localhost:3000/dev/reset-db

# Transcribe audio file (.wav)
curl -X POST http://localhost:3000/ai/transcribe \
-F "audio=@path/to/audio.wav"