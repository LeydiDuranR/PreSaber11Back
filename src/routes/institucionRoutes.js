import { Router } from "express";
import { listarInstituciones, crearInstitucion } from "../controllers/institucionController.js";

const router = Router();

router.get("/", listarInstituciones);
router.post("/", crearInstitucion);


export default router;
