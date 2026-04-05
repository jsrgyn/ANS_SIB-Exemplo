import { Router } from "express";
import upload from "../config/multerConfig.js";
import { uploadCSV, processCSV } from "../controllers/csvController.js";

const router = Router();

router.post("/upload", (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        const maxMB = Math.round((parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024) / 1024 / 1024);
        return res.status(413).json({ error: `Arquivo excede o tamanho máximo permitido (${maxMB}MB).` });
      }
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, uploadCSV);

router.post("/process", processCSV);

export default router;
