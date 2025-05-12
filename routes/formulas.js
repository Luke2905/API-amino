import express from "express";
import pg from "pg";
import cors from "cors";
import dotenv from "dotenv";
import { v4 as uuidv4 } from 'uuid';  //-> Biblioteca para gerar o id aleatório



dotenv.config();

const { Pool } = pg;
const formulaRoute = express.Router();

// Conexão com o banco
const pool = new Pool({
  connectionString: process.env.CONNECTION_STRING
});



formulaRoute.use(express.json());
formulaRoute.use(cors());

//-------------- Rota para Exibir as Formulas -----------------------------------
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

//-------------- Rota para Buscar as Formulas -----------------------------------
formulaRoute.get("/busca", async (req, res) => {
  try {
    const client = await pool.connect();
  
    const query = `
      SELECT
        sis.id,
        fam.titulo AS familia_titulo,
        ap.titulo AS aplicacao_titulo,
        sis.titulo AS sistema_titulo,
        sis.descricao,
        sis.revisao,
        sis."dataCriacao",
        sis."dataUltimaRevisao"
      FROM sistema sis
      INNER JOIN familia fam ON fam.id = sis."idFamilia"
      INNER JOIN "sistemaAplicacao" sas ON sas."idSistema" = sis.id
      INNER JOIN aplicacao ap ON ap.id = sas."idAplicacao"
    `;
  
    const result = await client.query(query);
    client.release();
  
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar sistemas:", err);
    res.status(500).json({ error: "Erro ao buscar sistemas" });
  }
});


//------------- Rota de Busca Individual de Formula -----------------------------------
formulaRoute.get("/formula/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const client = await pool.connect();

    const sql = `
      SELECT 
        f.id,
        f.codigo,
        f.titulo,
        f.preco,
        f.descricao,
        f.justificativa,
        c.descricao AS componente,
        fc.ordem,
        fc.proporcao
      FROM formula f
      LEFT JOIN "formulaComponente" fc ON fc."idFormula" = f.id
      LEFT JOIN componente c ON fc."idComponente" = c.id
      WHERE f.id = $1
      ORDER BY fc.ordem ASC;
    `;
    
    const result = await client.query(sql, [id]);
    client.release();

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Fórmula não encontrada" });
    }

    // Organiza os dados
    const formulaBase = {
      id: result.rows[0].id,
      codigo: result.rows[0].codigo,
      titulo: result.rows[0].titulo,
      preco: result.rows[0].preco,
      descricao: result.rows[0].descricao,
      justificativa: result.rows[0].justificativa,
      componentes: result.rows
      .filter(row => row.componente) // só se existir componente
      .map(row => ({
        componente: row.componente,
        ordem: row.ordem,
        proporcao: row.proporcao
          }))
    };

    res.json(formulaBase);
    
  } catch (err) {
    console.error("Erro ao buscar fórmula:", err);
    res.status(500).json({ error: "Erro ao buscar fórmula" });
  }
});
  

//------------- Rota de incerção de Formula -----------------------------------
formulaRoute.post("/novaformula", async (req, res) => {

    const id = uuidv4(); //-> Geração randon de ID

    const {  titulo, preco, codigo, descricao, justificativa } = req.body;
  
    try {
      const client = await pool.connect();
  
      const sql = `
        INSERT INTO formula (id, titulo, preco, codigo, descricao, justificativa) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING *
      `;
      const result = await client.query(sql, [id, titulo, preco, codigo, descricao, justificativa]);
  
      client.release();
  
      res.status(201).json(result.rows[0]); // Retorna a fórmula criada
  
    } catch (err) {
      console.error("Erro ao inserir fórmula:", err);
      res.status(500).json({ error: "Erro ao inserir fórmula" });
    }
  });


/* ------------------ Rota para deletar uma fórmula ----------------------*/
formulaRoute.delete("/deletarFormula/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const client = await pool.connect();
    const sql = "DELETE FROM formula WHERE id = $1 RETURNING *";
    const result = await client.query(sql, [id]);
    client.release();

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Fórmula não encontrada" });
    } else {
      res.json(result.rows[0]);
    }
  } catch (err) {
    console.error("Erro ao deletar fórmula:", err);
    res.status(500).json({ error: "Erro ao deletar fórmula" });
  }
});

// Alterar Formula
formulaRoute.put("/alterarFormula/:id", async (req, res) => {
  const { titulo, preco, codigo, descricao, justificativa } = req.body;
  const { id } = req.params; // <- CORRETO, vem da URL

  try {
    const client = await pool.connect();
    const query = `
      UPDATE formula
      SET titulo = $1, preco = $2, codigo = $3, descricao = $4, justificativa = $5
      WHERE id = $6
      RETURNING *
    `;
    const result = await client.query(query, [titulo, preco, codigo, descricao, justificativa, id]);
    client.release();

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao alterar Formula:", err);
    res.status(500).json({ error: "Erro ao alterar Formula" });
  }
});
/* ------------------ Rota para Visualizar propriedades uma fórmula ----------------------*/
formulaRoute.get("/formulapropriedades/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const client = await pool.connect();

    const query = `
      SELECT 
        sis.id,  
        sis.titulo AS nome, 
        fam.titulo AS familia, 
        ap.titulo AS aplicacao,
        sis.descricao AS descricao, 
        sis.revisao, 
        sis."dataCriacao" AS criacao, 
        sis."dataUltimaRevisao" AS dt_revisao,
        p.nome AS propriedade,
        sp."valorVariacaoInferior",
        sp."valorVariacaoSuperior"
      FROM sistema sis
      INNER JOIN familia fam ON fam.id = sis."idFamilia"
      INNER JOIN "sistemaAplicacao" sas ON sas."idSistema" = sis.id
      INNER JOIN aplicacao ap ON ap.id = sas."idAplicacao"
      LEFT JOIN "sistemaPropriedade" sp ON sp."idSistema" = sis.id
      LEFT JOIN propriedade p ON p.id = sp."idPropriedade"
      WHERE sis.id = $1
    `;

    const result = await client.query(query, [id]);
    client.release();

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Fórmula não encontrada" });
    }

    // Monta o objeto base com as informações principais
    const formulaBase = {
      id: result.rows[0].id,
      nome: result.rows[0].nome,
      familia: result.rows[0].familia,
      descricao: result.rows[0].descricao,
      aplicacao: result.rows[0].aplicacao,
      revisao: result.rows[0].revisao,
      dt_revisao: result.rows[0].dt_revisao,
      propriedades: result.rows
        .filter(row => row.propriedade !== null)
        .map(row => ({
          propriedade: row.propriedade,
          valorVariacaoInferior: row.valorVariacaoInferior,
          valorVariacaoSuperior: row.valorVariacaoSuperior
        }))
    };

    return res.json(formulaBase);

  } catch (err) {
    console.error("Erro ao buscar sistemas:", err);
    return res.status(500).json({ error: "Erro ao buscar sistemas" });
  }
});

export default formulaRoute;
