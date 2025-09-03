import libxml from "libxmljs2";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const validateXML = async (xml) => {
  try {
    const xsdPath = path.join(__dirname, "../../schemas/sib.xsd");
    const xsd = fs.readFileSync(xsdPath, "utf8");

    const xmlDoc = libxml.parseXml(xml);
    const xsdDoc = libxml.parseXml(xsd);

    const isValid = xmlDoc.validate(xsdDoc);

    if (!isValid) {
      return { isValid: false, errors: xmlDoc.validationErrors };
    }

    return { isValid: true, errors: [] };
  } catch (error) {
    return { isValid: false, errors: [error.message] };
  }
};
