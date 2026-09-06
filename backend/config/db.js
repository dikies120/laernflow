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
    
    // Wrapper for Oracle's execute to simulate its behavior for pg
    const originalQuery = client.query.bind(client);
    
    client.execute = async function(query, binds = [], options = {}) {
      let pgQuery = query;
      let pgValues = [];
      
      // Clean up common Oracle syntax
      pgQuery = pgQuery.replace(/FROM\s+DUAL/gi, '');
      pgQuery = pgQuery.replace(/\bNVL\(/gi, 'COALESCE(');
      pgQuery = pgQuery.replace(/\bSYSDATE\b/gi, 'CURRENT_TIMESTAMP');
      pgQuery = pgQuery.replace(/\bSYSTIMESTAMP\b/gi, 'CURRENT_TIMESTAMP');
      // Convert Oracle Sequence to Postgres sequence
      pgQuery = pgQuery.replace(/(\w+)\.NEXTVAL/gi, "nextval('$1')");

      // Handle bindings (Oracle uses :key, Postgres uses $1, $2)
      if (Array.isArray(binds)) {
        pgValues = binds;
        // In array mode, if the query has :1, :2, etc, replace them with $1, $2
        for (let i = 0; i < binds.length; i++) {
          const regex = new RegExp(':' + (i + 1) + '\\b', 'g');
          pgQuery = pgQuery.replace(regex, '$' + (i + 1));
        }
      } else if (typeof binds === 'object' && binds !== null) {
        let i = 1;
        for (const key of Object.keys(binds)) {
          // Find the parameter in the query and replace it with $i
          const regex = new RegExp(':' + key + '(?=\\b)', 'g');
          if (pgQuery.match(regex)) {
            pgQuery = pgQuery.replace(regex, '$' + i);
            pgValues.push(binds[key]);
            i++;
          }
        }
      }

      // Sometimes trailing semi-colons from Oracle break Postgres node client
      pgQuery = pgQuery.trim();
      if (pgQuery.endsWith(';')) {
        pgQuery = pgQuery.slice(0, -1);
      }

      try {
        const res = await originalQuery(pgQuery, pgValues);
        // Postgres returns { rows: [], rowCount: number }
        // Oracle returns { rows: [], rowsAffected: number }
        // Postgres returns lowercase keys, Oracle returns uppercase keys.
        // We must convert keys to uppercase to emulate Oracle.
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
        if (options.autoCommit === true || options.autoCommit === undefined) {
          // pg driver auto commits by default unless in a transaction block
          // no explicit action needed unless we want to commit a manual transaction
        }
      }
    };

    // Make sure release is called properly when we're done
    const originalRelease = client.release.bind(client);
    client.release = () => {
        // clean up our custom execute method before releasing
        delete client.execute; 
        originalRelease();
    };
    
    // In oracle we also sometimes call close(), map it to release()
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

