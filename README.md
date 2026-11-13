# 🏛️ PENDATAAN HARIAN - ATR/BPN KANTAH KOTA MEDAN

Aplikasi Web Modern untuk Pelaporan Progress Harian Plotting, Digitasi, SITATA, dan KKP Kantah Kota Medan.

Didesain dengan gaya **Soft Neo-Brutalism (Playful Neubrutalism)**, tata letak **Bento Grid**, dan skema **Split-Tone** (Dark Sidebar `#131316` + Warm Off-White Canvas `#F6F5F0`).

---

## 🌟 Fitur Utama

1. **Jadwal & TIM Pelaksana (Bento Grid Header)**:
   - Pemilihan Hari & Tanggal otomatis hari ini (format Indonesia).
   - Pilihan cepat TIM: `TIM 1`, `TIM 2`, `TIM 3`, `TIM 4`, `TIM 5`, `TIM 1 & 2`, `TIM 3 & 4`, dan nama kustom.
   - Ringkasan live total bidang dan akumulasi progress harian.

2. **Dinamis Tambah Kecamatan ("+ Tambah Kecamatan Lain")**:
   - Pengguna dapat menambah kecamatan sebanyak yang dibutuhkan.
   - Autocomplete nama kecamatan & kelurahan se-Kota Medan.
   - 7 Metrik angka utama dengan tombol cepat steppers `+/-`:
     - Berhasil Plotting
     - Digitasi
     - Overlap
     - Pemecahan
     - Belum bisa teridentifikasi
     - Dimatikan
     - Diluar Batas Administrasi
   - Penghitungan subtotal per kecamatan secara real-time.

3. **Penggabungan Otomatis Foto SITATA & KKP (Sebelum & Sesudah)**:
   - Upload foto **Sebelum** dan **Sesudah** (maksimum 10 pasang per kategori, maks 10 MB per file).
   - **Engine Canvas Otomatis**: Sistem langsung menggabungkan kedua foto secara side-by-side (berdampingan) lengkap dengan:
     - Header resmi Neo-Brutalism BPN Kantah Kota Medan.
     - Lencana kapsul merah `🔴 SEBELUM (BEFORE)` dan hijau `🟢 SESUDAH (AFTER)`.
     - Timestamp, nama kecamatan, kelurahan, dan TIM pelaksana.
     - Tanda verifikasi validasi.
   - Pratinjau ukuran penuh interaktif dan tombol unduh individual.
   - Tombol **Unduh Semua Foto Gabungan (.ZIP)** sekali klik.

4. **Integrasi Google Sheets & Google Drive**:
   - Dilengkapi panduan lengkap dan skrip **Google Apps Script** siap pakai.
   - Mengunggah foto gabungan langsung ke folder Google Drive (`DOKUMENTASI_PENDATAAN_HARIAN`).
   - Menyimpan tautan Google Drive dan seluruh data progress ke Google Sheets:
     [Publikasi Spreadsheet](https://docs.google.com/spreadsheets/d/e/2PACX-1vSBzJBw7aSjz-Tqn_pDUdxPKGDW1RM_UiEDBdWNl83BxLKgnCQIzjNE7MCK2NjI0--K1cLZEA9uTlDP/pubhtml?gid=1897439068&single=true)

5. **Format Teks WhatsApp / Telegram & Riwayat**:
   - Sekali klik untuk menyalin format teks laporan resmi siap broadcast ke grup koordinasi.
   - Ekspor data ke format CSV.
   - Riwayat pengiriman tersimpan aman di browser (LocalStorage).

---

## 🎨 Panduan Desain Soft Neo-Brutalism
- **Split-Tone**: Dark Sidebar (`#131316`) + Warm Off-White Canvas (`#F6F5F0`).
- **Cards & Buttons**: `rounded-2xl` / `rounded-3xl`, garis tepi tegas `2px/3px solid #111111`, bayangan solid `box-shadow: 4px 4px 0px #111111`.
- **Warna Pastel**: Butter Yellow (`#FEF08A`), Matcha Green (`#DCFCE7`), Soft Pink (`#FCE7F3`), Baby Blue (`#E0F2FE`), Lavender, Peach.
- **Badges**: Pill badges hitam pekat (`#111111`) dengan teks putih tebal.
- **Tipografi**: Geometric sans-serif (*Plus Jakarta Sans*) dengan hierarki angka tebal dan micro-label kapital.

---

## 🚀 Menjalankan Secara Lokal

```bash
# Install dependencies
npm install

# Jalankan server development
npm run dev

# Build untuk produksi
npm run build
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 📦 Deploy ke Vercel

Aplikasi ini 100% kompatibel dan siap dideploy langsung ke [Vercel](https://vercel.com):
1. Import repositori GitHub `bagasdwisss/pendataanharian`.
2. Framework preset akan terdeteksi otomatis sebagai **Next.js**.
3. Klik **Deploy**. Selesai!
