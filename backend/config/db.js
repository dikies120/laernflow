const { Pool } = require('pg');

let pool;

function initPool(config) {
  if (!pool) {
    pool = new Pool(config);
  }
}

async function getConnection() {
  try {
    const client = await pool.connect();
    
    const originalQuery = client.query.bind(client);
    
    client.execute = async function(query, binds = [], options = {}) {
      let pgQuery = query;
      let pgValues = [];
      
      pgQuery = pgQuery.replace(/FROM\s+DUAL/gi, '');
      pgQuery = pgQuery.replace(/\bNVL\(/gi, 'COALESCE(');
      pgQuery = pgQuery.replace(/\bSYSDATE\b/gi, 'CURRENT_TIMESTAMP');
      pgQuery = pgQuery.replace(/\bSYSTIMESTAMP\b/gi, 'CURRENT_TIMESTAMP');
      pgQuery = pgQuery.replace(/(\w+)\.NEXTVAL/gi, "nextval('$1')");

      if (Array.isArray(binds)) {
        pgValues = binds;
        for (let i = 0; i < binds.length; i++) {
          const regex = new RegExp(':' + (i + 1) + '\\b', 'g');
          pgQuery = pgQuery.replace(regex, '$' + (i + 1));
        }
      } else if (typeof binds === 'object' && binds !== null) {
        let i = 1;
        for (const key of Object.keys(binds)) {
          const regex = new RegExp(':' + key + '(?=\\b)', 'g');
          if (pgQuery.match(regex)) {
            pgQuery = pgQuery.replace(regex, '$' + i);
            pgValues.push(binds[key]);
            i++;
          }
        }
      }

      pgQuery = pgQuery.trim();
      if (pgQuery.endsWith(';')) {
        pgQuery = pgQuery.slice(0, -1);
      }

      try {
        const res = await originalQuery(pgQuery, pgValues);
        
        const upperCaseRows = res.rows.map(row => {
          const newRow = {};
          for (let key in row) {
            newRow[key.toUpperCase()] = row[key];
          }
          return newRow;
        });

        return {
          rows: upperCaseRows,
          rowsAffected: res.rowCount
        };
      } finally {
        
      }
    };

    const originalRelease = client.release.bind(client);
    client.release = () => {
        delete client.execute; 
        originalRelease();
    };
    
    client.close = async () => {
        client.release();
    };

    return client;
  } catch (err) {
    console.error('Error connecting to PostgreSQL database:', err);
    throw err;
  }
}

module.exports = { 
  initPool,
  getConnection, 
  closePoolAndExit: async () => {
    try {
      if (pool) {
        await pool.end();
        console.log('PostgreSQL pool closed');
      }
    } catch (err) {
      console.error('Error closing pool:', err);
    }
    process.exit(0);
  }
};
