import { Command, CommandExecutor } from "@effect/platform"
import { Effect, Context, Layer } from "effect"
import * as path from "path"

export interface Downloader {
  readonly download: (url: string, destination: string) => Effect.Effect<string, Error, CommandExecutor.CommandExecutor>
  readonly getDuration: (url: string) => Effect.Effect<number, Error, CommandExecutor.CommandExecutor>
  readonly getTitle: (url: string) => Effect.Effect<string, Error, CommandExecutor.CommandExecutor>
}

export const Downloader = Context.GenericTag<Downloader>("@services/Downloader")

export const DownloaderLive = Layer.succeed(
  Downloader,
  {
    getTitle: (url) =>
      Effect.gen(function* () {
        const command = Command.make("yt-dlp", "--get-title", url)
        const output = yield* Command.lines(command)
        return output[0] || "video"
      }).pipe(
        Effect.catchAll(() => Effect.succeed("video"))
      ),
    getDuration: (url) => 
      Effect.gen(function* () {
        const command = Command.make("yt-dlp", "--get-duration", url)
        const output = yield* Command.lines(command)
        const durationStr = output[0] || "0"
        
        // Konversi HH:MM:SS atau MM:SS ke detik
        const parts = durationStr.split(":").map(Number).reverse()
        const seconds = parts[0] + (parts[1] || 0) * 60 + (parts[2] || 0) * 3600
        return seconds
      }).pipe(
        Effect.catchAll(() => Effect.fail(new Error("Gagal mengambil durasi video")))
      ),
    download: (url, destination) =>
      Effect.gen(function* () {
        const absolutePath = path.resolve(destination)
        const command = Command.make(
          "yt-dlp", 
          "-f", "bestvideo[vcodec^=avc1]+bestaudio[acodec^=mp4a]/best[ext=mp4]/best",
          "--merge-output-format", "mp4",
          "--fixup", "warn",
          "-o", absolutePath, 
          url
        )
        
        const exitCode = yield* Command.exitCode(command)
        
        if (exitCode !== 0) {
          return yield* Effect.fail(new Error(`yt-dlp gagal dengan exit code ${exitCode}`))
        }
        
        return absolutePath
      }).pipe(
        Effect.catchAll((e) => Effect.fail(new Error(`Gagal mengunduh video: ${e}`)))
      ),
  }
)
