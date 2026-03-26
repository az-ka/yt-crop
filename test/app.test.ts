import { describe, it, expect } from "vitest";
import * as Schema from "@effect/schema/Schema";
import { TaskSchema, VideoUrlSchema, TimeFormatSchema } from "../src/schemas/Task.js";

describe("YT-Crop Validation", () => {
  it("harus valid untuk URL YouTube yang benar", () => {
    const validUrl = "https://www.youtube.com/watch?v=abc";
    expect(() => Schema.decodeSync(VideoUrlSchema)(validUrl)).not.toThrow();
  });

  it("harus error untuk URL yang tidak valid", () => {
    const invalidUrl = "not-a-url";
    expect(() => Schema.decodeSync(VideoUrlSchema)(invalidUrl)).toThrow();
  });

  it("harus valid untuk format waktu HH:MM:SS", () => {
    expect(() => Schema.decodeSync(TimeFormatSchema)("01:30:15")).not.toThrow();
  });

  it("harus valid untuk format waktu detik saja", () => {
    expect(() => Schema.decodeSync(TimeFormatSchema)("90")).not.toThrow();
  });

  it("harus valid untuk satu tugas lengkap", () => {
    const task = {
      url: "https://youtube.com/watch?v=123",
      clips: [
        { start: "00:01:00", end: "00:01:30" },
        { start: "120", end: "150" }
      ]
    };
    expect(() => Schema.decodeSync(TaskSchema)(task)).not.toThrow();
  });
});
