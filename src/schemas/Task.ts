import * as Schema from "@effect/schema/Schema";

// Regex untuk validasi waktu HH:MM:SS atau MM:SS atau SS (mendukung detik murni lebih dari 2 digit)
const TimeRegex = /^(\d{1,2}:){0,2}\d+$/;

export const VideoUrlSchema = Schema.String.pipe(
  Schema.filter((s) => s.startsWith("https://") || s.startsWith("http://")),
  Schema.annotations({ description: "URL YouTube yang valid" })
);

export const TimeFormatSchema = Schema.String.pipe(
  Schema.pattern(TimeRegex),
  Schema.annotations({ description: "Format waktu (contoh: 01:20 atau 90)" })
);

export const ClipSchema = Schema.Struct({
  start: TimeFormatSchema,
  end: TimeFormatSchema,
});

export const TaskSchema = Schema.Struct({
  url: VideoUrlSchema,
  clips: Schema.Array(ClipSchema),
});

export type Clip = Schema.Schema.Type<typeof ClipSchema>;
export type Task = Schema.Schema.Type<typeof TaskSchema>;
