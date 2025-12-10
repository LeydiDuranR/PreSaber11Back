import { Op } from "sequelize";
import Sesion from "../models/Sesion.js";
import SesionArea from "../models/SesionArea.js";
import SesionPregunta from "../models/SesionPregunta.js";
import Pregunta from "../models/Pregunta.js";
import Opcion from "../models/Opcion.js";
import ProgresoSesion from "../models/ProgresoSesion.js";
import RespuestaEstudiante from "../models/RespuestaEstudiante.js";
import ResultadoSimulacro from "../models/ResultadoSimulacro.js";
import ResultadoSesion from "../models/ResultadoSesion.js";
import ResultadoArea from "../models/ResultadoArea.js";
import Simulacro from "../models/Simulacro.js";
import db from "../db/db.js";
import Area from "../models/Area.js";


async function obtenerPreguntasParaSesion(id_sesion, id_estudiante) {
  // 1. Obtener sesión con áreas
  const sesion = await Sesion.findByPk(id_sesion);
  if (!sesion) throw new Error("Sesión no encontrada");

  // 2. Verificar restricción de sesiones previas
  const simulacro = await Simulacro.findByPk(sesion.id_simulacro, {
    include: [{ model: Sesion }]
  });

  let puedeIngresar = true;
  let sesionBloqueada = null;

  if (simulacro) {
    const sesiones = simulacro.sesions || [];
    const ordenActual = sesion.orden;

    for (const s of sesiones) {
      if (s.orden < ordenActual) {
        const prog = await ProgresoSesion.findOne({
          where: { id_usuario: id_estudiante, id_sesion: s.id_sesion }
        });
        if (!prog || !prog.completada) {
          puedeIngresar = false;
          sesionBloqueada = s.nombre;
          break;
        }
      }
    }
  }

  if (!puedeIngresar) {
    return {
      puedeIngresar: false,
      mensaje: `Debes completar la sesión "${sesionBloqueada}" antes de continuar`,
      sesionBloqueada
    };
  }

  // 3. Obtener todas las SesionPreguntas con sus relaciones
  const sesionPreguntas = await SesionPregunta.findAll({
    include: [
      {
        model: SesionArea,
        where: { id_sesion },
        include: [{
          model: Area
        }]
      },
      {
        model: Pregunta,
        include: [{
          model: Opcion,
          as: "opciones"
        }]
      }
    ],
    order: [['orden_en_sesion', 'ASC']]
  });

  // 4. Construir array de preguntas usando los nombres exactos de Sequelize
  const preguntasPlano = [];

  for (const sp of sesionPreguntas) {
    const sesionArea = sp.sesion_area;
    const pregunta = sp.preguntum;
    const opciones = pregunta?.opciones || [];


    preguntasPlano.push({
      id_sesion_pregunta: sp.id_sesion_pregunta,
      id_pregunta: sp.id_pregunta,
      orden_en_sesion: sp.orden_en_sesion,
      puntaje_base: sp.puntaje_base,
      id_sesion_area: sp.id_sesion_area,
      area_id: sesionArea?.id_area || null,
      area_nombre: sesionArea?.area?.nombre || null,
      enunciado: pregunta?.enunciado || pregunta?.texto || null,
      imagen_url: pregunta?.imagen_url || null,
      opciones: opciones.map(o => ({
        id_opcion: o.id_opcion,
        texto_opcion: o.texto_opcion,
        imagen_opcion: o.imagen
      })).sort((a, b) => (a.letra || '').localeCompare(b.letra || '')),
      contestada: false,
      opcion_seleccionada: null
    });
  }

  // 5. Obtener respuestas ya guardadas
  const respuestas = await RespuestaEstudiante.findAll({
    attributes: ['id_sesion_pregunta', 'id_opcion_seleccionada', 'es_correcta'],
    include: [{
      model: ResultadoArea,
      attributes: ['id_sesion_area', 'id_resultado_sesion'],
      required: true,
      include: [{
        model: ResultadoSesion,
        attributes: ['id_sesion', 'id_resultado_sesion'],
        where: { id_sesion },
        required: true,
        include: [{
          model: ResultadoSimulacro,
          attributes: ['id_estudiante'],
          where: { id_estudiante },
          required: true
        }]
      }]
    }]
  });

  // 6. Filtrar respuestas del estudiante
  // const respuestasFiltradas = [];
  // for (const r of respuestas) {
  //     const resultadoArea = r.resultado_area;
  //     const resultadoSesion = resultadoArea?.resultado_sesion;

  //     if (resultadoSesion) {
  //         const existeVinculo = await ResultadoSimulacro.findOne({
  //             where: { id_estudiante },
  //             include: [{
  //                 model: ResultadoSesion,
  //                 where: { id_resultado_sesion: resultadoSesion.id_resultado_sesion },
  //                 required: true
  //             }]
  //         });

  //         if (existeVinculo) {
  //             respuestasFiltradas.push(r);
  //         }
  //     }
  // }

  // 7. Marcar preguntas contestadas
  const respuestasMap = new Map();
  respuestas.forEach(r => {
    respuestasMap.set(r.id_sesion_pregunta, {
      id_opcion_seleccionada: r.id_opcion_seleccionada
    });
  });

  preguntasPlano.forEach(p => {
    const respuesta = respuestasMap.get(p.id_sesion_pregunta);
    p.contestada = !!respuesta;
    p.opcion_seleccionada = respuesta?.id_opcion_seleccionada || null;
  });

  // 8. Calcular tiempo desde ResultadoSesion
  const resSim = await ResultadoSimulacro.findOne({
    where: {
      id_simulacro: sesion.id_simulacro,
      id_estudiante
    },
    include: [{
      model: ResultadoSesion,
      where: { id_sesion },
      required: false
    }]
  });

  // 9. Calcular tiempo
  const resultadoSesion = resSim?.resultado_sesions?.[sesion.orden - 1] || null;
  const duracion = Number(sesion.duracion_segundos || 0);
  let tiempo_usado = 0;

  if (resultadoSesion && !progreso?.completada) {
    // Sesión activa: calcular tiempo desde inicio
    const inicio = new Date(resultadoSesion.fecha_inicio);
    tiempo_usado = Math.floor((new Date() - inicio) / 1000);
  } else if (resultadoSesion && progreso?.completada) {
    // Sesión finalizada: usar tiempo guardado
    tiempo_usado = resultadoSesion.tiempo_usado_segundos || 0;
  }

  const tiempo_restante = Math.max(0, duracion - tiempo_usado);

  // 9. Obtener puntaje acumulado desde ResultadoSesion
  const puntaje_acumulado = resultadoSesion?.puntaje_sesion || 0;

  return {
    id_sesion: sesion.id_sesion,
    nombre: sesion.nombre,
    instrucciones: sesion.instrucciones || null,
    duracion_segundos: duracion,
    tiempo_usado,
    tiempo_restante,
    total_preguntas: preguntasPlano.length,
    preguntas_contestadas: respuestas.length,
    preguntas: preguntasPlano,
    progreso: {
      ultima_pregunta: progreso?.ultima_pregunta || null,
      completada: progreso?.completada || false,
      puntaje_acumulado, // Desde ResultadoSesion, no ProgresoSesion
      puede_continuar: !progreso?.completada
    },
    puedeIngresar: true
  };
}

