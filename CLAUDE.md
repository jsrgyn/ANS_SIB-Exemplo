# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands must be run from the `backend/` directory:

```bash
cd backend

# Install dependencies
npm install

# Run development server (with auto-reload)
npm run dev

# Run production server
npm start

# Run tests
npm test
```

Tests are located in `tests/` (project root) and import from `../backend/src/`. Run them from the project root with:

```bash
npm test   # uses jest from root package-lock.json — or run via backend/
```

The app runs at `http://localhost:3001/sib` (configurable via `PORT` env var).

## Architecture

This is a Node.js ESM project (`"type": "module"`). The backend serves both the API and the single-page frontend.

### Request flow

1. **Upload**: `POST /api/csv/upload` — multer saves file to `backend/uploads/`, returns `filePath`. File size limited by `MAX_FILE_SIZE` env var (default 50MB); only `text/csv` / `application/vnd.ms-excel` MIME types accepted. Returns 413 for oversized files, 400 for invalid type.
2. **Process**: `POST /api/csv/process` — takes `filePath` + header params (registroANS, nomeAplicativo, fabricanteAplicativo, etc.):
   - `csvService.parseCSVToJSON()` parses the semicolon-delimited, BOM-aware CSV and returns `{ results, errors }`. Invalid rows are collected into `errors: Array<{linha, campo, mensagem}>` and processing continues for the remaining rows.
   - `xmlService.generateXML()` builds the XML tree using `xmlbuilder2`, then computes the MD5 hash
   - `xmlValidator.validateXML()` validates against `backend/schemas/sib.xsd` using `libxmljs2`
   - The temp upload file is deleted in the `finally` block
   - Response: `{ xml, fileName, isValid, errors, recordCount, totalProcessados, totalRejeitados, errosCSV }`
   - Returns 422 when no valid rows exist, including `errosCSV` with details of each rejected row
3. **Validate only**: `POST /api/xml/validate` — accepts raw XML string, runs XSD validation

### MD5 hash algorithm

The `<epilogo><hash>` at the end of the XML is computed by `concatenateContent()` in `xmlService.js`. It walks the DOM recursively, processing attributes in alphabetical order and concatenating trimmed text values — **excluding the `<epilogo>` element itself**. The hash is computed on the UTF-8 string but the XML encoding is declared as `ISO-8859-1`.

### Movement types

CSV column `tipo_movimentacao` maps to:
| Code | Type | CCO required |
|------|------|-------------|
| 1 | inclusao | No |
| 2 | retificacao | Yes (12 digits) |
| 4 | mudancaContratual | Yes |
| 5 | cancelamento | Yes |

### Output filename

Pattern: `{registroANS}{YYYYMMDDHHMISS}.SBX` — extracted from `<dataHoraRegistroTransacao>` in the generated XML.

### Key constraints
- `registroANS` must be exactly 6 digits
- CSV must use `;` as delimiter
- XSD schemas are in `backend/schemas/` (sib.xsd imports sibSimpleType.xsd and sibComplexType.xsd)
- Multer config is in `backend/src/config/multerConfig.js`; size limit driven by `MAX_FILE_SIZE` env var
