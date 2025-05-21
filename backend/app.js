const express = require('express');
const bodyParser = require('body-parser'); // Anda bisa hapus ini jika sudah menggunakan express.json() dan express.urlencoded()
const authRoutes = require('./routes/auth');
const oracledb = require('oracledb');
const { closePoolAndExit } = require('./db'); // Pastikan path ini benar
const cors = require('cors');
const adminRoutes = require('./routes/admin');
const materiRoutes = require('./routes/materi');
const usersRoutes = require('./routes/users');
const path = require('path'); // Tambahkan ini untuk manipulasi path

const app = express();
app.use(cors());

const PORT = process.env.PORT || 5000;

// Middleware
// app.use(bodyParser.json()); // Sudah digantikan oleh express.json()
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Tambahkan ini untuk parsing form data non-file (meskipun multer akan handle file)

// Menyajikan file statis dari direktori 'uploads'
// Ini memungkinkan akses ke file via URL seperti http://localhost:5000/uploads/dokumen_materi/namafile.pdf
// Pastikan direktori 'uploads/dokumen_materi' ada di root folder backend Anda, atau sesuaikan path.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Inisialisasi Rute API Anda
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/materi', materiRoutes);
app.use('/api/users', usersRoutes);

// Inisialisasi koneksi pool Oracle
async function initOracleClient() {
  try {
    await oracledb.createPool({
      user: process.env.DB_USER || 'C##LEARNFLOW',
      password: process.env.DB_PASSWORD || 'learnflow',
      connectString: process.env.DB_CONNECT_STRING || 'DESKTOP-5E9D24S/scl', // Pastikan ini benar untuk lingkungan Anda
      poolMin: 2,
      poolMax: 10,
      poolIncrement: 1
    });
    console.log('Oracle database pool initialized');
  } catch (err) {
    console.error('Oracle pool initialization error:', err);
    process.exit(1);
  }
}

// Root endpoint
app.get('/', (req, res) => {
  res.send('Oracle + Express Auth API Ready');
});

// Start server
async function startServer() {
  try {
    await initOracleClient();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Server startup error:', err);
    process.exit(1);
  }
}

// Penanganan shutdown dengan baik
process.on('SIGTERM', closePoolAndExit);
process.on('SIGINT', closePoolAndExit);

// Mulai server
startServer();