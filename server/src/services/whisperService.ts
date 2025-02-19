import { exec } from "child_process"
import path from "path"

export async function transcribeAudio(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const whisperPath = path.resolve("/app/whisper.cpp/build/bin/whisper-cli")
        const modelPath = path.resolve("/app/whisper.cpp/models/ggml-base.en.bin")

        exec (
            `${whisperPath} -m ${modelPath} -f ${filePath}`,
            (error, stdout, stderr) => {
                if (error) {
                    console.error("Error running whisper-cli:", stderr)
                    reject("Transcription failed.")
                } else {
                    resolve(stdout)
                }
            }
        )
    })
}