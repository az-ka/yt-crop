import { Command, CommandExecutor } from "@effect/platform"
import { Effect, Context, Layer } from "effect"

export interface Cropper {
  readonly crop: (
    input: string,
    output: string,
    start: string,
    end: string
  ) => Effect.Effect<string, Error, CommandExecutor.CommandExecutor>
}

export const Cropper = Context.GenericTag<Cropper>("@services/Cropper")

export const CropperLive = Layer.succeed(
  Cropper,
  {
    crop: (input, output, start, end) =>
      Effect.gen(function* () {
        // Taruh -ss dan -to sebelum -i agar cepat (fast seek)
        // Hapus -c copy untuk re-encoding agar video pasti bisa dibuka dan presisi
        const command = Command.make("ffmpeg", "-ss", start, "-to", end, "-i", input, "-preset", "ultrafast", output)
        yield* Effect.logInfo(`Cropping: ${input} -> ${output} (${start} to ${end})`)
        const exitCode = yield* Command.exitCode(command)
        
        if (exitCode !== 0) {
          return yield* Effect.fail(new Error(`ffmpeg gagal dengan exit code ${exitCode}`))
        }
        
        return output
      }).pipe(
        Effect.catchAll(() => Effect.fail(new Error(`Gagal memotong video pada rentang ${start} - ${end}`)))
      ),
  }
)
