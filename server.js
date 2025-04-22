require("dotenv").config(); // conexão com o arquivo .env

const port = process.env.PORT;

const express = require("express");

const app = express();

app.get("/", (request,response) => { //criação da rota
    response.json({message: "Rota funcionando"})
})

app.listen(port);

console.log("Backend Rodando");