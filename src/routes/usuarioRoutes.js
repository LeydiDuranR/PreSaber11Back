import { Router } from "express";
import {
  crearUsuario,
  editarUsuario,
  obtenerUsuarioPorId,
  obtenerTodosUsuarios,
  verificarUsuarioPorUid,
  obtenerDocentesInstitucion,
  obtenerDocentesPorNombreYApellido
} from "../controllers/usuarioController.js";

const router = Router();

router.post("/", crearUsuario);
router.put("/:documento", editarUsuario);
router.get("/:documento", obtenerUsuarioPorId);
router.get("/", obtenerTodosUsuarios);
router.get("/verificar/:uid_firebase", verificarUsuarioPorUid);
router.get("/institucion/:id_institucion", obtenerDocentesInstitucion);
router.get("/buscar/:id_institucion", obtenerDocentesPorNombreYApellido);
export default router;
