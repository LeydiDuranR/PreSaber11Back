import { Router } from "express";
import TemaController from "../controllers/TemaController.js";

const router = Router();

router.get("/area/:id_area", TemaController.obtenerTemasPorArea);
router.get("/listar/:idArea", TemaController.listarPorArea);
router.post("/", TemaController.crearTema);

export default router;
