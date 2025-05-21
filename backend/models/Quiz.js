// backend/models/Quiz.js
const mongoose = require('mongoose');

/**
 * Skema untuk Pertanyaan dalam Quiz.
 * Setiap pertanyaan memiliki teks dan beberapa pilihan jawaban.
 */
const questionSchema = new mongoose.Schema({
  pertanyaan: { 
    type: String, 
    required: [true, 'Teks pertanyaan wajib diisi'],
    trim: true
  },
  pilihan: [{ // Array pilihan jawaban
    teks: { 
      type: String, 
      required: [true, 'Teks pilihan wajib diisi'],
      trim: true
    },
    isBenar: { // Menandakan apakah pilihan ini adalah jawaban yang benar
      type: Boolean, 
      default: false
    }
  }],
  // tipeSoal: { type: String, enum: ['pilihan_ganda', 'esai_singkat'], default: 'pilihan_ganda' }, // Jika ingin variasi tipe soal
  // poin: { type: Number, default: 1 }, // Poin untuk pertanyaan ini
  // penjelasanJawaban: String, // Penjelasan setelah siswa menjawab (opsional)
}, { _id: true }); // _id untuk setiap pertanyaan bisa berguna

/**
 * Skema untuk Quiz.
 * Quiz terkait dengan satu materi dan berisi daftar pertanyaan.
 */
const quizSchema = new mongoose.Schema({
  judulQuiz: { 
    type: String, 
    required: [true, 'Judul quiz wajib diisi'],
    trim: true
  },
  deskripsi: {
    type: String,
    trim: true
  },
  materiId: { // Quiz ini terkait dengan materi mana
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Materi',
    required: [true, 'Quiz harus terkait dengan satu materi']
  },
  // kelasId: { // Jika quiz ingin spesifik per kelas, bukan hanya per materi
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Kelas'
  // },
  pertanyaanList: { // Daftar pertanyaan dalam quiz
    type: [questionSchema],
    validate: [val => val.length > 0, 'Quiz harus memiliki setidaknya satu pertanyaan'] // Minimal satu pertanyaan
  },
  passingGrade: { // Nilai minimum untuk lulus quiz (dalam persentase, misal 70)
    type: Number, 
    default: 70,
    min: 0,
    max: 100
  },
  // durasiMenit: Number, // Durasi pengerjaan quiz dalam menit (opsional)
  // acakPertanyaan: { type: Boolean, default: false }, // Apakah urutan pertanyaan diacak
  // acakPilihan: { type: Boolean, default: false }, // Apakah urutan pilihan jawaban diacak
}, { 
  timestamps: true 
});

// Indeks
quizSchema.index({ materiId: 1 });
quizSchema.index({ judulQuiz: 'text' });

module.exports = mongoose.model('Quiz', quizSchema);
