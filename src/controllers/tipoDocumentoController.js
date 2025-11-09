import { Router } from "express";
import { listarTiposDocumento } from "../controllers/tipoDocumentoController.js";

const router = Router();
router.get("/", listarTiposDocumento);

export default router;
