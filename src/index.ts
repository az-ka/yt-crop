import * as p from "@clack/prompts";
import { Effect, Layer, Cause, Deferred, Fiber } from "effect";
import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { FileSystem } from "@effect/platform";
import { Downloader, DownloaderLive } from "./services/Downloader.js";
import { Cropper, CropperLive } from "./services/Cropper.js";
import { Clip, VideoUrlSchema, TimeFormatSchema } from "./schemas/Task.js";
import * as Schema from "@effect/schema/Schema";
import * as path from "path";

const main = Effect.gen(function* () {
  p.intro(`🎥 YT-Crop Batch (Effect TS)`);

  const urlInput = yield* Effect.promise(() => 
    p.text({
      message: "Masukkan URL YouTube:",
      validate: (value) => {
        try { Schema.decodeSync(VideoUrlSchema)(value || ""); } catch (_) { return "URL tidak valid!"; }
      }
    })
  );

  if (p.isCancel(urlInput)) return yield* Effect.dieMessage("Dibatalkan oleh user");
  const url = urlInput as string;

  // --- START: BACKGROUND PROCESS ---
  const downloader = yield* Downloader;
  const tempDir = "temp";
  const outputDir = "output";
  const rawVideoPath = path.resolve(path.join(tempDir, `raw_${Date.now()}.mp4`));
  
  const s = p.spinner();
  s.start("Mengecek durasi video...");
  const totalSeconds = yield* downloader.getDuration(url);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalRemainingSeconds = totalSeconds % 60;
  const durationLabel = `${totalMinutes}:${totalRemainingSeconds.toString().padStart(2, "0")}`;
  s.stop(`Durasi Video: ${durationLabel} (${totalSeconds} detik)`);

  // Mulai download di latar belakang
  const downloadDone = yield* Deferred.make<string, Error>();
  const downloadFiber = yield* Effect.fork(
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      yield* fs.makeDirectory(tempDir, { recursive: true }).pipe(Effect.ignore);
      yield* fs.makeDirectory(outputDir, { recursive: true }).pipe(Effect.ignore);
      
      yield* downloader.download(url, rawVideoPath);
      yield* Deferred.succeed(downloadDone, rawVideoPath);
    }).pipe(
      Effect.catchAll((e) => Deferred.fail(downloadDone, e as Error))
    )
  );
  // ---------------------------------

  const clips: Clip[] = [];
  let addMore = true;

  const normalizeTime = (input: string): string => {
    const digits = input.replace(/\D/g, "");
    if (digits.length === 0) return input;
    
    // Jika input murni angka, format menjadi HH:MM:SS dari kanan ke kiri
    if (/^\d+$/.test(input) && input.length > 2) {
      const padded = digits.padStart(6, "0");
      const hh = padded.slice(0, 2);
      const mm = padded.slice(2, 4);
      const ss = padded.slice(4, 6);
      return `${hh}:${mm}:${ss}`;
    }
    return input;
  };

  const timeToSeconds = (timeStr: string) => {
    const normalized = normalizeTime(timeStr);
    const parts = normalized.split(":").map(Number).reverse();
    return parts[0] + (parts[1] || 0) * 60 + (parts[2] || 0) * 3600;
  };

  while (addMore) {
    const startInput = yield* Effect.promise(() => 
      p.text({
        message: `Potongan #${clips.length + 1} - Mulai (Max: ${durationLabel}):`,
        placeholder: "Contoh: 130 untuk 01:30 atau 10000 untuk 01:00:00",
        validate: (value) => {
          try { 
            const normalized = normalizeTime(value || "");
            Schema.decodeSync(TimeFormatSchema)(normalized); 
            const sec = timeToSeconds(value || "");
            if (sec >= totalSeconds) return `Melebihi durasi video!`;
          } catch (_) { return "Format waktu salah!"; }
        }
      })
    );
    if (p.isCancel(startInput)) break;
    const start = normalizeTime(startInput as string);

    const endInput = yield* Effect.promise(() => 
      p.text({
        message: `Potongan #${clips.length + 1} - Sampai (Max: ${durationLabel}):`,
        placeholder: "Contoh: 200 untuk 02:00",
        validate: (value) => {
          try { 
            const normalized = normalizeTime(value || "");
            Schema.decodeSync(TimeFormatSchema)(normalized); 
            const sec = timeToSeconds(value || "");
            if (sec > totalSeconds) return `Melebihi durasi video!`;
            if (sec <= timeToSeconds(start)) return "Harus setelah waktu mulai!";
          } catch (_) { return "Format waktu salah!"; }
        }
      })
    );
    if (p.isCancel(endInput)) break;
    const end = normalizeTime(endInput as string);

    clips.push({ start, end });

    const more = yield* Effect.promise(() => 
      p.confirm({ message: "Tambah potongan lagi?" })
    );
    if (p.isCancel(more) || !more) addMore = false;
  }

  if (clips.length === 0) {
    yield* Fiber.interrupt(downloadFiber);
    return yield* Effect.logInfo("Tidak ada potongan yang dimasukkan.");
  }

  const finalSpinner = p.spinner();
  finalSpinner.start("Menunggu unduhan latar belakang selesai...");
  
  const pathResult = yield* Deferred.await(downloadDone);
  
  yield* Effect.scoped(
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      const cropper = yield* Cropper;

      yield* Effect.addFinalizer(() => 
        fs.remove(pathResult).pipe(Effect.ignore)
      );

      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i];
        const clipPath = path.resolve(path.join(outputDir, `clip_${i + 1}_${Date.now()}.mp4`));
        
        finalSpinner.message(`Memotong klip ${i + 1}/${clips.length}...`);
        yield* cropper.crop(pathResult, clipPath, clip.start, clip.end);
      }

      finalSpinner.stop("Semua proses selesai! 🎉");
      p.outro(`Hasil tersimpan di folder ${outputDir}`);
    })
  );
});

const ProgramLive = Layer.mergeAll(
  DownloaderLive, 
  CropperLive,
  NodeContext.layer
);

main.pipe(
  Effect.provide(ProgramLive),
  Effect.catchAllCause((cause) =>
    Effect.sync(() => {
      p.cancel(`Terjadi kesalahan: ${Cause.pretty(cause)}`);
    })
  ),
  NodeRuntime.runMain
);
