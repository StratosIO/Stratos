import express from "express"
import multer from "multer"
import { transcribe } from "../controllers/whisperController"

const router = express.Router()
const upload = multer({ dest: "uploads/" })

router.post("/transcribe", upload.single("audio"), transcribe)

export default router