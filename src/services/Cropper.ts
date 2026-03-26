import { Command } from "@effect/platform"
import { Effect, Context } from "effect"

export interface Cropper {
  readonly crop: (
    input: string,
    output: string,
    start: string,
    end: string
  ) => Effect.Effect<string, Error>
}

export const Cropper = Context.Tag<Cropper>("@services/Cropper")

export const CropperLive = Effect.succeed(
  Cropper.of({
    crop: (input, output, start, end) =>
      Effect.gen(function* () {
        // -ss (mulai) -to (berhenti)
        // -c copy (tanpa re-encode agar sangat cepat)
        const command = Command.make("ffmpeg", "-i", input, "-ss", start, "-to", end, "-c", "copy", output)
        yield* Effect.logInfo(`Cropping: ${input} -> ${output} (${start} to ${end})`)
        const exitCode = yield* Command.exitCode(command)
        
        if (exitCode !== 0) {
          return yield* Effect.fail(new Error(`ffmpeg gagal dengan exit code ${exitCode}`))
        }
        
        return output
      }).pipe(
        Effect.catchAll(() => Effect.fail(new Error(`Gagal memotong video pada rentang ${start} - ${end}`)))
      ),
  })
)
