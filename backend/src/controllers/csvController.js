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
      originalName: req.file.originalname
    });
  } catch (error) {
    console.error("Erro no upload:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

export const processCSV = async (req, res) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(400).json({ error: "Arquivo não encontrado" });
    }
    
    console.log("Processando arquivo:", filePath);
    
    // Parse CSV para JSON
    const jsonData = await parseCSVToJSON(filePath);
    console.log("Dados CSV parseados:", jsonData.length, "registros");
    
    // Gerar XML
    const xml = generateXML(jsonData);
    console.log("XML gerado com sucesso");
    
    // Validar XML
    const validationResult = await validateXML(xml);
    console.log("Validação XML:", validationResult);
    
    // Limpar arquivo temporário
    fs.unlinkSync(filePath);
    
    res.json({ 
      xml, 
      isValid: validationResult.isValid,
      errors: validationResult.errors || [],
      recordCount: jsonData.length
    });
  } catch (err) {
    console.error("Erro no processamento:", err);
    res.status(500).json({ error: err.message });
  }
};
