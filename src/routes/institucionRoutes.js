import { Router } from "express";
import { listarInstituciones } from "../controllers/institucionController.js";

const router = Router();

router.get("/", listarInstituciones);

export default router;
