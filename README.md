# Taskly — To Do List

Website to-do list dengan tampilan premium, dibuat dengan HTML, CSS, dan JavaScript murni.

## Cara menjalankan
1. Ekstrak ZIP.
2. Buka `index.html` di browser.
3. Tidak membutuhkan XAMPP, database, Node.js, atau instalasi tambahan.

Font (Bricolage Grotesque dan Instrument Sans) dimuat dari Google Fonts. Tanpa internet, tampilan tetap berfungsi dengan font bawaan sistem.

## Fitur

**Tugas**
- Tambah, tandai selesai, hapus (bisa diurungkan)
- Tenggat dan prioritas (rendah, sedang, tinggi)
- Kategori: Kerja, Pribadi, Belajar, Belanja, Kesehatan
- Catatan dan subtugas (checklist) per tugas
- Tugas berulang: harian, mingguan, bulanan. Saat selesai, tugas berikutnya dibuat otomatis
- Bintang: tugas berbintang selalu tampil paling atas
- Detail tugas dibuka lewat judul atau ikon pensil

**Input cepat**
- Ketik `Rapat besok #kerja !tinggi` untuk mengisi tenggat (`hari ini`, `besok`, `lusa`), kategori (`#kerja`, `#pribadi`, …), dan prioritas (`!rendah`, `!sedang`, `!tinggi`) sekaligus

**Fokus dan produktivitas**
- Kartu Fokus menampilkan tugas berikutnya (urut tenggat, lalu prioritas)
- Timer fokus 25 menit dan istirahat 5 menit, dengan bunyi saat selesai dan hitung mundur di judul tab
- Cincin progress dan jumlah sesi fokus hari ini
- Statistik: tugas selesai 7 hari terakhir, streak, sesi fokus, dan progres per kategori

**Mencari dan menyaring**
- Cari di judul dan catatan
- Filter: semua, hari ini, belum selesai, terlambat, berbintang, selesai
- Filter kategori dari sidebar
- Urutkan: terbaru, terlama, tenggat, prioritas, abjad

**Tampilan dan data**
- Mode terang dan gelap, plus 5 pilihan warna aksen
- Ekspor TXT, ekspor dan impor JSON (cadangan)
- Responsif untuk desktop dan mobile
- Data tersimpan otomatis di `localStorage` dan tetap kompatibel dengan data versi lama

## Pintasan keyboard
- `/` cari
- `n` tugas baru
- `f` mulai atau jeda timer fokus