// Guardar respuesta - SIN USAR id_resultado_simulacro como FK
async function guardarRespuesta({
  id_estudiante,
  id_sesion,
  id_sesion_pregunta,
  id_opcion,
  orden
}) {
  const t = await db.transaction();

  try {
    // 1. Validar que la sesión no esté completada
    const progresoExistente = await ProgresoSesion.findOne({
      where: { id_usuario: id_estudiante, id_sesion },
      transaction: t
    });

    if (progresoExistente?.completada) {
      await t.rollback();
      return {
        status: "error",
        mensaje: "Esta sesión ya fue completada. No se pueden modificar las respuestas."
      };
    }

    // 2. Obtener SesionPregunta con su área y pregunta
    const sp = await SesionPregunta.findByPk(id_sesion_pregunta, {
      include: [
        { model: SesionArea },
        {
          model: Pregunta,
          include: [{
            model: Opcion,
            as: "opciones"
          }]
        }
      ],
      transaction: t
    });

    if (!sp) throw new Error("Pregunta no encontrada en esta sesión");

    // 3. Validar que la opción pertenezca a esta pregunta
    const pregunta = sp.preguntum;
    const opciones = pregunta?.opciones || [];
    const opcionValida = opciones.find(o => o.id_opcion === id_opcion);

    if (!opcionValida) {
      throw new Error("La opción seleccionada no pertenece a esta pregunta");
    }

    const esCorrecta = !!opcionValida.es_correcta;
    const puntajeRespuesta = esCorrecta ? Number(sp.puntaje_base || 1) : 0;

    // 4. Obtener la sesión
    const sesion = await Sesion.findByPk(id_sesion, { transaction: t });
    if (!sesion) throw new Error("Sesión no encontrada");

    // 5. Obtener o crear ResultadoSimulacro
    let resSim = await ResultadoSimulacro.findOne({
      where: {
        id_simulacro: sesion.id_simulacro,
        id_estudiante,
        completado: false
      },
      transaction: t
    });

    if (!resSim) {
      resSim = await ResultadoSimulacro.create({
        fecha_fin: null,
        puntaje_total: 0,
        completado: false,
        id_simulacro: sesion.id_simulacro,
        id_estudiante
      }, { transaction: t });
    }

    // 6. Obtener o crear ResultadoSesion
    let resultadoSesion = await ResultadoSesion.findOne({
      where: {
        id_sesion,
        id_resultado_simulacro: resSim.id_resultado_simulacro
      },
      transaction: t
    });

    if (!resultadoSesion) {
      resultadoSesion = await ResultadoSesion.create({
        puntaje_sesion: 0,
        tiempo_usado_segundos: 0,
        fecha_inicio: new Date(),
        fecha_fin: new Date(),
        id_sesion: id_sesion,
        id_resultado_simulacro: resSim.id_resultado_simulacro,
      }, { transaction: t });
    }


    // 7. Obtener o crear ResultadoArea
    let resArea = await ResultadoArea.findOne({
      where: {
        id_sesion_area: sp.id_sesion_area,
        id_resultado_sesion: resultadoSesion.id_resultado_sesion
      },
      transaction: t
    });

    if (!resArea) {
      resArea = await ResultadoArea.create({
        correctas: 0,
        incorrectas: 0,
        id_sesion_area: sp.id_sesion_area,
        id_resultado_sesion: resultadoSesion.id_resultado_sesion,
      }, { transaction: t });
    }

    // 8. Verificar si ya existe respuesta
    let respuestaExistente = await RespuestaEstudiante.findOne({
      where: {
        id_sesion_pregunta,
        id_resultado_area: resArea.id_resultado_area
      },
      transaction: t
    });

    let cambioRespuesta = false;
    let puntajeAnterior = 0;
    let esCorrectaAnterior = false;

    if (respuestaExistente) {
      // Ya existe - verificar si cambió
      if (respuestaExistente.id_opcion_seleccionada !== id_opcion) {
        cambioRespuesta = true;
        puntajeAnterior = Number(respuestaExistente.puntaje_respuesta || 0);
        esCorrectaAnterior = respuestaExistente.es_correcta;

        respuestaExistente.id_opcion_seleccionada = id_opcion;
        respuestaExistente.es_correcta = esCorrecta;
        respuestaExistente.puntaje_respuesta = puntajeRespuesta;
        await respuestaExistente.save({ transaction: t });

        // Ajustar contadores
        if (esCorrectaAnterior && !esCorrecta) {
          resArea.correctas = Math.max(0, resArea.correctas - 1);
          resArea.incorrectas += 1;
        } else if (!esCorrectaAnterior && esCorrecta) {
          resArea.correctas += 1;
          resArea.incorrectas = Math.max(0, resArea.incorrectas - 1);
        }

        await resArea.save({ transaction: t });

        resultadoSesion.puntaje_sesion = Number(resultadoSesion.puntaje_sesion || 0) - puntajeAnterior + puntajeRespuesta;
        await resultadoSesion.save({ transaction: t });

        resSim.puntaje_total = Number(resSim.puntaje_total || 0) - puntajeAnterior + puntajeRespuesta;
        await resSim.save({ transaction: t });
      }
    } else {
      // Nueva respuesta
      await RespuestaEstudiante.create({
        puntaje_respuesta: puntajeRespuesta,
        es_correcta: esCorrecta,
        id_resultado_area: resArea.id_resultado_area,
        id_sesion_pregunta,
        id_opcion_seleccionada: id_opcion,
      }, { transaction: t });

      if (esCorrecta) resArea.correctas += 1;
      else resArea.incorrectas += 1;

      resultadoSesion.puntaje_sesion = Number(resultadoSesion.puntaje_sesion || 0) + puntajeRespuesta;
      await resultadoSesion.save({ transaction: t });

      resSim.puntaje_total = Number(resSim.puntaje_total || 0) + puntajeRespuesta;
      await resSim.save({ transaction: t });
    }

    // 9. Actualizar ProgresoSesion
    let progreso = await ProgresoSesion.findOne({
      where: { id_usuario: id_estudiante, id_sesion },
      transaction: t
    });

    if (!progreso) {
      progreso = await ProgresoSesion.create({
        completada: false,
        fecha_inicio: new Date(),
        ultima_actualizacion: new Date(),
        id_usuario: id_estudiante,
        id_sesion: id_sesion,
        ultima_pregunta: id_sesion_pregunta

      }, { transaction: t });
    } else {
      progreso.ultima_pregunta = id_sesion_pregunta;
      progreso.ultima_actualizacion = new Date();
      await progreso.save({ transaction: t });
    }

    const totalRespuestas = await RespuestaEstudiante.count({
      include: [{
        model: ResultadoArea,
        where: { id_resultado_sesion: resultadoSesion.id_resultado_sesion }
      }],
      transaction: t
    });

    await t.commit();

    return {
      status: "ok",
      mensaje: cambioRespuesta ? "Respuesta actualizada" :
        respuestaExistente ? "Respuesta ya guardada" : "Respuesta guardada",
      guardado: true,
      cambio: cambioRespuesta,
      total_contestadas: totalRespuestas,
      puntaje_acumulado: Number(resultadoSesion.puntaje_sesion)
    };

  } catch (error) {
    await t.rollback();
    throw error;
  }
}


