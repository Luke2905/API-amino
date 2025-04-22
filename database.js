import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.CONNECTION_STRING,
});

// Testa a conexão ao iniciar
pool.connect()
  .then(() => console.log("🟢 Conectado ao banco de dados"))
  .catch(err => console.error("🔴 Erro ao conectar ao banco:", err));

export default pool;
