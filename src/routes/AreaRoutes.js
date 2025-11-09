import { Router } from "express";
import AreaController from "../controllers/AreaController.js";
const router = Router();

router.get("/", AreaController.obtenerAreas);

export default router;