// Resto de funciones...
async function finalizarSesion({ id_estudiante, id_sesion, tiempo_usado_final }) {
  const t = await db.transaction();

  try {
    // 1. Verificar progreso
    const progreso = await ProgresoSesion.findOne({
      where: { id_usuario: id_estudiante, id_sesion },
      transaction: t
    });

    if (!progreso) {
      throw new Error("No existe progreso para esta sesión");
    }

    if (progreso.completada) {
      await t.rollback();
      return {
        status: "warning",
        mensaje: "Esta sesión ya fue finalizada anteriormente",
        completada: true
      };
    }

    // 2. Marcar ProgresoSesion como completada
    progreso.completada = true;
    progreso.ultima_actualizacion = new Date();
    await progreso.save({ transaction: t });

    // 3. Actualizar ResultadoSesion - fecha_fin y tiempo
    const sesion = await Sesion.findByPk(id_sesion, { transaction: t });
    const resSim = await ResultadoSimulacro.findOne({
      where: {
        id_simulacro: sesion.id_simulacro,
        id_estudiante,
        completado: false
      },
      transaction: t
    });

    let puntaje_final = 0;
    let tiempo_total = 0;

    if (resSim) {
      const resultadoSesion = await ResultadoSesion.findOne({
        where: {
          id_sesion,
          id_resultado_simulacro: resSim.id_resultado_simulacro
        },
        transaction: t
      });

      if (resultadoSesion) {
        // Calcular tiempo desde ResultadoSesion.fecha_inicio
        const inicio = new Date(resultadoSesion.fecha_inicio);
        tiempo_total = tiempo_usado_final || Math.floor((new Date() - inicio) / 1000);

        // ⭐ Actualizar fecha_fin y tiempo solo al finalizar
        resultadoSesion.fecha_fin = new Date();
        resultadoSesion.tiempo_usado_segundos = tiempo_total;
        await resultadoSesion.save({ transaction: t });

        puntaje_final = resultadoSesion.puntaje_sesion;
      }

      // 4. Verificar si todas las sesiones del simulacro están completas
      const todasSesiones = await Sesion.findAll({
        where: { id_simulacro: sesion.id_simulacro },
        transaction: t
      });

      let todasCompletas = true;
      for (const s of todasSesiones) {
        const p = await ProgresoSesion.findOne({
          where: { id_usuario: id_estudiante, id_sesion: s.id_sesion },
          transaction: t
        });
        if (!p || !p.completada) {
          todasCompletas = false;
          break;
        }
      }

      // Si todas están completas, marcar simulacro como completado
      if (todasCompletas) {
        resSim.completado = true;
        resSim.fecha_fin = new Date();
        await resSim.save({ transaction: t });
      }
    }

    await t.commit();

    return {
      status: "ok",
      mensaje: "Sesión finalizada correctamente",
      completada: true,
      puntaje_final,
      tiempo_total
    };

  } catch (error) {
    await t.rollback();
    throw error;
  }
}


