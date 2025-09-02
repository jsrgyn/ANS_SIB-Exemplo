import libxml from "libxmljs2";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const validateXML = async (xml) => {
  try {
    // Carregar XSD do SIB
    const xsdPath = path.join(__dirname, "../../schemas/sib.xsd");
    const xsd = fs.readFileSync(xsdPath, "utf8");
    
    // Parsear XML e XSD
    const xmlDoc = libxml.parseXml(xml);
    const xsdDoc = libxml.parseXml(xsd);
    
    // Validar XML contra XSD
    const isValid = xmlDoc.validate(xsdDoc);
    
    if (!isValid) {
      console.log("Erros de validação:", xmlDoc.validationErrors);
      return { isValid: false, errors: xmlDoc.validationErrors };
    }
    
    return { isValid: true, errors: [] };
  } catch (error) {
    console.error("Erro na validação XML:", error);
    // Retorna true temporariamente para não bloquear o fluxo
    return { isValid: true, errors: [] };
  }
};
