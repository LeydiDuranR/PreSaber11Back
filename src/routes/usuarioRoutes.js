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
  verificarCorreoExiste,
  obtenerUsuarioPorUid,
  crearDocente,
  obtenerCursosDocente,
  crearAdministrador,
  listarAdministradores,
  obtenerAdministrador
} from "../controllers/usuarioController.js";

const router = Router();

router.post("/docente", crearDocente);
router.post("/administrador", crearAdministrador);
router.get("/administradores", listarAdministradores);
router.get("/administrador/:documento", obtenerAdministrador);
router.post("/usuario/verificar", verificarUsuarioExistente);
router.post("/verificar-correo", verificarCorreoExiste);
router.get("/verificar/:uid_firebase", verificarUsuarioPorUid);
router.get("/institucion/:id_institucion", obtenerDocentesInstitucion);
router.get("/buscar/:id_institucion", obtenerDocentesPorNombreYApellido);
router.get("/firebase/:uid_firebase", obtenerUsuarioPorUid);
router.get("/:documento/cursos", obtenerCursosDocente);
router.post("/", crearUsuario);
router.put("/:documento", editarUsuario);
router.get("/", obtenerTodosUsuarios);
router.get("/:documento", obtenerUsuarioPorId);

export default router;
