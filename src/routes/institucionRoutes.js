import express from "express";
import {
  listarInstituciones,
  listarInstitucionesCompletasController,
  crearInstitucionController,
  listarDepartamentos,
  listarMunicipios
} from "../controllers/institucionController.js";

const router = express.Router();

router.get("/", listarInstituciones);
router.get("/completas", listarInstitucionesCompletasController);
router.post("/", crearInstitucionController);
router.get("/departamentos", listarDepartamentos);
router.get("/departamentos/:id/municipios", listarMunicipios);

export default router;