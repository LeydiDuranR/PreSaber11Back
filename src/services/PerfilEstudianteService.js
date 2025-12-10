import { admin } from "../config/firebase.js";
import db from "../db/db.js"; // Importamos db para usar fn, col, literal
import Usuario from '../models/Usuario.js';
import Institucion from '../models/Institucion.js';
import ParticipanteSimulacro from '../models/ParticipanteSimulacro.js';
import ParticipanteSala from '../models/ParticipanteSala.js';
import ResultadoSimulacro from '../models/ResultadoSimulacro.js';
import ResultadoSesion from '../models/ResultadoSesion.js';
import ResultadoArea from '../models/ResultadoArea.js';
import ResultadoReto from '../models/ResultadoReto.js';
import RespuestaSimulacro from '../models/RespuestaSimulacro.js';
import RespuestaSalaPvP from '../models/RespuestaSalaPvP.js';
import RespuestaEstudiante from '../models/RespuestaEstudiante.js';
import RespuestasReto from '../models/RespuestasReto.js';
import SimulacroGrupal from '../models/SimulacroGrupal.js';
import SalaPrivada from '../models/SalaPrivada.js';
import Pregunta from '../models/Pregunta.js';
import Area from '../models/Area.js';
import Opcion from '../models/Opcion.js';
import { Op } from 'sequelize';

class PerfilEstudianteService {

  // Optimización: Traer solo las fechas y hacerlo en paralelo
  async obtenerRachaVictorias(idEstudiante) {
    try {
      // Ejecutamos las 4 consultas al mismo tiempo
      const [fechasGrupales, fechasPvP, fechasSimulacros, fechasRetos] = await Promise.all([
        ParticipanteSimulacro.findAll({
          where: { id_estudiante: idEstudiante, estado_jugador: 'finalizado' },
          attributes: ['fecha_finalizacion'],
          raw: true
        }),
        ParticipanteSala.findAll({
          where: { id_estudiante: idEstudiante, estado_jugador: 'finalizado' },
          attributes: ['fecha_finalizacion'],
          raw: true
        }),
        ResultadoSimulacro.findAll({
          where: { id_estudiante: idEstudiante, completado: true },
          attributes: ['fecha_fin'],
          raw: true
        }),
        ResultadoReto.findAll({
          where: { id_estudiante: idEstudiante },
          attributes: ['fecha_realizacion'],
          raw: true
        })
      ]);

      // Unificar fechas en un Set para eliminar duplicados
      const fechasActividad = new Set();

      const procesarFecha = (fecha) => {
        if (fecha) fechasActividad.add(new Date(fecha).toDateString());
      };

      fechasGrupales.forEach(x => procesarFecha(x.fecha_finalizacion));
      fechasPvP.forEach(x => procesarFecha(x.fecha_finalizacion));
      fechasSimulacros.forEach(x => procesarFecha(x.fecha_fin));
      fechasRetos.forEach(x => procesarFecha(x.fecha_realizacion));

      if (fechasActividad.size === 0) return 0;

      // Ordenar fechas (descendente)
      const fechasOrdenadas = Array.from(fechasActividad)
        .map(f => new Date(f))
        .sort((a, b) => b - a);

      // Calcular racha
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      let racha = 0;
      let fechaEsperada = new Date(hoy);
      
      // Permitir que la racha siga viva si la última actividad fue hoy o ayer
      const ultimaActividad = fechasOrdenadas[0];
      const diffConHoy = Math.floor((hoy - ultimaActividad) / (1000 * 60 * 60 * 24));
      
      if (diffConHoy > 1) return 0; // Si pasó más de un día sin actividad, la racha es 0 (o se rompió)
      
      // Ajustar fecha esperada a la última actividad real para empezar a contar hacia atrás
      fechaEsperada = new Date(ultimaActividad); 

      for (const fecha of fechasOrdenadas) {
        fecha.setHours(0, 0, 0, 0);
        const diffDias = Math.floor((fechaEsperada - fecha) / (1000 * 60 * 60 * 24));

        if (diffDias === 0) {
          racha++;
          fechaEsperada.setDate(fechaEsperada.getDate() - 1);
        } else if (diffDias > 0) {
            // Hueco en la racha
            break;
        }
      }

      return racha;
    } catch (error) {
      console.error("Error cálculo racha:", error);
      return 0; // Retornar 0 en lugar de romper todo el servicio
    }
  }

