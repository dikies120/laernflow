const oracledb = require('oracledb');

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECT_STRING
};

async function getConnection() {
  try {
    const connection = await oracledb.getConnection(dbConfig);
    
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
