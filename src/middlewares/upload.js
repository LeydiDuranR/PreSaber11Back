import multer from "multer";
import path from "path";
import fs from "fs";

// Carpeta temporal para almacenar archivos subidos
const uploadPath = path.join(process.cwd(), "temp/uploads");

// Crear la carpeta si no existe
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Configuración de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Evitar colisiones de nombres
    const uniqueSuffix = Date.now() + "_" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "_" + uniqueSuffix + ext);
  },
});

// Filtro para aceptar solo imágenes
function fileFilter(req, file, cb) {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten imágenes"), false);
  }
}

const upload = multer({ storage, fileFilter });

export default upload;
