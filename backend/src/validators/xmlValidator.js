import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { validateXML as xmllintValidate } from "xmllint-wasm";
import { logger } from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const validateXML = async (xml) => {
  const version = process.env.SIB_SCHEMA_VERSION || "1.2";
  const schemaDir = path.join(__dirname, `../../schemas/v${version}`);
  const xsdPath = path.join(schemaDir, "sib.xsd");

  if (!fs.existsSync(xsdPath)) {
    const msg = `Schema XSD não encontrado para versão ${version}: ${xsdPath}`;
    logger.error(msg);
    return { isValid: false, errors: [{ line: 0, column: 0, message: msg, formatted: `[XSD] ${msg}` }] };
  }

  // Load the main schema and any included schemas so xmllint-wasm can resolve them
  const schemaFiles = fs.readdirSync(schemaDir)
    .filter((f) => f.endsWith(".xsd"))
    .map((f) => ({ fileName: f, contents: fs.readFileSync(path.join(schemaDir, f), "latin1") }));

  try {
    const result = await xmllintValidate({
      xml: [{ fileName: "document.xml", contents: xml }],
      schema: schemaFiles.map((f) => f.contents),
      // Pass all XSD files so includes resolve correctly
      preload: schemaFiles
        .filter((f) => f.fileName !== "sib.xsd")
        .map((f) => ({ fileName: f.fileName, contents: f.contents })),
    });

    if (result.valid) {
      logger.info(`XML validado com sucesso contra schema v${version}`);
      return { isValid: true, errors: [] };
    }

    const formattedErrors = result.errors.map((e) => {
      const lineNum = e.loc?.lineNumber ?? 0;
      const raw = (e.message || "").trim();
      const message = raw.replace(/^.+?Schemas validity error\s*:\s*/i, "").trim() || raw;
      return {
        line: lineNum,
        column: 0,
        message,
        formatted: `[XSD] Linha ${lineNum}: ${message}`,
      };
    });

    logger.error(`Validação XSD (v${version}) falhou com ${formattedErrors.length} erro(s)`, {
      schemaVersion: version,
      errors: formattedErrors,
    });

    return { isValid: false, errors: formattedErrors };
  } catch (error) {
    const msg = (error.message || "Erro desconhecido na validação").trim();
    logger.error("Erro ao validar XML", { error: msg });
    return {
      isValid: false,
      errors: [{ line: 0, column: 0, message: msg, formatted: `[XSD] ${msg}` }],
    };
  }
};
