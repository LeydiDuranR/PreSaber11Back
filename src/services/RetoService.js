import Reto from "../models/Reto.js";
import Tema from "../models/Tema.js";
import Area from "../models/Area.js";
import Pregunta from "../models/Pregunta.js";
import RetoPregunta from "../models/RetoPregunta.js";
import Opcion from "../models/Opcion.js";
import RespuestasReto from "../models/RespuestasReto.js";
import ResultadoReto from "../models/ResultadoReto.js";
import { Op } from "sequelize";
import db from "../db/db.js";

class RetoService {

    // Listar retos por área
  async listarRetosPorArea(idArea) {
        try {
            const retos = await Reto.findAll({
                include: [
                    {
                        model: Tema,
                        where: { id_area: idArea },
                        attributes: ['id_tema', 'descripcion']
                    }
                ],
                attributes: ['id_reto', 'nombre', 'descripcion', 'nivel_dificultad', 'duracion', 'cantidad_preguntas']
            });

            // Obtener la primera imagen de cada reto usando una consulta directa
            const retosConImagen = await Promise.all(
                retos.map(async (reto) => {
                    // Consulta directa a través de la tabla intermedia
                    const primeraPregunta = await db.query(`
          SELECT p.imagen 
          FROM pregunta p
          INNER JOIN reto_pregunta rp ON p.id_pregunta = rp.id_pregunta
          WHERE rp.id_reto = :idReto 
          AND p.imagen IS NOT NULL
          LIMIT 1
        `, {
                        replacements: { idReto: reto.id_reto },
                        type: db.QueryTypes.SELECT
                    });

                    return {
                        id_reto: reto.id_reto,
                        nombre: reto.nombre,
                        descripcion: reto.descripcion,
                        nivel_dificultad: reto.nivel_dificultad,
                        duracion: reto.duracion,
                        cantidad_preguntas: reto.cantidad_preguntas,
                        imagen: primeraPregunta[0]?.imagen || null,
                        tema: reto.tema
                    };
                })
            );

            return retosConImagen;
        } catch (error) {
            throw new Error(`Error al listar retos por área: ${error.message}`);
        }
  }

  // Obtener preguntas de un reto con sus opciones
  async obtenerPreguntasReto(idReto) {
    try {
      const reto = await Reto.findByPk(idReto);
      if (!reto) {
        throw new Error('Reto no encontrado');
      }

      // Consulta SQL directa para obtener preguntas con sus opciones
      const preguntas = await db.query(`
        SELECT 
          p.id_pregunta,
          p.enunciado,
          p.imagen,
          p.nivel_dificultad,
          o.id_opcion,
          o.texto_opcion,
          o.imagen as imagen_opcion
        FROM pregunta p
        INNER JOIN reto_pregunta rp ON p.id_pregunta = rp.id_pregunta
        LEFT JOIN opcion o ON p.id_pregunta = o.id_pregunta
        WHERE rp.id_reto = :idReto
        ORDER BY p.id_pregunta, o.id_opcion
      `, {
        replacements: { idReto },
        type: db.QueryTypes.SELECT
      });

      // Agrupar opciones por pregunta
      const preguntasMap = new Map();
      preguntas.forEach(row => {
        if (!preguntasMap.has(row.id_pregunta)) {
          preguntasMap.set(row.id_pregunta, {
            id_pregunta: row.id_pregunta,
            enunciado: row.enunciado,
            imagen: row.imagen,
            nivel_dificultad: row.nivel_dificultad,
            opciones: []
          });
        }
        
        if (row.id_opcion) {
          preguntasMap.get(row.id_pregunta).opciones.push({
            id_opcion: row.id_opcion,
            texto_opcion: row.texto_opcion,
            imagen: row.imagen_opcion
          });
        }
      });

      return {
        reto: {
          id_reto: reto.id_reto,
          nombre: reto.nombre,
          descripcion: reto.descripcion,
          duracion: reto.duracion,
          cantidad_preguntas: reto.cantidad_preguntas
        },
        preguntas: Array.from(preguntasMap.values())
      };
    } catch (error) {
      throw new Error(`Error al obtener preguntas del reto: ${error.message}`);
    }
  }