  // Lógica centralizada para estadísticas de áreas
  async obtenerEstadisticasAreas(idEstudiante) {
    try {
        // Obtenemos todas las áreas primero para tener el mapa base
        const todasLasAreas = await Area.findAll({ attributes: ['id_area', 'nombre'], raw: true });
        
        // Estructura base: { 1: { nombre: 'Matemáticas', correctas: 0, incorrectas: 0 }, ... }
        const mapaEstadisticas = {};
        todasLasAreas.forEach(area => {
            mapaEstadisticas[area.id_area] = { 
                id_area: area.id_area, 
                nombre: area.nombre, 
                correctas: 0, 
                incorrectas: 0 
            };
        });

        // Helper para procesar conteos. 
        // Sequelize devuelve: [ { id_area: 1, es_correcta: true, total: 5 }, ... ]
        const procesarConteo = (resultados) => {
            resultados.forEach(row => {
                const idArea = row.id_area; // Alias definido en la query
                const esCorrecta = row.es_correcta; // 1 o 0 (o true/false dependiendo del driver)
                const cantidad = parseInt(row.total, 10);

                if (mapaEstadisticas[idArea]) {
                    if (esCorrecta) {
                        mapaEstadisticas[idArea].correctas += cantidad;
                    } else {
                        mapaEstadisticas[idArea].incorrectas += cantidad;
                    }
                }
            });
        };

        // Ejecutar consultas agrupadas en paralelo
        // Usamos includes necesarios para llegar al id_area
        const [resSimulacro, resPvP, resIndividual, resReto] = await Promise.all([
            // 1. Simulacros Grupales
            RespuestaSimulacro.findAll({
                where: { id_estudiante: idEstudiante },
                attributes: [
                    [db.col('pregunta.id_area'), 'id_area'],
                    'es_correcta',
                    [db.fn('COUNT', db.col('id_respuesta_simulacro')), 'total']
                ],
                include: [{ model: Pregunta, as: 'pregunta', attributes: [] }],
                group: ['pregunta.id_area', 'es_correcta'],
                raw: true
            }),
            // 2. PvP
            RespuestaSalaPvP.findAll({
                where: { id_estudiante: idEstudiante },
                attributes: [
                    [db.col('pregunta.id_area'), 'id_area'],
                    'es_correcta',
                    [db.fn('COUNT', db.col('id_respuesta_pvp')), 'total']
                ],
                include: [{ model: Pregunta, as: 'pregunta', attributes: [] }],
                group: ['pregunta.id_area', 'es_correcta'],
                raw: true
            }),
            // 3. Simulacros Individuales (RespuestaEstudiante -> Opcion -> Pregunta -> Area)
            RespuestaEstudiante.findAll({
                attributes: [
                    [db.col('opcion.pregunta.id_area'), 'id_area'],
                    'es_correcta',
                    [db.fn('COUNT', db.col('id_respuesta_estudiante')), 'total']
                ],
                include: [
                    {
                        model: Opcion,
                        as: 'opcion', // Coincide con RespuestaEstudiante.belongsTo(Opcion, as: 'opcion')
                        attributes: [],
                        include: [{ 
                            model: Pregunta, 
                            as: 'pregunta', // Asegúrate que Opcion.belongsTo(Pregunta, as: 'pregunta') exista. Si no, quita esta linea.
                            attributes: [] 
                        }]
                    },
                    {
                        model: ResultadoArea,
                        as: 'resultado_area', // Coincide con RespuestaEstudiante.belongsTo(ResultadoArea, as: 'resultado_area')
                        attributes: [],
                        include: [{
                            model: ResultadoSesion,
                            as: 'resultado_sesion', // <--- AHORA SÍ ES OBLIGATORIO (Coincide con ResultadoArea.belongsTo(ResultadoSesion, as: 'resultado_sesion'))
                            attributes: [],
                            include: [{
                                model: ResultadoSimulacro,
                                as: 'resultado_simulacro', // <--- AHORA SÍ ES OBLIGATORIO (Coincide con ResultadoSesion.belongsTo(ResultadoSimulacro, as: 'resultado_simulacro'))
                                attributes: [],
                                where: { id_estudiante: idEstudiante }
                            }]
                        }]
                    }
                ],
                group: ['opcion.pregunta.id_area', 'respuesta_estudiante.es_correcta'],
                raw: true
            }),
            // 4. Retos (RespuestasReto -> Opcion -> Pregunta -> Area)
            RespuestasReto.findAll({
                where: { id_estudiante: idEstudiante },
                attributes: [
                    [db.col('opcion.pregunta.id_area'), 'id_area'],
                    [db.col('opcion.es_correcta'), 'es_correcta'], // Opcion tiene el bool
                    [db.fn('COUNT', db.col('id_respuestas_reto')), 'total']
                ],
                include: [{
                    model: Opcion, as: 'opcion', attributes: [],
                    include: [{ model: Pregunta, as: 'pregunta', attributes: [] }]
                }],
                group: ['opcion.pregunta.id_area', 'opcion.es_correcta'],
                raw: true
            })
        ]);

        procesarConteo(resSimulacro);
        procesarConteo(resPvP);
        procesarConteo(resIndividual);
        procesarConteo(resReto);

        // Formatear salida
        return Object.values(mapaEstadisticas).map(area => {
            const total = area.correctas + area.incorrectas;
            return {
                id_area: area.id_area,
                nombre: area.nombre,
                correctas: area.correctas,
                incorrectas: area.incorrectas,
                total: total,
                porcentaje: total > 0 ? Math.round((area.correctas / total) * 100) : 0
            };
        });

    } catch (error) {
        console.error("Error estadísticas áreas:", error);
        return [];
    }
  }

