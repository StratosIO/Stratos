# Register
curl -X POST http://localhost:3000/auth/register \
-H "Content-Type: application/json" \
-d '{"username":"testuser","email":"test@example.com","password":"password123"}'
# Login
curl -X POST http://localhost:3000/auth/login \
-H "Content-Type: application/json" \
-d '{"email":"admin@example.com","password":"admin123"}'

# Clear tables
curl -X POST http://localhost:3000/dev/reset-db

# Transcribe audio file (.wav)
curl -X POST http://localhost:3000/ai/transcribe \
-F "audio=@path/to/audio.wav"