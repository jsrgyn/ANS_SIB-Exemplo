import { parseCSVToJSON } from "../services/csvService.js";
import { generateXML } from "../services/xmlService.js";
import { validateXML } from "../validators/xmlValidator.js";
import fs from "fs";

export const uploadCSV = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Arquivo não enviado" });
    }

    console.log("Arquivo recebido:", req.file.filename);
    res.json({
      filePath: req.file.path,
      filename: req.file.filename,
      originalName: req.file.originalname,
    });
  } catch (error) {
    console.error("Erro no upload:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

export const processCSV = async (req, res) => {
  let filePathToDelete = null;

  try {
    const {
      filePath,
      sequencialTransacao,
      registroANS,
      nomeAplicativo,
      fabricanteAplicativo,
      motivoNaoEnvioBeneficiarios,
      cnpjDestino = "",
      tipoTransacao = "ATUALIZACAO SIB",
      versaoPadrao = "1.1",
      versaoAplicativo = "1.00",
    } = req.body;

    if (
      motivoNaoEnvioBeneficiarios === "61" ||
      motivoNaoEnvioBeneficiarios === "62"
    ) {
      // Gerar XML sem arquivo de beneficiários, apenas com motivoNaoEnvioBeneficiarios
      const xml = generateXML([], {
        sequencialTransacao,
        registroANS,
        nomeAplicativo,
        fabricanteAplicativo,
        motivoNaoEnvioBeneficiarios,
        cnpjDestino,
        tipoTransacao,
        versaoPadrao,
        versaoAplicativo,
      });

      const match = xml.match(
        /<dataHoraRegistroTransacao>(.*?)<\/dataHoraRegistroTransacao>/,
      );
      const dt = match ? match[1] : new Date().toISOString();
      const fmt = dt.replace(/[-T:]/g, "").slice(0, 14);
      const fileName = `${registroANS}${fmt}.SBX`;

      const validationResult = await validateXML(xml);

      return res.json({
        xml,
        fileName,
        isValid: validationResult.isValid,
        errors: validationResult.errors || [],
        recordCount: 0,
      });
    }

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(400).json({ error: "Arquivo não encontrado" });
    }

    console.log("Processando arquivo:", filePath);
    filePathToDelete = filePath;

    // Parse CSV para JSON com estrutura correta
    const movements = await parseCSVToJSON(filePath);
    console.log("Movimentos processados:", movements.length);

    // Gerar XML com dados adicionais
    const xml = generateXML(movements, {
      sequencialTransacao,
      registroANS,
      nomeAplicativo,
      fabricanteAplicativo,
      motivoNaoEnvioBeneficiarios,
      cnpjDestino,
      tipoTransacao,
      versaoPadrao,
      versaoAplicativo,
    });

    // Gerar nome de arquivo conforme registroANS e dataHoraRegistroTransacao
    const dateMatch = xml.match(
      /<dataHoraRegistroTransacao>(.*?)<\/dataHoraRegistroTransacao>/,
    );
    const dateTime = dateMatch ? dateMatch[1] : new Date().toISOString();
    const formattedDate = dateTime.replace(/[-T:]/g, "").slice(0, 14);
    const fileName = `${registroANS}${formattedDate}.SBX`;

    const validationResult = await validateXML(xml);

    res.json({
      xml,
      fileName,
      isValid: validationResult.isValid,
      errors: validationResult.errors || [],
      recordCount: movements.length,
    });
  } catch (err) {
    console.error("Erro no processamento:", err);
    res.status(500).json({ error: err.message });
  } finally {
    // Limpar arquivo temporário se existir
    if (filePathToDelete && fs.existsSync(filePathToDelete)) {
      try {
        fs.unlinkSync(filePathToDelete);
      } catch (unlinkErr) {
        console.error("Erro ao remover arquivo temporário:", unlinkErr);
      }
    }
  }
};
