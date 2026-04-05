import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import os from "node:os";
import { logger } from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execFileAsync = promisify(execFile);

export const validateXML = async (xml) => {
  const version = process.env.SIB_SCHEMA_VERSION || "1.2";
  const xsdPath = path.join(__dirname, `../../schemas/v${version}/sib.xsd`);

  if (!fs.existsSync(xsdPath)) {
    const msg = `Schema XSD não encontrado para versão ${version}: ${xsdPath}`;
    logger.error(msg);
    return { isValid: false, errors: [{ line: 0, column: 0, message: msg, formatted: `[XSD] ${msg}` }] };
  }

  const tmpFile = path.join(os.tmpdir(), `sib_validate_${Date.now()}.xml`);
  try {
    fs.writeFileSync(tmpFile, xml, "utf8");

    await execFileAsync("xmllint", ["--noout", "--schema", xsdPath, tmpFile]);

    logger.info(`XML validado com sucesso contra schema v${version}`);
    return { isValid: true, errors: [] };
  } catch (error) {
    // xmllint writes validation errors to stderr
    const stderr = (error.stderr || error.message || "").trim();
    const formattedErrors = parseXmllintErrors(stderr);

    logger.error(`Validação XSD (v${version}) falhou com ${formattedErrors.length} erro(s)`, {
      schemaVersion: version,
      errors: formattedErrors,
    });

    return { isValid: false, errors: formattedErrors };
  } finally {
    try { fs.unlinkSync(tmpFile); } catch (e) { logger.warn(`Failed to delete temp file: ${e.message}`); }
  }
};

function parseXmllintErrors(stderr) {
  if (!stderr) return [{ line: 0, column: 0, message: "Erro desconhecido na validação", formatted: "[XSD] Erro desconhecido na validação" }];

  // xmllint format: "/path/file.xml:<line>: <description> : <message>"
  // The "fails to validate" summary line has no line number — skip it.
  const lineRe = /^.+?:(\d+): (.+)$/;
  const seen = new Set();
  const errors = [];

  for (const rawLine of stderr.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.endsWith("fails to validate")) continue;
    const m = line.match(lineRe);
    if (m) {
      const lineNum = Number.parseInt(m[1], 10);
      // Strip leading "element <name>: Schemas validity error : " to get just the message
      const rawMsg = m[2].trim();
      const message = rawMsg.replace(/^.+?Schemas validity error\s*:\s*/i, "").trim() || rawMsg;
      const key = `${lineNum}:${message}`;
      if (!seen.has(key)) {
        seen.add(key);
        errors.push({
          line: lineNum,
          column: 0,
          message,
          formatted: `[XSD] Linha ${lineNum}: ${message}`,
        });
      }
    }
  }

  if (errors.length === 0) {
    return [{ line: 0, column: 0, message: stderr.trim(), formatted: `[XSD] ${stderr.trim()}` }];
  }

  return errors;
}
