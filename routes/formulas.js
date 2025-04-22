import express from "express";
import pg from "pg";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;
const formulaRoute = express.Router();

// Conexão com o banco
const pool = new Pool({
  connectionString: process.env.CONNECTION_STRING
});

formulaRoute.use(express.json());
formulaRoute.use(cors());

//-------------- Rota para Buscar as Formulas -----------------------------------
formulaRoute.get("/formulas", async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT * FROM formula");
    client.release();

    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar fórmulas:", err);
    res.status(500).json({ error: "Erro ao buscar fórmulas" });
  }
});


//------------- Funcão de Busca Individual de Formula -----------------------------------
formulaRoute.get("/formula/:id", async (req, res) => {
    const id = req.params.id; // -> busca o id
  
    try {
      const client = await pool.connect();
      
      // Usando parâmetro para evitar SQL Injection
      const sql = "SELECT * FROM formula WHERE id = $1";
      const result = await client.query(sql, [id]);
      
      client.release();
  
      if (result.rows.length === 0) {
        res.status(404).json({ error: "Fórmula não encontrada" });
      } else {
        res.json(result.rows[0]); // retorna apenas uma fórmula
      }
  
    } catch (err) {
      console.error("Erro ao buscar fórmula:", err);
      res.status(500).json({ error: "Erro ao buscar fórmula" });
    }
  });
  

export default formulaRoute;
