import * as p from "@clack/prompts";
import { Effect, Layer, Schedule, Cause } from "effect";
import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { FileSystem } from "@effect/platform";
import { Downloader, DownloaderLive } from "./services/Downloader.js";
import { Cropper, CropperLive } from "./services/Cropper.js";
import { Clip, VideoUrlSchema, TimeFormatSchema } from "./schemas/Task.js";
import * as Schema from "@effect/schema/Schema";
import * as path from "path";

const main = Effect.gen(function* () {
  p.intro(`🎥 YT-Crop Batch (Effect TS)`);

  // 1. Ambil URL
  const url = yield* Effect.promise(() => 
    p.text({
      message: "Masukkan URL YouTube:",
      validate: (value) => {
        try {
          Schema.decodeSync(VideoUrlSchema)(value);
        } catch (_) {
          return "URL tidak valid!";
        }
      }
    })
  );

  if (p.isCancel(url)) return yield* Effect.dieMessage("Dibatalkan oleh user");

  // 2. Ambil Daftar Potongan
  const clips: Clip[] = [];
  let addMore = true;

  while (addMore) {
    const start = yield* Effect.promise(() => 
      p.text({
        message: `Potongan #${clips.length + 1} - Mulai (HH:MM:SS atau detik):`,
        validate: (value) => {
          try { Schema.decodeSync(TimeFormatSchema)(value); } catch (_) { return "Format waktu salah!"; }
        }
      })
    );
    if (p.isCancel(start)) break;

    const end = yield* Effect.promise(() => 
      p.text({
        message: `Potongan #${clips.length + 1} - Sampai (HH:MM:SS atau detik):`,
        validate: (value) => {
          try { Schema.decodeSync(TimeFormatSchema)(value); } catch (_) { return "Format waktu salah!"; }
        }
      })
    );
    if (p.isCancel(end)) break;

    clips.push({ start, end });

    const more = yield* Effect.promise(() => 
      p.confirm({ message: "Tambah potongan lagi?" })
    );
    if (p.isCancel(more) || !more) addMore = false;
  }

  if (clips.length === 0) return yield* Effect.logInfo("Tidak ada potongan yang dimasukkan.");

  // 3. Eksekusi dalam Scope (Pembersihan Otomatis)
  yield* Effect.scoped(
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      const downloader = yield* Downloader;
      const cropper = yield* Cropper;

      const tempDir = "temp";
      const outputDir = "output";
      const rawVideoPath = path.join(tempDir, `raw_${Date.now()}.mp4`);

      // Pastikan folder ada
      yield* fs.makeDirectory(tempDir, { recursive: true }).pipe(Effect.ignore);
      yield* fs.makeDirectory(outputDir, { recursive: true }).pipe(Effect.ignore);

      const s = p.spinner();
      s.start("Sedang mengunduh video mentah...");

      // Download Mentah
      yield* downloader.download(url as string, rawVideoPath);
      
      // Resource Management: Pastikan file mentah dihapus setelah selesai
      yield* Effect.addFinalizer(() => 
        fs.remove(rawVideoPath).pipe(
          Effect.tap(() => Effect.logInfo(`File mentah ${rawVideoPath} dihapus.`)),
          Effect.ignore
        )
      );

      s.message("Selesai download, mulai memotong...");

      // Potong Multiple
      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i];
        const clipName = `clip_${i + 1}_${Date.now()}.mp4`;
        const clipPath = path.join(outputDir, clipName);
        
        s.message(`Memotong klip ${i + 1}/${clips.length}...`);
        yield* cropper.crop(rawVideoPath, clipPath, clip.start, clip.end);
      }

      s.stop("Semua proses selesai! 🎉");
      p.outro(`Hasil tersimpan di folder ${outputDir}`);
    })
  );
});

const ProgramLive = Layer.mergeAll(DownloaderLive, CropperLive).pipe(
  Layer.provide(NodeContext.layer)
);

main.pipe(
  Effect.provide(ProgramLive),
  Effect.catchAllCause((cause) => {
    p.cancel(`Terjadi kesalahan: ${Cause.pretty(cause)}`);
    return Effect.void;
  }),
  NodeRuntime.runMain
);
