import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
dotenv.config();
import routes from "./routes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, "../public")));

// Rotas da API
app.use("/api", routes);

// Rota para servir o frontend na rota /sib
app.get("/sib", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "index.html"));
});

// Rota raiz redireciona para /sib
app.get("/", (req, res) => {
  res.redirect("/sib");
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse o sistema em: http://localhost:${PORT}/sib`);
});
