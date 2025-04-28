import express from "express";
import { v4 as uuidv4 } from "uuid";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pg;
const aplicacaoRoute = express.Router();

// Conexão com o banco
const pool = new Pool({
  connectionString: process.env.CONNECTION_STRING
});

aplicacaoRoute.use(express.json());

// Criar Aplicação
aplicacaoRoute.post("/Criar", async (req, res) => {
  const { nome, descricao, ...resto } = req.body;

  const novaAplicacao = {
    id: uuidv4(),
    data_criacao: new Date(),
    nome,
    descricao,
    ...resto
  };

  try {
    const client = await pool.connect();
    const query = `
      INSERT INTO aplicacao (id, nome, descricao, data_criacao)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [
      novaAplicacao.id,
      novaAplicacao.nome,
      novaAplicacao.descricao,
      novaAplicacao.data_criacao
    ];
    const result = await client.query(query, values);
    client.release();

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao criar aplicação:", err);
    res.status(500).json({ error: "Erro ao criar aplicação" });
  }
});

// Alterar Aplicação
aplicacaoRoute.post("/Alterar", async (req, res) => {
  const { id, nome, descricao } = req.body;

  try {
    const client = await pool.connect();
    const query = `
      UPDATE aplicacao
      SET nome = $1, descricao = $2, data_criacao = $3
      WHERE id = $4
      RETURNING *
    `;
    const result = await client.query(query, [nome, descricao, new Date(), id]);
    client.release();

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao alterar aplicação:", err);
    res.status(500).json({ error: "Erro ao alterar aplicação" });
  }
});

// Listar Aplicações
aplicacaoRoute.get("/Listar", async (_req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT * FROM aplicacao");
    client.release();

    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao listar aplicações:", err);
    res.status(500).json({ error: "Erro ao listar aplicações" });
  }
});

// Deletar Aplicação
aplicacaoRoute.get("/Deletar", async (req, res) => {
  const { id } = req.query;

  try {
    const client = await pool.connect();
    const result = await client.query("DELETE FROM aplicacao WHERE id = $1 RETURNING *", [id]);
    client.release();

    if (result.rowCount === 0) {
      res.status(404).json({ error: "Aplicação não encontrada" });
    } else {
      res.json(result.rows[0]);
    }
  } catch (err) {
    console.error("Erro ao deletar aplicação:", err);
    res.status(500).json({ error: "Erro ao deletar aplicação" });
  }
});

export default aplicacaoRoute;
