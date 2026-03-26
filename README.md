# 🎥 YT-Crop Batch (Effect TS)

Aplikasi CLI sederhana dan efisien untuk mengunduh video YouTube dan memotongnya menjadi beberapa bagian (batch cropping) secara otomatis.

## ✨ Fitur Utama
- **Efisien**: Video mentah hanya diunduh satu kali, meskipun Anda membuat banyak potongan.
- **Batch Processing**: Masukkan URL satu kali, lalu tentukan daftar waktu (Mulai -> Selesai) sebanyak yang Anda mau.
- **Aman & Bersih**: Menggunakan **Effect TS** untuk manajemen sumber daya. File mentah berukuran besar akan **otomatis dihapus** segera setelah semua potongan selesai dibuat.
- **Cepat**: Menggunakan mode `copy` pada FFmpeg (tanpa re-encode) sehingga pemotongan terjadi hampir instan.
- **Interaktif**: Antarmuka tanya-jawab yang mudah digunakan.

## 🛠️ Prasyarat
Pastikan alat-alat berikut sudah terinstal di sistem Anda:
1. [Node.js](https://nodejs.org/) (v24+ disarankan)
2. [yt-dlp](https://github.com/yt-dlp/yt-dlp) (untuk mengunduh video)
3. [ffmpeg](https://ffmpeg.org/) (untuk memotong video)

## 🚀 Cara Penggunaan

1. **Instalasi Dependensi**:
   ```bash
   pnpm install
   ```

2. **Jalankan Aplikasi**:
   ```bash
   pnpm start
   ```

3. **Alur di Terminal**:
   - Masukkan URL YouTube.
   - Masukkan waktu **Mulai** (contoh: `01:30` atau `90` detik).
   - Masukkan waktu **Selesai** (contoh: `02:00` atau `120` detik).
   - Tambah potongan lain jika perlu.
   - Tunggu hingga proses selesai.

4. **Hasil**:
   - Video hasil potongan akan tersimpan di folder `output/`.
   - File mentah di folder `temp/` akan dihapus otomatis.

## 🧪 Testing
Untuk memastikan logika validasi tetap aman, jalankan:
```bash
pnpm test
```

## 🏗️ Struktur Proyek
- `src/index.ts`: Alur utama (Wizard & Orkestrasi).
- `src/services/`: Logika untuk Downloader (yt-dlp) dan Cropper (ffmpeg).
- `src/schemas/`: Validasi input menggunakan `@effect/schema`.
- `test/`: Pengujian otomatis menggunakan `vitest`.

---
Dibuat dengan ❤️ menggunakan **Effect TS**.
