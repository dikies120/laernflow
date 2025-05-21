// backend/models/Kelas.js
const mongoose = require('mongoose');

/**
 * Skema untuk Kelas.
 * Menyimpan informasi dasar tentang kelas yang tersedia.
 */
const kelasSchema = new mongoose.Schema({
  namaKelas: { 
    type: String, 
    required: [true, 'Nama kelas wajib diisi'], // Pesan error jika tidak diisi
    unique: true, // Pastikan nama kelas unik
    trim: true // Hapus spasi di awal dan akhir
  },
  deskripsi: {
    type: String,
    trim: true
  },
  // Anda bisa menambahkan field lain jika diperlukan, misalnya:
  // tingkat: String, // Contoh: 'Dasar', 'Menengah', 'Lanjutan'
  // guruPengampu: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Jika ada relasi ke guru
}, { 
  timestamps: true // Otomatis menambahkan createdAt dan updatedAt
});

// Indeks untuk pencarian yang lebih cepat berdasarkan namaKelas
kelasSchema.index({ namaKelas: 'text' });

module.exports = mongoose.model('Kelas', kelasSchema);
