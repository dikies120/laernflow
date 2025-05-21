// backend/models/User.js (Contoh Modifikasi)
const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // Untuk hashing password

/**
 * Skema untuk Pengguna (User).
 * Menyimpan informasi pengguna, termasuk peran dan kelas yang diikuti (jika siswa).
 */
const userSchema = new mongoose.Schema({
  nama: {
    type: String,
    required: [true, 'Nama wajib diisi'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email wajib diisi'],
    unique: true, // Email harus unik
    lowercase: true, // Simpan email dalam huruf kecil
    trim: true,
    match: [/\S+@\S+\.\S+/, 'Format email tidak valid'] // Validasi format email dasar
  },
  password: {
    type: String,
    required: [true, 'Password wajib diisi'],
    minlength: [6, 'Password minimal 6 karakter'] // Panjang password minimal
  },
  peran: {
    type: String,
    enum: ['siswa', 'admin'], // Hanya 'siswa' atau 'admin' yang diizinkan
    default: 'siswa' // Default peran adalah siswa
  },
  kelasId: { // Relasi ke model Kelas
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Kelas',
    // 'required' bisa true jika setiap siswa wajib punya kelas saat registrasi
    // required: function() { return this.peran === 'siswa'; } // Contoh: Wajib jika peran adalah siswa
  },
  // Anda bisa menambahkan field lain seperti:
  // avatar: String, // URL ke gambar profil
  // tanggalLahir: Date,
  // materiDisimpan: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Materi' }], // Untuk fitur simpan materi
  // progressBelajar: [{ // Untuk melacak progres
  //   materiId: { type: mongoose.Schema.Types.ObjectId, ref: 'Materi' },
  //   status: { type: String, enum: ['belum_mulai', 'sedang_dipelajari', 'selesai'], default: 'belum_mulai' },
  //   quizDiselesaikan: { type: Boolean, default: false }
  // }]
}, {
  timestamps: true
});

// Middleware Pre-save untuk hash password sebelum disimpan
userSchema.pre('save', async function(next) {
  // Hanya hash password jika field password dimodifikasi (atau baru)
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10); // Generate salt
    this.password = await bcrypt.hash(this.password, salt); // Hash password
    next();
  } catch (error) {
    next(error); // Teruskan error ke middleware selanjutnya
  }
});

// Method untuk membandingkan password yang diinput dengan password di database
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

module.exports = mongoose.model('User', userSchema);
