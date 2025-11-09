import express from "express";
import path from "path";
import cors from "cors";
import cursoRoutes from "./routes/cursoRoutes.js";
import usuarioRoutes from "./routes/usuarioRoutes.js";
import tipoDocumentoRoutes from "./routes/tipoDocumentoRoutes.js";
import dotenv from "dotenv";
import db, { testConnection, createTables } from "./db/db.js";
import "./models/index.js";
import areaRoutes from "./routes/AreaRoutes.js";
import preguntaRoutes from "./routes/PreguntaRoutes.js";

dotenv.config();


const app = express();


app.use(cors({
    origin: "*",
    methods: ["GET", "PATCH", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Conectar DB
(async () => {
    await testConnection();
    // await createTables();
})();

app.use("/api/curso", cursoRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/tipos-documento", tipoDocumentoRoutes);
app.use("/api/areas", areaRoutes);
app.use("/api/preguntas", preguntaRoutes);
// Ruta base
app.get("/", (req, res) => {
    res.send("API funcionando 🚀");
});



const PORT = process.env.PORT || process.env.PUERTO || 3000;


// Levantar servidor
app.listen(PORT, () => {
    console.log(`API escuchando en http://localhost:${PORT}`);
});

