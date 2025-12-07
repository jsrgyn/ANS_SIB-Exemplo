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
      versaoAplicativo = "1.00",
      motivoNaoEnvioBeneficiarios,
      cnpjDestino = "03589068000146",
      tipoTransacao = "ATUALIZACAO SIB",
      versaoPadrao = "1.1",
    } = req.body;

    // Valida campos obrigatórios
    if (!registroANS || registroANS.length !== 6) {
      return res.status(400).json({
        error: "Registro ANS é obrigatório e deve ter 6 dígitos",
      });
    }

    if (!nomeAplicativo) {
      return res.status(400).json({
        error: "Nome do aplicativo é obrigatório",
      });
    }

    if (!fabricanteAplicativo) {
      return res.status(400).json({
        error: "Fabricante do aplicativo é obrigatório",
      });
    }

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
        versaoAplicativo,
        motivoNaoEnvioBeneficiarios,
        cnpjDestino,
        tipoTransacao,
        versaoPadrao,
      });

      // Extrair dataHoraRegistroTransacao do XML para gerar nome do arquivo
      const dateMatch = xml.match(
        /<dataHoraRegistroTransacao>(.*?)<\/dataHoraRegistroTransacao>/,
      );

      let fileName;
      if (dateMatch) {
        // Formatar data para YYYYMMDDHHMISS
        const dateStr = dateMatch[1];
        // Remove todos os caracteres não numéricos: -, T, :, e espaços
        const formattedDate = dateStr.replace(/[-T:\s]/g, "").slice(0, 14);
        fileName = `${registroANS}${formattedDate}.SBX`;
      } else {
        // Fallback: usar data atual
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");
        fileName = `${registroANS}${year}${month}${day}${hours}${minutes}${seconds}.SBX`;
      }

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

    if (movements.length === 0) {
      return res.status(400).json({
        error: "Nenhum registro válido encontrado no arquivo CSV",
      });
    }

    // Gerar XML com dados adicionais
    const xml = generateXML(movements, {
      sequencialTransacao,
      registroANS,
      nomeAplicativo,
      fabricanteAplicativo,
      versaoAplicativo,
      motivoNaoEnvioBeneficiarios,
      cnpjDestino,
      tipoTransacao,
      versaoPadrao,
    });

    // Gerar nome de arquivo conforme padrão ANS: {registroANS}{YYYYMMDDHHMISS}.SBX
    const dateMatch = xml.match(
      /<dataHoraRegistroTransacao>(.*?)<\/dataHoraRegistroTransacao>/,
    );

    let fileName;
    if (dateMatch) {
      // Formatar data para YYYYMMDDHHMISS
      const dateStr = dateMatch[1];
      // Remove todos os caracteres não numéricos: -, T, :, e espaços
      const formattedDate = dateStr.replace(/[-T:\s]/g, "").slice(0, 14);
      fileName = `${registroANS}${formattedDate}.SBX`;
    } else {
      // Fallback: usar data atual
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      fileName = `${registroANS}${year}${month}${day}${hours}${minutes}${seconds}.SBX`;
    }

    const validationResult = await validateXML(xml);

    res.json({
      xml,
      fileName,
      isValid: validationResult.isValid,
      errors: validationResult.errors || [],
      recordCount: movements.length,
      warnings: validationResult.warnings || [],
    });
  } catch (err) {
    console.error("Erro no processamento:", err);
    res.status(500).json({
      error: err.message || "Erro ao processar arquivo CSV",
    });
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
