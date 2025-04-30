import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import formulaRoute from "./routes/formulas.js";
import aplicacaoRoute from "./routes/aplicacao.js";
import familiaRoute from "./routes/familia.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); // Aqui, no app principal
app.use(express.json());


app.use(express.json()); // Para garantir que o corpo das requisições seja lido
app.use('/', formulaRoute); // -> Rota de Formulas
app.use('/', aplicacaoRoute); // -> Rota de Formulas
app.use('/', familiaRoute); // -> Rota de Formulas

app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});
