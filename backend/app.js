const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const { closePoolAndExit, initPool } = require('./config/db'); 
const cors = require('cors');
const adminRoutes = require('./routes/admin');
const materiRoutes = require('./routes/materi');
const usersRoutes = require('./routes/users');
const path = require('path');
const quizRoutes = require('./routes/quiz');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const rootProjectDir = path.join(__dirname, '..'); 
const staticUploadsPath = path.join(rootProjectDir, 'uploads');

console.log('----------------------------------------------------------------------');
console.log('[SERVER] __dirname (lokasi app.js):', __dirname);
console.log('[SERVER] Root Project Directory (diasumsikan):', rootProjectDir);
console.log(`[SERVER] Mencoba menyajikan file statis untuk rute '/uploads' dari direktori absolut: ${staticUploadsPath}`);
console.log('[SERVER] Pastikan path di atas adalah lokasi folder "uploads" Anda yang benar (di root proyek, bukan di dalam folder backend).');
console.log('----------------------------------------------------------------------');

app.use('/uploads', express.static(staticUploadsPath));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/materi', materiRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/quiz', quizRoutes);

async function initPostgresClient() {
  try {
    initPool({
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_DATABASE || 'learnflow_db',
    });
    console.log('PostgreSQL database pool initialized');
  } catch (err) {
    console.error('PostgreSQL pool initialization error:', err);
    process.exit(1);
  }
}

app.get('/', (req, res) => {
  res.send('PostgreSQL + Express Auth API Ready');
});

async function startServer() {
  try {
    await initPostgresClient();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Server startup error:', err);
    process.exit(1);
  }
}

process.on('SIGTERM', closePoolAndExit);
process.on('SIGINT', closePoolAndExit);

startServer();