  // Guardar respuesta del estudiante
   async guardarRespuesta(idEstudiante, idReto, idOpcion) {
    const transaction = await db.transaction();
    
    try {
      // Verificar que la opción pertenece a una pregunta del reto usando SQL directo
      const validacion = await db.query(`
        SELECT o.id_opcion, o.id_pregunta
        FROM opcion o
        INNER JOIN pregunta p ON o.id_pregunta = p.id_pregunta
        INNER JOIN reto_pregunta rp ON p.id_pregunta = rp.id_pregunta
        WHERE o.id_opcion = :idOpcion AND rp.id_reto = :idReto
        LIMIT 1
      `, {
        replacements: { idOpcion, idReto },
        type: db.QueryTypes.SELECT,
        transaction
      });

      if (validacion.length === 0) {
        await transaction.rollback();
        throw new Error('La opción no pertenece a este reto');
      }

      const idPregunta = validacion[0].id_pregunta;

      // Verificar si ya existe una respuesta para esta pregunta en este reto
      const respuestaExistente = await db.query(`
        SELECT rr.id_respuestas_reto, rr.id_opcion
        FROM respuestas_reto rr
        INNER JOIN opcion o ON rr.id_opcion = o.id_opcion
        WHERE rr.id_estudiante = :idEstudiante 
        AND rr.id_reto = :idReto
        AND o.id_pregunta = :idPregunta
        LIMIT 1
      `, {
        replacements: { idEstudiante, idReto, idPregunta },
        type: db.QueryTypes.SELECT,
        transaction
      });

      let resultado;
      
      if (respuestaExistente.length > 0) {
        // Actualizar la respuesta existente
        await db.query(`
          UPDATE respuestas_reto 
          SET id_opcion = :idOpcion
          WHERE id_respuestas_reto = :idRespuesta
        `, {
          replacements: { 
            idOpcion, 
            idRespuesta: respuestaExistente[0].id_respuestas_reto 
          },
          type: db.QueryTypes.UPDATE,
          transaction
        });
        
        resultado = {
          id_respuestas_reto: respuestaExistente[0].id_respuestas_reto,
          id_estudiante: idEstudiante,
          id_reto: idReto,
          id_opcion: idOpcion,
          actualizado: true
        };
      } else {
        // Crear nueva respuesta
        const nuevaRespuesta = await RespuestasReto.create({
          id_estudiante: idEstudiante,
          id_reto: idReto,
          id_opcion: idOpcion
        }, { transaction });
        
        resultado = {
          id_respuestas_reto: nuevaRespuesta.id_respuestas_reto,
          id_estudiante: nuevaRespuesta.id_estudiante,
          id_reto: nuevaRespuesta.id_reto,
          id_opcion: nuevaRespuesta.id_opcion,
          actualizado: false
        };
      }
      
      await transaction.commit();
      return resultado;
      
    } catch (error) {
      // Solo hacer rollback si la transacción no ha sido finalizada
      if (!transaction.finished) {
        await transaction.rollback();
      }
      throw new Error(`Error al guardar respuesta: ${error.message}`);
    }
  }

  // Obtener respuestas del estudiante para un reto
  async obtenerRespuestasEstudiante(idEstudiante, idReto) {
    try {
      const respuestas = await db.query(`
        SELECT 
          rr.id_respuestas_reto,
          rr.id_opcion,
          o.texto_opcion,
          p.id_pregunta,
          p.enunciado
        FROM respuestas_reto rr
        INNER JOIN opcion o ON rr.id_opcion = o.id_opcion
        INNER JOIN pregunta p ON o.id_pregunta = p.id_pregunta
        WHERE rr.id_estudiante = :idEstudiante 
        AND rr.id_reto = :idReto
        ORDER BY p.id_pregunta
      `, {
        replacements: { idEstudiante, idReto },
        type: db.QueryTypes.SELECT
      });

      return respuestas.map(r => ({
        id_respuesta: r.id_respuestas_reto,
        id_pregunta: r.id_pregunta,
        enunciado_pregunta: r.enunciado,
        id_opcion: r.id_opcion,
        texto_opcion: r.texto_opcion
      }));
    } catch (error) {
      throw new Error(`Error al obtener respuestas: ${error.message}`);
    }
  }