  async obtenerPerfilCompleto(idEstudiante) {
    try {
      // 1. Validar estudiante y obtener datos básicos
      const estudiantePromise = Usuario.findOne({
        where: { documento: idEstudiante, id_rol: 3 },
        include: [{ model: Institucion, attributes: ['nombre'] }],
        raw: true, // Más rápido, pero aplanará el objeto (institucion.nombre)
        nest: true // Mantiene estructura anidada
      });

      // Ejecutar validación de usuario primero para fallar rápido si no existe
      const estudiante = await estudiantePromise;
      if (!estudiante) throw new Error('Estudiante no encontrado');

      // 2. Ejecutar TODAS las consultas pesadas en PARALELO
      const [
        firebaseData,
        rachaVictorias,
        expGrupales,
        expPvP,
        modulosResueltos,
        ultimoSimulacro,
        estadisticasAreas,
        historialGrupales,
        historialPvP
      ] = await Promise.all([
        // A. Firebase (Información foto)
        (async () => {
            if (!estudiante.uid_firebase) return null;
            try {
                return await admin.auth().getUser(estudiante.uid_firebase);
            } catch (e) { return null; }
        })(),

        // B. Racha
        this.obtenerRachaVictorias(idEstudiante),

        // C. Experiencia Grupales
        ParticipanteSimulacro.sum('experiencia_ganada', { where: { id_estudiante: idEstudiante } }),

        // D. Experiencia PvP
        ParticipanteSala.sum('experiencia_ganada', { where: { id_estudiante: idEstudiante } }),

        // E. Módulos
        ResultadoReto.count({ where: { id_estudiante: idEstudiante } }),

        // F. Último Puntaje
        ResultadoSimulacro.findOne({
            where: { id_estudiante: idEstudiante, completado: true },
            order: [['fecha_fin', 'DESC']],
            attributes: ['puntaje_total'],
            raw: true
        }),

        // G. Áreas (Función optimizada arriba)
        this.obtenerEstadisticasAreas(idEstudiante),

        // H. Historial Grupal (Limit 10)
        ParticipanteSimulacro.findAll({
            where: { id_estudiante: idEstudiante, estado_jugador: 'finalizado' },
            include: [{ model: SimulacroGrupal, as: 'simulacro', attributes: ['cantidad_preguntas'] }],
            order: [['fecha_finalizacion', 'DESC']],
            limit: 10,
            attributes: ['posicion_final', 'preguntas_correctas', 'fecha_finalizacion']
        }),

        // I. Historial PvP (Limit 10)
        ParticipanteSala.findAll({
            where: { id_estudiante: idEstudiante, estado_jugador: 'finalizado' },
            include: [{ 
                model: SalaPrivada, as: 'sala', attributes: ['cantidad_preguntas'],
                include: [{ model: Area, as: 'area', attributes: ['nombre'] }]
            }],
            order: [['fecha_finalizacion', 'DESC']],
            limit: 10,
            attributes: ['posicion', 'preguntas_correctas', 'fecha_finalizacion']
        })
      ]);

      // 3. Procesar datos en memoria (Síncrono y rápido)
      
      const firebasePhoto = firebaseData?.photoURL || null;
      const firebaseName = firebaseData?.displayName || null;
      
      const experienciaTotal = (expGrupales || 0) + (expPvP || 0);
      const ultimoPuntaje = ultimoSimulacro ? ultimoSimulacro.puntaje_total : 0;

      // Formatear Historiales
      const historialGrupalesFmt = historialGrupales.map(p => ({
        tipo: 'Grupal',
        estado: p.posicion_final === 1 ? 'Victoria' : 'Derrota',
        titulo: 'Simulacro Clase', // Podrías buscar el nombre si lo tuvieras en el modelo
        correctas: p.preguntas_correctas,
        total: p.simulacro?.cantidad_preguntas || 0,
        fecha: p.fecha_finalizacion,
      }));

      const historialPvPFmt = historialPvP.map(p => ({
        tipo: 'Sala',
        estado: p.posicion === 1 ? 'Victoria' : 'Derrota',
        titulo: p.sala?.area?.nombre || 'Competencia',
        correctas: p.preguntas_correctas,
        total: p.sala?.cantidad_preguntas || 0,
        fecha: p.fecha_finalizacion,
      }));

      // Combinar, ordenar y cortar historial
      const historialCompleto = [...historialGrupalesFmt, ...historialPvPFmt]
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .slice(0, 10);

      // 4. Retornar Respuesta
      return {
        estudiante: {
          documento: estudiante.documento,
          nombre: estudiante.nombre,
          apellido: estudiante.apellido,
          nombre_completo: firebaseName || `${estudiante.nombre} ${estudiante.apellido}`,
          photoURL: firebasePhoto,
          institucion: estudiante.institucion ? estudiante.institucion.nombre : null
        },
        resumen: {
          racha_victorias: rachaVictorias,
          experiencia_total: experienciaTotal,
          modulos_resueltos: modulosResueltos,
          ultimo_puntaje_simulacro: ultimoPuntaje
        },
        areas: estadisticasAreas,
        historial: historialCompleto
      };

    } catch (error) {
      throw new Error(`Error servicio perfil: ${error.message}`);
    }
  }
}

export default new PerfilEstudianteService();