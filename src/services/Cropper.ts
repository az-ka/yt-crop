import { Command, CommandExecutor } from "@effect/platform"
import { Effect, Context, Layer } from "effect"
import * as path from "path"

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
        const absoluteInput = path.resolve(input)
        const absoluteOutput = path.resolve(output)
        
        const command = Command.make(
          "ffmpeg", 
          "-y", 
          "-ss", start, 
          "-to", end, 
          "-i", absoluteInput, 
          "-c:v", "libx264", 
          "-pix_fmt", "yuv420p", 
          "-preset", "ultrafast", 
          "-c:a", "aac", 
          absoluteOutput
        ).pipe(
          Command.stdout("inherit"),
          Command.stderr("inherit")
        )
        
        yield* Effect.logInfo(`Cropping to: ${absoluteOutput}`)
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
