const oracledb = require('oracledb');

// Konfigurasi database Oracle
const dbConfig = {
  user: process.env.DB_USER || 'C##LEARNFLOW',
  password: process.env.DB_PASSWORD || 'learnflow',
  connectString: process.env.DB_CONNECT_STRING || 'DESKTOP-5E9D24S/scl'
};

// Fungsi untuk mendapatkan koneksi database
async function getConnection() {
  try {
    // Mengatur autoCommit ke false secara default
    const connection = await oracledb.getConnection(dbConfig);
    
    // Mengatur format output menjadi OBJECT untuk kemudahan akses properti
    connection.execute = async function(query, binds = [], options = {}) {
      const defaultOptions = { 
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        autoCommit: false
      };
      
      return await oracledb.Connection.prototype.execute.call(
        this, 
        query, 
        binds, 
        { ...defaultOptions, ...options }
      );
    };
    
    return connection;
  } catch (err) {
    console.error('Error connecting to database:', err);
    throw err;
  }
}

module.exports = { 
  getConnection, 
  closePoolAndExit: async () => {
    try {
      await oracledb.getPool().close(10);
      console.log('Pool closed');
    } catch (err) {
      console.error('Error closing pool:', err);
    }
  }
};
