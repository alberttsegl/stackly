# Stackly

Stackly adalah package Node.js berbasis JavaScript murni yang berfungsi untuk menganalisis error, stack trace, dan log secara otomatis langsung dari terminal, sekaligus memberikan insight dan rekomendasi perbaikan (fix suggestion) tanpa perlu IDE.

Package ini dirancang untuk membantu developer memahami penyebab error, mendeteksi recurring errors, dan belajar dari riwayat project, sehingga proses debugging menjadi lebih cepat dan terstruktur.

## Fitur Utama
- **Analyze** - Ambil stack trace dari file log, console, atau pipe input, lalu ringkas penyebab error.  
- **Watch** - Live watch log/error stream secara real-time.  
- **History Management** - Simpan error & fix suggestion per project untuk mendeteksi recurring errors.  
- **Multi-language Support** - Mendukung stack trace dari JS/Node, Python, Go, dan Java.  
- **Interactive CLI** - Terminal-friendly dengan color coding dan emoji highlight.  
- **Report Generation** - Export summary error ke HTML atau JSON untuk dokumentasi atau tim.  
- **Fix Suggestion** - Saran perbaikan otomatis dan link ke dokumentasi resmi.  
- **Custom Patterns** - Tambahkan pattern error unik project.  
- **Learning Mode** - Analisis history untuk mengenali pola recurring error.  

## Instalasi
```bash
npm install @alberttsgl/stackly