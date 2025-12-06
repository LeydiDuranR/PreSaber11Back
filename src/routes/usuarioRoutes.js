import { Router } from "express";
import {
  crearUsuario,
  editarUsuario,
  obtenerUsuarioPorId,
  obtenerTodosUsuarios,
  verificarUsuarioPorUid,
  obtenerDocentesInstitucion,
  obtenerDocentesPorNombreYApellido,
  verificarUsuarioExistente,
  obtenerUsuarioPorUid,
  crearDocente
} from "../controllers/usuarioController.js";

const router = Router();

router.post("/docente", crearDocente);
router.post("/usuario/verificar", verificarUsuarioExistente);
router.get("/verificar/:uid_firebase", verificarUsuarioPorUid);
router.get("/institucion/:id_institucion", obtenerDocentesInstitucion);
router.get("/buscar/:id_institucion", obtenerDocentesPorNombreYApellido);
router.get("/firebase/:uid_firebase", obtenerUsuarioPorUid);

router.post("/", crearUsuario);
router.put("/:documento", editarUsuario);
router.get("/", obtenerTodosUsuarios);
router.get("/:documento", obtenerUsuarioPorId);

export default router;
