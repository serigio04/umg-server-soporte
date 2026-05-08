const oracledb = require('oracledb');

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECTION,
  poolMin: 2,
  poolMax: 10,
  poolIncrement: 1
};

async function initDB() {
  try {
    await oracledb.createPool(dbConfig);
    console.log('Conexión a Oracle establecida');
  } catch (err) {
    console.error('Error conectando a Oracle:', err);
    process.exit(1);
  }
}

async function getConnection() {
  return await oracledb.getConnection();
}

module.exports = { initDB, getConnection };