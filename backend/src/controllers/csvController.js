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
      });
      // Extrair dataHoraRegistroTransacao para nome do arquivo
      const match = xml.match(/<dataHoraTransacao>(.*?)<\/dataHoraTransacao>/);
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

    // Parse CSV para JSON
    const jsonData = await parseCSVToJSON(filePath);
    console.log("Dados CSV parseados:", jsonData.length, "registros");

    // Gerar XML com dados adicionais
    const xml = generateXML(jsonData, {
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
    // Gerar nome de arquivo conforme registroANS e dataHoraTransacao
    const dateMatch = xml.match(
      /<dataHoraTransacao>(.*?)<\/dataHoraTransacao>/,
    );
    const dateTime = dateMatch ? dateMatch[1] : new Date().toISOString();
    const formattedDate = dateTime.replace(/[-T:]/g, "").slice(0, 14);
    const fileName = `${registroANS}${formattedDate}.SBX`;
    const validationResult = await validateXML(xml);

    // Limpar arquivo temporário
    fs.unlinkSync(filePath);

    res.json({
      xml,
      fileName,
      isValid: validationResult.isValid,
      errors: validationResult.errors || [],
      recordCount: jsonData.length,
    });
  } catch (err) {
    console.error("Erro no processamento:", err);
    res.status(500).json({ error: err.message });
  }
};
