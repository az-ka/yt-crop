import { Command, CommandExecutor } from "@effect/platform"
import { Effect, Context, Layer } from "effect"
import * as path from "path"

export interface Cropper {
  readonly crop: (
    input: string,
    output: string,
    start: string,
    end: string,
    shouldCompress: boolean
  ) => Effect.Effect<string, Error, CommandExecutor.CommandExecutor>
}

export const Cropper = Context.GenericTag<Cropper>("@services/Cropper")

export const CropperLive = Layer.succeed(
  Cropper,
  {
    crop: (input, output, start, end, shouldCompress) =>
      Effect.gen(function* () {
        const absoluteInput = path.resolve(input)
        const absoluteOutput = path.resolve(output)
        
        // Pengaturan dasar
        const args = [
          "ffmpeg", "-y", 
          "-ss", start, 
          "-to", end, 
          "-i", absoluteInput, 
          "-c:v", "libx264", 
          "-pix_fmt", "yuv420p",
          "-c:a", "aac"
        ]

        if (shouldCompress) {
          // Mode Kompresi: CRF 20 (High Quality) & Slow Preset (Better Compression)
          args.push("-crf", "20", "-preset", "slow")
        } else {
          // Mode Cepat: Preset Ultrafast
          args.push("-preset", "ultrafast")
        }

        args.push(absoluteOutput)

        const command = Command.make(...args)
        yield* Effect.logInfo(shouldCompress ? `Cropping & Compressing: ${absoluteOutput}` : `Fast Cropping: ${absoluteOutput}`)
        const exitCode = yield* Command.exitCode(command)
        
        if (exitCode !== 0) {
          return yield* Effect.fail(new Error(`ffmpeg gagal dengan exit code ${exitCode}`))
        }
        
        return absoluteOutput
      }).pipe(
        Effect.catchAll((e) => Effect.fail(new Error(`Gagal memotong video: ${e}`)))
      ),
  }
)
