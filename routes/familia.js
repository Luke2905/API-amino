import express from "express";
import pg from "pg";
import cors from "cors";
import dotenv from "dotenv";
import { v4 as uuidv4 } from 'uuid';  //-> Biblioteca para gerar o id aleatório



dotenv.config();

const { Pool } = pg;
const familiaRoute = express.Router();

// Conexão com o banco
const pool = new Pool({
  connectionString: process.env.CONNECTION_STRING
});

familiaRoute.use(express.json());
familiaRoute.use(cors());

/* ------------------ Listar Familias */
familiaRoute.get("/familias", async (req, res) => {
    try {
      const client = await pool.connect();
      const result = await client.query("SELECT * FROM familia ORDER BY titulo ASC");
      client.release();
  
      res.json(result.rows);
    } catch (err) {
      console.error("Erro ao buscar fórmulas:", err);
      res.status(500).json({ error: "Erro ao buscar fórmulas" });
    }
  });
  
  export default familiaRoute;