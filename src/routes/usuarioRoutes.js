import { Router } from "express";
import {
  crearUsuario,
  editarUsuario,
  obtenerUsuarioPorId,
  obtenerTodosUsuarios,
  verificarUsuarioPorUid,
} from "../controllers/usuarioController.js";

const router = Router();

router.post("/", crearUsuario);
router.put("/:documento", editarUsuario);
router.get("/:documento", obtenerUsuarioPorId);
router.get("/", obtenerTodosUsuarios);
router.get("/verificar/:uid_firebase", verificarUsuarioPorUid);

export default router;
