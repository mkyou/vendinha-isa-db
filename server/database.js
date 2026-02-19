const { Pool, types } = require('pg');

// Force numeric/decimal (OID 1700) to be parsed as float, not string
types.setTypeParser(1700, (val) => parseFloat(val));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Supabase/Heroku/etc
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool: pool
};
