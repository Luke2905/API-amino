import express from "express";
import pg from "pg";
import cors from "cors";
import dotenv from "dotenv";
import { v4 as uuidv4 } from 'uuid';  //-> Biblioteca para gerar o id aleatório
//import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto';


function sha1Hash(text) {
  return crypto
    .createHash('sha1')
    .update(text, 'utf8')        // mesmo encoding que no C#
    .digest('hex')               // retorna hexadecimal
    .toUpperCase();              // igual ao BitConverter no C#
}

dotenv.config();

const { Pool } = pg;
const PublicRoutes = express.Router();

// Conexão com o banco
const pool = new Pool({
  connectionString: process.env.CONNECTION_STRING
});

const JWT_SECRET = process.env.JWT_SECRET //-> process é usado para acessar o arquivo .env

PublicRoutes.use(express.json()) //-> indica para o express que ele vai receber os dados via JSON


PublicRoutes.use(cors()) //-> Configura o backend para aceitar a requisição do frontend


/* ----------------------------------- Login ----------------------------------- */
PublicRoutes.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  try {
    const client = await pool.connect();

    const result = await client.query(
      `select 
        us.nome,
        us.email,
        us.senha,
        p.nome as perfil,
        case 
          when us.ativo = true then 'Ativo'
          else 'Inativo'
        end situação
        from usuario us
        inner join "usuarioPerfil" up on up."idUsuario" = us.id
        inner join perfil p on p.id = up."idPerfil"
        WHERE email = $1 LIMIT 1`,
            [email]
    );

    client.release();

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Usuário não encontrado" });
    }

    const usuario = result.rows[0];

    // Verifica senha (hash SHA1)
    const senhaHash = sha1Hash(senha);
    if (senhaHash !== usuario.senha) {
      return res.status(401).json({ error: "Senha inválida",senhaHash });
    }

    // Gera o token JWT
    const token = jwt.sign(
      {
        id: usuario.id,
        nome: usuario.nome
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil
      }
    });

  } catch (err) {
    console.error("Erro ao autenticar:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});
/*-------------------------------------- FIM LOGIN ----------------------------- */


export default PublicRoutes
