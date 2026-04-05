import { parseCSVToJSON } from "../services/csvService.js";
import { generateXML } from "../services/xmlService.js";
import { validateXML } from "../validators/xmlValidator.js";
import { validateANSAlgorithms } from "../validators/ansAlgorithmValidator.js";
import { logger } from "../utils/logger.js";
import fs from "fs";

export const uploadCSV = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Arquivo não enviado" });
    }

    logger.info(`Arquivo recebido: ${req.file.filename} (${req.file.originalname})`);
    res.json({
      filePath: req.file.path,
      filename: req.file.filename,
      originalName: req.file.originalname,
    });
  } catch (error) {
    logger.error("Erro no upload", { error: error.message });
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
      versaoAplicativo = "1.00",
      motivoNaoEnvioBeneficiarios,
      cnpjDestino = "03589068000146",
      tipoTransacao = "ATUALIZACAO SIB",
      versaoPadrao = process.env.SIB_SCHEMA_VERSION || "1.2",
    } = req.body;

    // Valida campos obrigatórios do cabeçalho
    if (!registroANS || registroANS.length !== 6) {
      return res.status(400).json({ error: "Registro ANS é obrigatório e deve ter 6 dígitos" });
    }
    if (!nomeAplicativo) {
      return res.status(400).json({ error: "Nome do aplicativo é obrigatório" });
    }
    if (!fabricanteAplicativo) {
      return res.status(400).json({ error: "Fabricante do aplicativo é obrigatório" });
    }

    const xmlOptions = {
      sequencialTransacao,
      registroANS,
      nomeAplicativo,
      fabricanteAplicativo,
      versaoAplicativo,
      motivoNaoEnvioBeneficiarios,
      cnpjDestino,
      tipoTransacao,
      versaoPadrao,
    };

    // Caso sem beneficiários (motivo 61 ou 62)
    if (motivoNaoEnvioBeneficiarios === "61" || motivoNaoEnvioBeneficiarios === "62") {
      const xml = generateXML([], xmlOptions);
      const fileName = buildFileName(registroANS, xml);
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

    filePathToDelete = filePath;
    logger.info(`Processando arquivo: ${filePath}`);

    const { results: movements, errors: csvErrors } = await parseCSVToJSON(filePath);
    logger.info(`Movimentos parseados: ${movements.length} válido(s), ${csvErrors.length} rejeitado(s)`);

    if (movements.length === 0) {
      return res.status(422).json({
        error: csvErrors.length > 0
          ? "Nenhuma linha válida encontrada. Verifique os erros de validação."
          : "Nenhum registro válido encontrado no arquivo CSV",
        totalProcessados: 0,
        totalRejeitados: csvErrors.length,
        errosCSV: csvErrors,
      });
    }

    // Validação dos algoritmos ANS (dígitos verificadores + regras de negócio)
    const algResult = validateANSAlgorithms(movements);
    if (!algResult.valid) {
      algResult.errors.forEach((e) =>
        logger.warn(`[ALG] Linha ${e.row}: campo '${e.field}' = '${e.value}' — ${e.message}`)
      );
      logger.warn(`Geração de XML bloqueada: ${algResult.errors.length} erro(s) de validação ANS`);
      return res.status(422).json({
        error: "Erros de validação ANS encontrados. Corrija os dados e tente novamente.",
        algorithmErrors: algResult.errors,
      });
    }

    const xml = generateXML(movements, xmlOptions);
    const fileName = buildFileName(registroANS, xml);
    const validationResult = await validateXML(xml);

    res.json({
      xml,
      fileName,
      isValid: validationResult.isValid,
      errors: validationResult.errors || [],
      recordCount: movements.length,
      totalProcessados: movements.length,
      totalRejeitados: csvErrors.length,
      errosCSV: csvErrors,
      warnings: validationResult.warnings || [],
    });
  } catch (err) {
    logger.error("Erro no processamento do CSV", { error: err.message });
    res.status(500).json({ error: err.message || "Erro ao processar arquivo CSV" });
  } finally {
    if (filePathToDelete && fs.existsSync(filePathToDelete)) {
      try {
        fs.unlinkSync(filePathToDelete);
      } catch (unlinkErr) {
        logger.error("Erro ao remover arquivo temporário", { error: unlinkErr.message });
      }
    }
  }
};

function buildFileName(registroANS, xml) {
  const dateMatch = xml.match(/<dataHoraRegistroTransacao>(.*?)<\/dataHoraRegistroTransacao>/);
  if (dateMatch) {
    const formattedDate = dateMatch[1].replace(/[-T:\s]/g, "").slice(0, 14);
    return `${registroANS}${formattedDate}.SBX`;
  }
  const now = new Date();
  const ts = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("");
  return `${registroANS}${ts}.SBX`;
}
