import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import db, { testConnection, createTables } from "./db/db.js";
import "./models/index.js";

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



// Ruta base
app.get("/", (req, res) => {
    res.send("API funcionando 🚀");
});


const PORT = process.env.PORT || process.env.PUERTO || 3000;


// Levantar servidor
app.listen(PORT, () => {
    console.log(`API escuchando en http://localhost:${PORT}`);
});

