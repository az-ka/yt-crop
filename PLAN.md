# YT-Crop Batch: Rencana Pengembangan (Effect TS)

Aplikasi CLI sederhana untuk mengunduh satu video YouTube dan memotongnya menjadi beberapa bagian (multiple clips) secara otomatis dan efisien.

## 1. Teknologi & Alat (Tech Stack)
*   **Bahasa**: TypeScript (Node.js v24).
*   **Framework Utama**: **Effect TS** (untuk penanganan error, manajemen sumber daya/resource, dan konkurensi).
*   **CLI Interface**: `@clack/prompts` (untuk pengalaman "Wizard" tanya-jawab yang cantik).
*   **Mesin Pengunduh**: `yt-dlp` (standar industri untuk download video).
*   **Mesin Pemotong**: `ffmpeg` (untuk pemotongan video yang cepat dan akurat).
*   **Skema Validasi**: `@effect/schema` (memastikan input waktu dan URL benar).

## 2. Fitur Utama
*   **Single Download, Multi Crop**: Video mentah hanya diunduh satu kali, lalu dipotong menjadi banyak bagian. Sangat hemat kuota.
*   **Interactive Wizard**: Tanya-jawab sederhana untuk memasukkan URL dan rentang waktu (Start -> End).
*   **Automatic Cleanup**: Video mentah berukuran besar akan **otomatis dihapus** segera setelah semua potongan selesai dibuat, bahkan jika aplikasi error atau dimatikan paksa (Ctrl+C).
*   **Smart Concurrency**: Mengatur jumlah proses pemotongan yang berjalan bersamaan agar tidak membuat laptop lemot/panas.
*   **Error Isolation**: Jika satu potongan gagal, potongan lainnya tetap lanjut.

## 3. Alur Penggunaan (User Flow)

### Tahap 1: Pengumpulan Data (Input)
1.  User menjalankan aplikasi.
2.  Aplikasi meminta 1 URL YouTube.
3.  **Loop Potongan**:
    *   User memasukkan waktu **Mulai** (Contoh: `01:30` atau `90`).
    *   User memasukkan waktu **Selesai** (Contoh: `02:00` atau `120`).
    *   Aplikasi bertanya: *"Tambah potongan lain?"*
    *   Jika **Ya**: Ulangi input waktu.
    *   Jika **Tidak**: Lanjut ke eksekusi.

### Tahap 2: Eksekusi (Internal Process)
1.  **Download**: Mengunduh video kualitas terbaik ke folder `temp/`.
2.  **Processing**:
    *   Membaca daftar waktu yang diberikan.
    *   Menjalankan `ffmpeg` untuk setiap rentang waktu secara efisien (menggunakan `-ss` dan `-to`).
    *   Menyimpan hasil ke folder `output/`.
3.  **Cleanup**: Menghapus file di folder `temp/`.

## 4. Arsitektur Kode (Effect TS Layers)
*   **`DownloaderService`**: Menangani perintah shell ke `yt-dlp`.
*   **`CropperService`**: Menangani perintah shell ke `ffmpeg`.
*   **`WizardService`**: Mengelola UI interaktif dan validasi input.
*   **`MainProgram`**: Menyatukan semua service dalam satu pipeline yang aman (menggunakan `Effect.gen` dan `Effect.scoped`).

## 5. Struktur Folder (Rencana)
```text
yt-download/
├── src/
│   ├── index.ts        # Entry point
│   ├── services/       # Downloader, Cropper, Wizard
│   ├── schemas/        # Validasi input
│   └── utils/          # Helper (format waktu, shell runner)
├── output/             # Hasil potongan video (.mp4)
├── temp/               # Video mentah (akan dihapus otomatis)
└── PLAN.md             # Dokumen ini
```

## 6. Risiko & Mitigasi
*   **Format Waktu**: User mungkin memasukkan format yang salah (misal: `1:3:300`). Mitigasi: Validasi ketat menggunakan Regex dan Schema.
*   **Penyimpanan Penuh**: Video YouTube 4K bisa sangat besar. Mitigasi: Cek keberadaan file dan hapus segera setelah diproses.
*   **Proses Macet**: `yt-dlp` terkadang lambat. Mitigasi: Menambahkan *timeout* dan log progres yang jelas.