  // Calcular y guardar resultado del reto
  async calcularResultado(idEstudiante, idReto, duracionRealizada) {
    const transaction = await db.transaction();
    
    try {
      // Obtener todas las respuestas del estudiante con información de corrección
      const respuestas = await db.query(`
        SELECT 
          rr.id_respuestas_reto,
          o.es_correcta
        FROM respuestas_reto rr
        INNER JOIN opcion o ON rr.id_opcion = o.id_opcion
        WHERE rr.id_estudiante = :idEstudiante 
        AND rr.id_reto = :idReto
      `, {
        replacements: { idEstudiante, idReto },
        type: db.QueryTypes.SELECT,
        transaction
      });

      // Contar respuestas correctas
      const correctas = respuestas.filter(r => r.es_correcta === 1 || r.es_correcta === true).length;
      const totalPreguntas = respuestas.length;
      
      // Calcular puntaje (porcentaje)
      const puntaje = totalPreguntas > 0 ? (correctas / totalPreguntas) * 100 : 0;
      
      // Calcular experiencia
      const experiencia = correctas * 10;
      
      // Generar frase motivadora
      const frase = this.generarFraseMotivadora(puntaje, idReto);
      
      // Guardar resultado
      const resultado = await ResultadoReto.create({
        id_estudiante: idEstudiante,
        id_reto: idReto,
        puntaje_total: puntaje.toFixed(2),
        fecha_realizacion: new Date(),
        duracion: duracionRealizada
      }, { transaction });

      // Eliminar respuestas temporales
/*       await RespuestasReto.destroy({
        where: {
          id_estudiante: idEstudiante,
          id_reto: idReto
        },
        transaction
      }); */

      await transaction.commit();

      return {
        id_resultado: resultado.id_resultado_reto,
        preguntas_correctas: correctas,
        total_preguntas: totalPreguntas,
        puntaje: puntaje.toFixed(2),
        experiencia: experiencia,
        frase_motivadora: frase,
        fecha_realizacion: resultado.fecha_realizacion,
        duracion: resultado.duracion
      };
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Error al calcular resultado: ${error.message}`);
    }
  }

  // Generar frase motivadora según el puntaje
  generarFraseMotivadora(puntaje, idReto) {
    const frases = {
      excelente: [
        "¡Excelente trabajo! Dominas este tema.",
        "¡Increíble! Sigue así y llegarás muy lejos.",
        "¡Perfecto! Tu dedicación está dando frutos."
      ],
      bueno: [
        "¡Buen trabajo! Vas por buen camino.",
        "¡Muy bien! Con un poco más de práctica serás experto.",
        "¡Bien hecho! Continúa practicando."
      ],
      regular: [
        "Buen intento. Sigue practicando para mejorar.",
        "Vas progresando. La práctica hace al maestro.",
        "Continúa esforzándote, cada intento cuenta."
      ],
      bajo: [
        "No te desanimes. Repasa el tema y vuelve a intentarlo.",
        "Sigue practicando, cada error es una oportunidad de aprendizaje.",
        "Tómate tu tiempo para estudiar y vuelve a intentarlo."
      ]
    };

    let categoria;
    if (puntaje >= 90) categoria = 'excelente';
    else if (puntaje >= 70) categoria = 'bueno';
    else if (puntaje >= 50) categoria = 'regular';
    else categoria = 'bajo';

    const frasesCategoria = frases[categoria];
    return frasesCategoria[Math.floor(Math.random() * frasesCategoria.length)];
  }

  // Obtener historial de resultados de un estudiante
  async obtenerHistorialResultados(idEstudiante, idArea = null) {
    try {
      const whereClause = { id_estudiante: idEstudiante };
      
      const resultados = await ResultadoReto.findAll({
        where: whereClause,
        include: [
          {
            model: Reto,
            attributes: ['id_reto', 'nombre', 'nivel_dificultad'],
            include: idArea ? [{
              model: Tema,
              where: { id_area: idArea },
              attributes: ['descripcion']
            }] : [{
              model: Tema,
              attributes: ['descripcion'],
              include: [{
                model: Area,
                attributes: ['nombre']
              }]
            }]
          }
        ],
        order: [['fecha_realizacion', 'DESC']]
      });

      return resultados.map(r => ({
        id_resultado: r.id_resultado_reto,
        reto: r.reto.nombre,
        nivel_dificultad: r.reto.nivel_dificultad,
        tema: r.reto.tema.descripcion,
        area: r.reto.tema.area ? r.reto.tema.area.nombre : null,
        puntaje: r.puntaje_total,
        fecha_realizacion: r.fecha_realizacion,
        duracion: r.duracion
      }));
    } catch (error) {
      throw new Error(`Error al obtener historial: ${error.message}`);
    }
  }

  async crearReto(datosReto) {
    const transaction = await db.transaction();
    
    try {
      const { nombre, descripcion, nivel_dificultad, duracion, cantidad_preguntas, id_tema } = datosReto;

      // 1. Verificar si hay suficientes preguntas disponibles para el tema
      const preguntasDisponibles = await Pregunta.count({
        where: { id_tema: id_tema }
      });

      if (preguntasDisponibles < cantidad_preguntas) {
        throw new Error(`No hay suficientes preguntas en este tema. Disponibles: ${preguntasDisponibles}, Solicitadas: ${cantidad_preguntas}`);
      }

      // 2. Crear el Reto
      const nuevoReto = await Reto.create({
        nombre,
        descripcion,
        nivel_dificultad,
        duracion,
        cantidad_preguntas,
        id_tema,
        fecha_creacion: new Date()
      }, { transaction });

      // 3. Seleccionar preguntas aleatorias del tema
      // Usamos db.fn('RAND') o 'RANDOM' dependiendo del motor de DB (MySQL usa RAND())
      const preguntasSeleccionadas = await Pregunta.findAll({
        where: { id_tema: id_tema },
        order: [db.fn('RAND')], // Orden aleatorio
        limit: cantidad_preguntas,
        attributes: ['id_pregunta'],
        transaction
      });

      // 4. Asociar preguntas al reto (Tabla intermedia RetoPregunta)
      const retoPreguntasData = preguntasSeleccionadas.map(p => ({
        id_reto: nuevoReto.id_reto,
        id_pregunta: p.id_pregunta
      }));

      await RetoPregunta.bulkCreate(retoPreguntasData, { transaction });

      await transaction.commit();

      return {
        success: true,
        message: 'Reto creado exitosamente',
        reto: nuevoReto
      };

    } catch (error) {
      await transaction.rollback();
      throw new Error(`Error al crear el reto: ${error.message}`);
    }
  }
}

export default new RetoService();