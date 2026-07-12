# 📊 SPK DIA (Distance to the Ideal Alternative) Dashboard

![Status](https://img.shields.io/badge/Status-Completed-success)
![Tech Stack](https://img.shields.io/badge/Tech-HTML%20%7C%20CSS%20%7C%20JS-blue)

Aplikasi berbasis web **Sistem Pendukung Keputusan (SPK)** menggunakan metode **Distance to the Ideal Alternative (DIA)**. Aplikasi ini dirancang menyerupai *dashboard admin* profesional tingkat *enterprise* dengan antarmuka *Single Page Application* (SPA).

Proyek ini dikembangkan sebagai pemenuhan tugas mata kuliah oleh **Kelompok 4**.

## 👨‍💻 Tim Pengembang (Kelompok 4)
* **Muhamad Sauzan Rizki Asakir** (2113231076)
* **Muhamad Gilang Rizqy Suryana** (2113231092)

---

## ✨ Fitur Unggulan

* 🧮 **Akurasi Matematis Tingkat Tinggi:** Melakukan koreksi dan penyempurnaan perhitungan dari jurnal referensi, khususnya pada akurasi Jarak Euclidean (Nilai Preferensi $R_i$) menggunakan referensi *Positive Ideal Alternative* (PIA) yang mutlak.
* 🖥️ **Arsitektur SPA (Single Page Application):** Navigasi antar halaman (Dashboard, Data Kriteria, Alternatif, dll.) berjalan sangat mulus dan instan tanpa perlu memuat ulang (*reload*) halaman *browser*.
* 📈 **Visualisasi Data Interaktif:** Terintegrasi dengan Chart.js untuk menampilkan *Bar Chart* (Performa Ranking) dan *Pie Chart* (Distribusi Bobot) secara *real-time*.
* 🤖 **Kesimpulan Analisa Otomatis:** Sistem akan membaca hasil perhitungan akhir dan merangkai paragraf narasi kesimpulan secara dinamis dan cerdas.
* 💾 **Data Persistence (Local Storage):** Data kriteria dan alternatif yang diinputkan tidak akan hilang meskipun halaman di-*refresh*.
* 🖨️ **Ekspor & Cetak Terintegrasi:** Mendukung fitur unduh hasil *ranking* ke format **CSV** (*Excel-ready*) dan format **Cetak/Print** dengan penyesuaian CSS *print layout* khusus.

---

## 🛠️ Teknologi yang Digunakan

Proyek ini dibangun secara sengaja tanpa *framework* berat untuk menunjukkan pemahaman fundamental web yang kuat:
* **HTML5** (Semantik dan Terstruktur)
* **Vanilla CSS** (Desain kustom menyerupai standar *Admin Template* modern)
* **Vanilla JavaScript** (Manipulasi DOM dan Algoritma SPK murni)
* **Chart.js** (Via CDN, khusus untuk visualisasi grafik)

---

## 🚀 Cara Menjalankan Aplikasi

Aplikasi ini bersifat *client-side* dan sangat ringan. Anda tidak perlu menginstal Node.js, NPM, atau *server* lokal (seperti XAMPP/Laragon) untuk menjalankannya.

1. *Clone repository* ini ke komputer Anda:
   ```bash
   git clone [https://github.com/username-anda/spk-dia-dashboard.git](https://github.com/username-anda/spk-dia-dashboard.git)
