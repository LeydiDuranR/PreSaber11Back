import { bucket } from "../config/firebase.js";
import fs from 'fs';
import path from 'path';

/**
 * Sube un archivo local a Firebase Storage
 */
async function subirArchivoAFirebase(file, filePath, folder = "icons") {
    try {
        const fileName = path.basename(filePath);
        const destination = `${folder}/${fileName.replace(/\\/g, "_")}`;
        console.log(`📤 Subiendo archivo a Firebase: ${destination}`);

        // ✅ Crea la referencia correcta dentro del bucket
        const fileUpload = bucket.file(destination);

        // ✅ Si el contenido viene como Buffer
        if (Buffer.isBuffer(file)) {
            await fileUpload.save(file, {
                metadata: { contentType: "application/octet-stream" },
            });
        }
        // ✅ Si viene como una ruta de archivo local
        else if (typeof file === "string") {
            await bucket.upload(file, {
                destination,
                metadata: { contentType: "application/octet-stream" },
            });
        } else {
            throw new Error("Tipo de archivo no soportado");
        }

        // ✅ Hacer público el archivo
        await fileUpload.makePublic();

        // ✅ Construir y retornar la URL pública
        const url = `https://storage.googleapis.com/${bucket.name}/${destination}`;
        console.log(`✅ Archivo subido exitosamente: ${url}`);

        return url;
    } catch (error) {
        console.error("❌ Error al subir archivo a Firebase:", error);
        throw new Error("Error al subir el archivo: " + error.message);
    }
}

/**
 * Limpia archivos temporales
 */
function limpiarArchivosTemporales(rutas) {
    if (!rutas) return;
    const archivos = Array.isArray(rutas) ? rutas : [rutas];
    archivos.forEach(filePath => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });
}

export {
    subirArchivoAFirebase,
    limpiarArchivosTemporales
};