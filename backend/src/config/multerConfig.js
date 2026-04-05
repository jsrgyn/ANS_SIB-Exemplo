import multer from "multer";

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024; // 50MB padrão
const ALLOWED_MIMES = ["text/csv", "application/vnd.ms-excel"];

const upload = multer({
  dest: process.env.UPLOAD_DIR || "uploads/",
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      return cb(new Error("Tipo de arquivo inválido. Apenas CSV é permitido."));
    }
    cb(null, true);
  },
});

export default upload;