async function obtenerResultadosSesion(id_sesion, id_estudiante) {

  const sesion = await Sesion.findByPk(id_sesion);
  if (!sesion) throw new Error("Sesión no encontrada");
  // Verificar que esté completada
  const progreso = await ProgresoSesion.findOne({
    where: { id_usuario: id_estudiante, id_sesion }
  });

  if (!progreso || !progreso.completada) {
    return {
      disponible: false,
      mensaje: "Los resultados estarán disponibles al finalizar la sesión"
    };
  }

  // Obtener ResultadoSesion para puntajes y tiempos
  const resSim = await ResultadoSimulacro.findOne({
    where: { id_estudiante },
    include: [{
      model: ResultadoSesion,
      where: { id_sesion },
      required: true
    }]
  });

  const resultadoSesion = resSim?.resultado_sesions?.[sesion.orden - 1] || null;

  if (!resultadoSesion) {
    return {
      disponible: false,
      mensaje: "No se encontraron resultados"
    };
  }

  // Calcular puntaje total de la sesión (suma de puntajes_base)
  const sesionPreguntas = await SesionPregunta.findAll({
    attributes: ['puntaje_base'],
    include: [{
      model: SesionArea,
      where: { id_sesion },
      attributes: [],
      required: true
    }]
  });

  const puntaje_total_sesion = sesionPreguntas.reduce((sum, sp) =>
    sum + Number(sp.puntaje_base || 0), 0
  );

  // Obtener respuestas con detalles usando FK
  const respuestas = await RespuestaEstudiante.findAll({
    include: [{
      model: ResultadoArea,
      include: [{
        model: ResultadoSesion,
        where: { id_sesion },
        include: [{
          model: ResultadoSimulacro,
          where: { id_estudiante }
        }]
      }, {
        model: SesionArea,
        include: [{ model: Area }]
      }]
    }, {
      model: SesionPregunta,
      include: [{
        model: Pregunta,
        include: [{ model: Opcion, as: "opciones" }]
      }]
    }],
    order: [[{ model: SesionPregunta }, 'orden_en_sesion', 'ASC']]
  });

  // Contar correctas e incorrectas desde las respuestas
  const correctas = respuestas.filter(r => r.es_correcta).length;
  const incorrectas = respuestas.length - correctas;




  // const detalleRespuestas = respuestas.map(r => {
  //     const sesionPregunta = r.sesion_preguntum;
  //     const pregunta = sesionPregunta?.preguntum;
  //     const opciones = pregunta?.opciones || [];

  //     const resultadoArea = r.resultado_area;
  //     const sesionArea = resultadoArea?.sesion_area;

  //     return {
  //         orden: sesionPregunta?.orden_en_sesion,
  //         pregunta: pregunta?.enunciado || pregunta?.texto,
  //         tu_respuesta: opciones.find(o => o.id_opcion === r.id_opcion_seleccionada)?.texto_opcion,
  //         respuesta_correcta: opciones.find(o => o.es_correcta)?.texto_opcion,
  //         es_correcta: r.es_correcta,
  //         puntaje_obtenido: r.puntaje_respuesta,
  //         area: sesionArea?.area?.nombre
  //     };
  // });

  return {
    disponible: true,
    puntaje_obtenido: resultadoSesion.puntaje_sesion,
    puntaje_total: puntaje_total_sesion,
    correctas,
    incorrectas,
    tiempo_total: resultadoSesion.tiempo_usado_segundos,
    experiencia_ganada: puntaje_total_sesion * 2,
    // respuestas: detalleRespuestas
  };
}


export default {
  obtenerPreguntasParaSesion,
  guardarRespuesta,
  finalizarSesion,
  obtenerResultadosSesion
}