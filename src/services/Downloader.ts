import { Command, CommandExecutor } from "@effect/platform"
import { Effect, Context, Layer } from "effect"

export interface Downloader {
  readonly download: (url: string, destination: string) => Effect.Effect<string, Error, CommandExecutor.CommandExecutor>
}

export const Downloader = Context.GenericTag<Downloader>("@services/Downloader")

export const DownloaderLive = Layer.succeed(
  Downloader,
  {
    download: (url, destination) =>
      Effect.gen(function* () {
        // -f 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best' (Video berkualitas terbaik berformat mp4)
        const command = Command.make("yt-dlp", "-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best", "-o", destination, url)
        yield* Effect.logInfo(`Downloading: ${url} to ${destination}`)
        const exitCode = yield* Command.exitCode(command)
        
        if (exitCode !== 0) {
          return yield* Effect.fail(new Error(`yt-dlp gagal dengan exit code ${exitCode}`))
        }
        
        return destination
      }).pipe(
        Effect.catchAll(() => Effect.fail(new Error(`Gagal mengunduh video dari ${url}`)))
      ),
  }
)
