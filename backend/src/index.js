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
const MAX_BODY_SIZE = process.env.MAX_FILE_SIZE
  ? `${Math.ceil(Number.parseInt(process.env.MAX_FILE_SIZE) / (1024 * 1024))}mb`
  : "50mb";

app.use(cors());
app.use(express.json({ limit: MAX_BODY_SIZE }));
app.use(express.urlencoded({ extended: true, limit: MAX_BODY_SIZE }));

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
