# Smart Grocery & Budget Safety Tracker (PWA) 🛒

Aplikasi Web Mobile Berbasis PWA (Progressive Web App) yang dirancang khusus dengan gaya *Native Mobile App* untuk **siswa/mahasiswa rantau** yang berbelanja bulanan sambil mendorong troli supermarket.

---

## 📱 Arsitektur & Standar Tampilan Mobile

1. **Format Layar Smartphone**: Tampilan dibatasi maksimal **430px** dan terpusat (*centered*) otomatis di layar browser desktop dengan frame elegan, serta *full-bleed* di smartphone asli.
2. **Bottom Navigation Bar (Melayang)**: Navigasi bawah ramah jempol dengan 3 tab utama:
   - **Belanja**: Keranjang aktif troli, filter kategori, dan pencarian cepat.
   - **Riwayat**: Arsip struk belanja dan katalog tren harga acuan bulan lalu.
   - **Anggaran**: Pengendali batas dompet (*safety cap*), diagram distribusi pengeluaran, dan modul integrasi Cloud Database Firebase Firestore.
3. **Ergonomi Ramah Jempol**: Tombol *stepper* (+ dan -) berukuran $\ge 44\text{px}$, modal *bottom-sheet drawer*, getaran haptik (*haptic vibration*), dan tanpa tabel desktop yang melebar ke samping.
4. **PWA Standalone & Offline Ready**: Dilengkapi `manifest.json`, Service Worker (`sw.js`), ikon resolusi tinggi (192x192 & 512x512), dan *fallback* SVG internal sehingga tetap berfungsi di basement supermarket tanpa sinyal internet.

---

## 📋 Pemenuhan Kebutuhan Fungsional (SRS Checklist)

| Kode SRS | Fitur & Deskripsi | Implementasi Teknis |
| :--- | :--- | :--- |
| **F-01** | **Pencatatan Item Belanja Lengkap** | Form modal input dengan nama produk (*auto-suggest* dari histori harga), kategori (sembako, sabun/kebersihan, makanan instan, segar/sayur, minuman, lainnya), satuan (kg, liter, pcs, pack, botol, dll), kuantitas, harga satuan saat ini, dan harga acuan bulan lalu. |
| **F-02** | **Perhitungan Kuantitas Otomatis** | Tombol *stepper* (+ dan -) ramah jempol langsung pada kartu belanjaan dan modal. Perubahan kuantitas langsung memicu kalkulasi realtime subtotal item, total keranjang, dan indikator anggaran tanpa tombol hitung manual. |
| **F-03** | **Kalkulator Diskon Bertingkat** | Mendukung diskon tunggal (`25%` atau `-Rp 5.000`) dan diskon bertumpuk (`50%+20%`). Menggunakan rumus matematis bertingkat yang benar: $\text{Harga Akhir} = P_0 \times (1 - d_1) \times (1 - d_2)$, bukan penjumlahan persentase langsung. |
| **F-04** | **Komparator Harga Realtime vs Bulan Lalu** | Otomatis membandingkan harga sekarang vs bulan lalu dengan indikator visual seketika:<br>• 🔺 **Panah Merah Naik (↑)** jika harga naik (disertai nominal selisih & % inflasi).<br>• 🔻 **Panah Hijau Turun (↓)** jika harga turun (hemat belanja).<br>• ⚖️ **Tanda Setara (=)** jika harga stabil. |
| **F-05** | **Pengendali Anggaran (Budget Safety Cap)** | Kartu *Safety Cap* di bagian atas dengan input batas uang saku. *Progress bar gauge* adaptif:<br>• **Hijau (< 70%)**: Aman.<br>• **Kuning (70% - 84%)**: Waspada.<br>• **Merah Berkedip / Pulse (≥ 85%)**: Bahaya mendekati limit.<br>• **Banner Peringatan & Haptik (> 100%)**: Over budget alert. |
| **F-06** | **Riwayat & Database Belanja** | Penyimpanan lokal (*LocalStorage*) persisten dengan data bawaan belanja anak kost. Modul integrasi **Firebase Firestore Cloud** siap pakai. Saat "Selesaikan Belanja" ditekan, harga saat ini otomatis disimpan menjadi data acuan "Harga Bulan Lalu" untuk sesi belanja berikutnya. |

---

## 🚀 Cara Menjalankan

Aplikasi ini tidak membutuhkan instalasi dependensi pihak ketiga (*zero external npm dependencies*). Cukup jalankan server lokal bawaan Node.js:

```bash
# Jalankan server lokal
node server.js
```

Buka peramban (browser) di smartphone atau desktop:
```
http://localhost:3000/
```

> **Tips Instalasi di Smartphone (PWA)**:
> Buka tautan di Chrome (Android) atau Safari (iOS), lalu pilih menu **"Tambahkan ke Layar Utama" (Add to Home Screen)** untuk memasangnya sebagai aplikasi asli (*standalone mode*).
