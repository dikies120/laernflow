const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const oracledb = require('oracledb');
const { closePoolAndExit } = require('./db');
const cors = require('cors')
const adminRoutes = require('./routes/admin');
const materiRoutes = require('./routes/materi');

const app = express();
app.use(cors())

const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());  // Menghapus bodyParser.json() karena duplikasi
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/materi', materiRoutes);
// Inisialisasi koneksi pool Oracle
async function initOracleClient() {
  try {
    // Konfigurasi pool koneksi
    await oracledb.createPool({
      user: process.env.DB_USER || 'C##LEARNFLOW',
      password: process.env.DB_PASSWORD || 'learnflow',
      connectString: process.env.DB_CONNECT_STRING || 'DESKTOP-5E9D24S/scl',
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