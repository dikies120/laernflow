// backend/models/Materi.js
const mongoose = require('mongoose');

/**
 * Skema untuk Materi Pembelajaran.
 * Materi dapat berupa video, teks, atau dokumen, dan terkait dengan kelas serta quiz tertentu.
 */
const materiSchema = new mongoose.Schema({
  judul: { 
    type: String, 
    required: [true, 'Judul materi wajib diisi'],
    trim: true
  },
  deskripsiSingkat: { // Deskripsi singkat untuk tampilan di daftar materi
    type: String,
    trim: true
  },
  tipe: {
    type: String,
    enum: ['video', 'teks', 'dokumen'], // Tipe materi yang didukung
    required: [true, 'Tipe materi wajib dipilih']
  },
  kelas: { // Materi ini milik kelas mana
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Kelas',
    required: [true, 'Kelas untuk materi ini wajib dipilih']
  },
  urutan: { // Untuk mengurutkan materi dalam satu kelas (opsional)
    type: Number,
    default: 0
  },

  // Konten spesifik berdasarkan tipe
  videoUrl: { // Untuk tipe 'video'
    type: String,
    trim: true,
    // Validasi URL bisa ditambahkan jika perlu
    // validate: {
    //   validator: function(v) {
    //     // Contoh validasi URL YouTube sederhana
    //     return this.tipe !== 'video' || /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/.test(v);
    //   },
    //   message: props => `${props.value} bukan URL YouTube yang valid!`
    // }
  },
  bagianTeks: [{ // Untuk tipe 'teks', bisa terdiri dari beberapa bagian
    konten: { type: String, trim: true }, // Konten teks (bisa HTML atau Markdown)
    urutan: { type: Number, default: 1 }
  }],
  fileDokumen: { // Untuk tipe 'dokumen'
    namaAsli: String,
    namaFileDiServer: String, // Nama unik file di server
    pathFile: String,        // URL atau path relatif di server
    tipeKonten: String,      // MIME type, e.g., 'application/pdf'
    ukuranFile: Number       // Ukuran file dalam bytes
  },
  // urlEksternal: String, // Jika Anda ingin menambahkan tipe 'link'

  quiz: { // Quiz yang terkait dengan materi ini (opsional)
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz'
  },
  // Field tambahan yang mungkin berguna:
  // statusPublikasi: { type: String, enum: ['draft', 'published'], default: 'draft' },
  // tags: [String],
  // durasiEstimasiMenit: Number, // Untuk video atau teks
}, { 
  timestamps: true 
});

// Indeks untuk pencarian
materiSchema.index({ judul: 'text', deskripsiSingkat: 'text' });
materiSchema.index({ kelas: 1, urutan: 1 }); // Untuk pengurutan materi per kelas

module.exports = mongoose.model('Materi', materiSchema);
