import ResultadoSimulacro from "../models/ResultadoSimulacro.js";
import ResultadoSesion from "../models/ResultadoSesion.js";
import Simulacro from "../models/Simulacro.js";
import Sesion from "../models/Sesion.js";
import ResultadoArea from "../models/ResultadoArea.js";
import Participante from "../models/Participante.js";
import CursoSimulacro from "../models/CursoSimulacro.js";
import Curso from "../models/Curso.js";
import { Op } from "sequelize";
import SesionPregunta from "../models/SesionPregunta.js";
import SesionArea from "../models/SesionArea.js";
import Area from "../models/Area.js";
import Pregunta from "../models/Pregunta.js";
import db from "../db/db.js";
import ProgresoSesion from "../models/ProgresoSesion.js";
import RespuestaEstudiante from "../models/RespuestaEstudiante.js";


async function obtenerUltimoSimulacro(id_usuario) {
    try {
        // Buscar el último simulacro del estudiante
        const ultimo = await ResultadoSimulacro.findOne({
            where: { id_estudiante: id_usuario, completado: true },
            order: [["fecha_fin", "DESC"]],
            include: [
                {
                    model: Simulacro,
                    include: [
                        {
                            model: Sesion,
                            as: "sesions",
                            include: [
                                {
                                    model: ResultadoSesion,
                                    as: "sesiones",
                                    attributes: [
                                        "tiempo_usado_segundos"
                                    ],
                                    include: [
                                        {
                                            model: ResultadoArea,
                                            as: "areas",
                                            attributes: ["correctas", "incorrectas"]
                                        }
                                    ]
                                }

                            ]
                        }
                    ]
                }
            ]
        });

        if (!ultimo) return null;

        // Calcular totales
        let tiempo_total = 0;
        let preguntas_total = 0;


        ultimo.simulacro.sesions.forEach((sesion) => {
            sesion.resultado_sesions.forEach((rs) => {
                rs.resultado_areas.forEach((area) => {
                    preguntas_total += area.correctas + area.incorrectas;
                });
                tiempo_total += Number(rs.tiempo_usado_segundos);

            });

        });
        return {
            id_simulacro: ultimo.id_simulacro,
            fecha: ultimo.fecha_fin,
            completado: ultimo.completado,
            puntaje_total: ultimo.puntaje_total,
            tiempo_total,
            preguntas_total,
        };
    } catch (error) {
        throw new Error("Error al obtener el último simulacro: " + error.message);
    }
}


async function obtenerSimulacrosDisponibles(id_estudiante) {
    try {

        const estudiante = await Participante.findOne({
            where: { documento_participante: id_estudiante }
        });
        // 1. Cursos a los que pertenece el estudiante
        const cursosEst = await Participante.findAll({
            where: { documento_participante: id_estudiante },
            attributes: ["grado", "grupo", "cohorte"],
        });

        if (!cursosEst.length) return [];

        // 2. Verificar que esos cursos existan y estén habilitados
        const cursosHabilitados = await Promise.all(
            cursosEst.map(async c => {
                return await Curso.findOne({
                    where: {
                        grado: c.grado,
                        grupo: c.grupo,
                        cohorte: c.cohorte,
                        id_institucion: estudiante.id_institucion,
                        habilitado: true
                    }
                });
            })
        );

        // Quitamos nulls
        const cursosValidos = cursosHabilitados.filter(c => c);

        if (!cursosValidos.length) return [];

        // Construimos condiciones de búsqueda
        const condicionesCurso = cursosValidos.map(c => ({
            grado: c.grado,
            grupo: c.grupo,
            cohorte: c.cohorte,
            id_institucion: c.id_institucion
        }));

        function ahoraColombia() {
            // Obtengo la hora local de Colombia (string)
            const str = new Date().toLocaleString("en-US", { timeZone: "America/Bogota" });

            // Transformo ese string a Date SIN conversión automática a UTC
            const [month, day, year, hour, minute, second] =
                str.match(/\d+/g).map(Number);

            return new Date(year, month - 1, day, hour, minute, second);
        }

        let ahora = ahoraColombia();

        // 3. Buscar los curso_simulacro activos
        // let ahora = new Date();
        const cursoSim = await CursoSimulacro.findAll({
            where: {
                [Op.or]: condicionesCurso,
                fecha_cierre_s2: { [Op.gt]: ahora }
            },
            include: [
                {
                    model: Simulacro,
                    include: [
                        {
                            model: Sesion,
                            as: "sesions"
                        }
                    ]
                }
            ]
        });

        // Importar ProgresoSesion si no está disponible en el scope (ya lo está arriba)

        const resultado = await Promise.all(cursoSim.map(async cs => {
            const sim = cs.simulacro;

            const sesionesConEstado = await Promise.all(sim.sesions.map(async sesion => {
                const orden = sesion.orden;

                // nombre dinámico: fecha_apertura_s1, fecha_cierre_s1, etc.
                const apertura = cs[`fecha_apertura_s${orden}`];
                const cierre = cs[`fecha_cierre_s${orden}`];

                let habilitada = false;

                if (apertura && cierre) {
                    habilitada = (apertura <= ahora && cierre > ahora);
                }

                // Verificar si ya está completada por el estudiante
                const progreso = await ProgresoSesion.findOne({
                    where: {
                        id_usuario: id_estudiante,
                        id_sesion: sesion.id_sesion,
                        completada: true
                    }
                });

                return {
                    ...sesion.get({ plain: true }),
                    habilitada,
                    completada: !!progreso,
                    fecha_apertura: apertura,
                    fecha_cierre: cierre
                };
            }));

            return {
                ...cs.get({ plain: true }),
                simulacro: {
                    ...sim.get({ plain: true }),
                    sesions: sesionesConEstado
                }
            };
        }));

        return resultado;

    } catch (error) {
        throw new Error("Error al obtener simulacros disponibles: " + error.message);
    }
}


async function obtenerResultadosSimulacro(id_simulacro, id_estudiante) {
    try {
        // 1. Verificar que el simulacro esté completado
        const resSim = await ResultadoSimulacro.findOne({
            where: {
                id_simulacro,
                id_estudiante,
                completado: true
            },
            include: [{
                model: ResultadoSesion,
                as: "sesiones",
                include: [{
                    model: ResultadoArea,
                    as: "areas",
                    include: [{ model: SesionArea, as: "sesion_area", include: [{ model: Area }] },
                    { model: RespuestaEstudiante, as: "respuestas" }]
                }]
            }]
        });

        if (!resSim) {
            return {
                disponible: false,
                mensaje: "El simulacro no ha sido completado"
            };
        }

        // 2. Calcular puntaje máximo total del simulacro (todas las sesiones)
        const simulacro = await Simulacro.findByPk(id_simulacro, {
            include: [{
                model: Sesion
            }]
        });

        const sesiones = simulacro.sesions || [];
        let puntajeMaximoTotal = 0;

        for (const sesion of sesiones) {
            const sesionPreguntas = await SesionPregunta.findAll({
                attributes: ['puntaje_base'],
                include: [{
                    model: SesionArea,
                    as: 'sesion_area',
                    where: { id_sesion: sesion.id_sesion },
                    attributes: [],
                    required: true
                }]
            });

            puntajeMaximoTotal += sesionPreguntas.reduce((sum, sp) =>
                sum + Number(sp.puntaje_base || 0), 0
            );
        }

        // 3. Agrupar resultados por área
        const resultadosPorArea = {};
        resSim.sesiones.forEach(rs => { // <--- CORRECCIÓN (sesiones)
            rs.areas.forEach(ra => { // <--- CORRECCIÓN (areas)
                const area = ra.sesion_area?.area;
                if (area) {
                    if (!resultadosPorArea[area.id_area]) {
                        resultadosPorArea[area.id_area] = {
                            id_area: area.id_area,
                            nombre_area: area.nombre,
                            puntaje_obtenido: 0,
                            puntaje_maximo: 0
                        };
                    }
                }
            });
        });


        // 4. Calcular puntaje máximo por área
        for (const sesion of sesiones) {
            const sesionAreas = await SesionArea.findAll({
                where: { id_sesion: sesion.id_sesion },
                include: [{
                    model: Area
                }]
            });

            for (const sa of sesionAreas) {
                const sesionPreguntas = await SesionPregunta.findAll({
                    attributes: ['puntaje_base'],
                    where: { id_sesion_area: sa.id_sesion_area }
                });

                const puntajeAreaMax = sesionPreguntas.reduce((sum, sp) =>
                    sum + Number(sp.puntaje_base || 0), 0
                );

                if (resultadosPorArea[sa.id_area]) {
                    resultadosPorArea[sa.id_area].puntaje_maximo += puntajeAreaMax;
                }
            }
        }

        // 5. Sumar puntajes obtenidos por área desde ResultadoArea
        // 5. Sumar puntajes obtenidos por área desde RespuestaEstudiante (calculado)
        resSim.sesiones.forEach(rs => {
            rs.areas.forEach(ra => {
                const area = ra.sesion_area?.area;

                if (area && resultadosPorArea[area.id_area]) {
                    let puntajeObtenidoArea = 0;

                    // Iterar sobre las respuestas incluidas en ResultadoArea
                    if (ra.respuestas && ra.respuestas.length > 0) { // <--- Usar el nuevo alias 'respuestas'
                        puntajeObtenidoArea = ra.respuestas.reduce((sum, respuesta) => {
                            // Sumar el puntaje de la respuesta individual
                            return sum + Number(respuesta.puntaje_respuesta || 0);
                        }, 0);
                    }

                    // Agregar al acumulador general del área
                    resultadosPorArea[area.id_area].puntaje_obtenido += puntajeObtenidoArea;
                }
            });
        });

        // 6. Calcular porcentajes por área
        const areasDetalle = Object.values(resultadosPorArea).map(area => ({
            ...area,
            porcentaje: area.puntaje_maximo > 0
                ? Math.round((area.puntaje_obtenido / area.puntaje_maximo) * 100)
                : 0
        }));

        // 7. Calcular puntaje final del simulacro
        // const puntajeFinalSimulacro = puntajeMaximoTotal > 0
        //     ? Math.round((resSim.puntaje_total / puntajeMaximoTotal) * 100)
        //     : 0;

        return {
            disponible: true,
            puntaje_total_obtenido: resSim.puntaje_total,
            puntaje_total_maximo: puntajeMaximoTotal,
            // puntaje_final_simulacro: puntajeFinalSimulacro,
            fecha_finalizacion: resSim.fecha_fin,
            areas: areasDetalle
        };

    } catch (error) {
        throw error;
    }
}

// async function crearSimulacro(datos) {
//     try {
//         const { nombre_simulacro, 
//             nombre_sesion1, nombre_sesion2, 
//             descripcion_s1, descripcion2, 
//             duracion_sesion_1, duracion_sesion_2, preguntas } = datos;

//         // Definir estructura de sesiones y áreas
//         const estructuraSimulacro = [
//             {
//                 orden: 1,
//                 duracion_segundos: duracion_sesion_1,
//                 areas: [
//                     { id_area: 2, cantidad: 25, puntos: 49 }, // Matemáticas
//                     { id_area: 1, cantidad: 41, puntos: 81 }, // Lectura Crítica
//                     { id_area: 4, cantidad: 25, puntos: 49 }, // Ciencias Sociales
//                     { id_area: 3, cantidad: 29, puntos: 57 }  // Ciencias Naturales
//                 ]
//             },
//             {
//                 orden: 2,
//                 duracion_segundos: duracion_sesion_2,
//                 areas: [
//                     { id_area: 2, cantidad: 25, puntos: 49 }, // Matemáticas
//                     { id_area: 4, cantidad: 25, puntos: 49 }, // Ciencias Sociales
//                     { id_area: 3, cantidad: 29, puntos: 57 }, // Ciencias Naturales
//                     { id_area: 5, cantidad: 55, puntos: 109 }  // Inglés
//                 ]
//             }
//         ];

//         // Crear simulacro
//         const nuevoSimulacro = await Simulacro.create({ nombre });

//         // Crear sesiones y áreas para cada sesión
//         for (const sesionData of estructuraSimulacro) {
//             const nuevaSesion = await Sesion.create({
//                 id_simulacro: nuevoSimulacro.id_simulacro,
//                 orden: sesionData.orden,
//                 duracion_segundos: sesionData.duracion_segundos
//             });

//             for (const areaData of sesionData.areas) {
//                 const nuevaSesionArea = await SesionArea.create({
//                     id_sesion: nuevaSesion.id_sesion,
//                     id_area: areaData.id_area
//                 });

//                 // Asignar preguntas del banco o crear nuevas
//                 const preguntasArea = preguntas?.filter(p => 
//                     p.id_area === areaData.id_area && p.sesion === sesionData.orden
//                 ) || [];

//                 for (const pregunta of preguntasArea) {
//                     await SesionPregunta.create({
//                         id_sesion_area: nuevaSesionArea.id_sesion_area,
//                         id_pregunta: pregunta.id_pregunta,
//                         puntaje_base: pregunta.puntaje_base || 1
//                     });
//                 }
//             }
//         }

//         return nuevoSimulacro;
//     } catch (error) {
//         throw new Error("Error al crear simulacro: " + error.message);
//     }
// }


const ESTRUCTURA_ICFES = [
    {
        orden: 1,
        nombre: "Sesión 1",
        areas: [
            { id_area: 2, nombre: "Matemáticas", cantidad: 25 },      // 25 preguntas
            { id_area: 1, nombre: "Lectura Crítica", cantidad: 41 },  // 41 preguntas
            { id_area: 4, nombre: "Ciencias Sociales", cantidad: 25 },// 25 preguntas
            { id_area: 3, nombre: "Ciencias Naturales", cantidad: 29 }// 29 preguntas
        ]
        // Total Sesión 1: 120 preguntas
    },
    {
        orden: 2,
        nombre: "Sesión 2",
        areas: [
            { id_area: 2, nombre: "Matemáticas", cantidad: 25 },      // 25 preguntas
            { id_area: 4, nombre: "Ciencias Sociales", cantidad: 25 },// 25 preguntas
            { id_area: 3, nombre: "Ciencias Naturales", cantidad: 29 },// 29 preguntas
            { id_area: 5, nombre: "Inglés", cantidad: 55 }            // 55 preguntas
        ]
        // Total Sesión 2: 134 preguntas
    }
];


async function crearSimulacro(datos) {
    const t = await db.transaction();

    try {
        const {
            nombre_simulacro,
            duracion_sesion_1 = 27000, // 7.5 horas por defecto (ICFES)
            duracion_sesion_2 = 27000,
            preguntas_sesion1,
            preguntas_sesion2
        } = datos;

        // Validaciones básicas
        if (!nombre_simulacro) {
            throw new Error("El nombre del simulacro es obligatorio");
        }

        // Las preguntas son opcionales - se pueden agregar después
        const tienePreguntas = preguntas_sesion1 && preguntas_sesion2;

        // 1. Crear el simulacro
        const nuevoSimulacro = await Simulacro.create({
            nombre: nombre_simulacro,
            descripcion: datos.descripcion || null,
            estado: true,
            fecha_creacion: new Date()
        }, { transaction: t });

        console.log(`✅ Simulacro creado: ${nuevoSimulacro.id_simulacro} - ${nombre_simulacro}`);

        // 2. Duraciones por sesión
        const duraciones = [duracion_sesion_1, duracion_sesion_2];

        // 3. Mapeo de preguntas recibidas (si se proporcionan)
        const preguntasPorSesion = tienePreguntas ? [
            {
                2: preguntas_sesion1.matematicas || [],      // id_area: 2
                1: preguntas_sesion1.lectura_critica || [],  // id_area: 1
                4: preguntas_sesion1.sociales || [],         // id_area: 4
                3: preguntas_sesion1.naturales || []         // id_area: 3
            },
            {
                2: preguntas_sesion2.matematicas || [],      // id_area: 2
                4: preguntas_sesion2.sociales || [],         // id_area: 4
                3: preguntas_sesion2.naturales || [],        // id_area: 3
                5: preguntas_sesion2.ingles || []            // id_area: 5
            }
        ] : [{}, {}];

        // 4. Crear sesiones según estructura ICFES
        for (let i = 0; i < ESTRUCTURA_ICFES.length; i++) {
            const estructuraSesion = ESTRUCTURA_ICFES[i];
            const preguntasSesion = preguntasPorSesion[i];

            // Crear sesión
            const nuevaSesion = await Sesion.create({
                id_simulacro: nuevoSimulacro.id_simulacro,
                nombre: estructuraSesion.nombre,
                orden: estructuraSesion.orden,
                descripcion: `${estructuraSesion.nombre} - ICFES Saber 11`,
                duracion_segundos: duraciones[i]
            }, { transaction: t });

            console.log(`✅ ${estructuraSesion.nombre} creada: ${nuevaSesion.id_sesion}`);

            let ordenGlobalPregunta = 1; // Orden secuencial en toda la sesión

            // 5. Crear áreas y asignar preguntas
            for (let index = 0; index < estructuraSesion.areas.length; index++) {
                const areaConfig = estructuraSesion.areas[index];
                const { id_area, nombre, cantidad } = areaConfig;

                // Crear SesionArea
                const nuevaSesionArea = await SesionArea.create({
                    id_sesion: nuevaSesion.id_sesion,
                    id_area: id_area,
                    orden_area: index + 1,
                    cantidad_preguntas: tienePreguntas ? cantidad : 0
                }, { transaction: t });

                // Obtener preguntas para esta área (si se proporcionaron)
                const preguntasArea = tienePreguntas ? (preguntasSesion[id_area] || []) : [];

                // Si se proporcionaron preguntas, validar cantidad
                if (tienePreguntas && preguntasArea.length !== cantidad) {
                    throw new Error(
                        `${estructuraSesion.nombre} - ${nombre}: ` +
                        `Se esperaban ${cantidad} preguntas, pero se recibieron ${preguntasArea.length}`
                    );
                }

                if (tienePreguntas) {
                    console.log(`  📝 Procesando ${nombre}: ${preguntasArea.length} preguntas`);

                    // Validar que todas las preguntas existan y sean del área correcta
                    for (const id_pregunta of preguntasArea) {
                        const pregunta = await Pregunta.findByPk(id_pregunta, { transaction: t });

                        if (!pregunta) {
                            throw new Error(`La pregunta ${id_pregunta} no existe en la base de datos`);
                        }

                        if (pregunta.id_area !== id_area) {
                            throw new Error(
                                `La pregunta ${id_pregunta} pertenece al área ${pregunta.id_area}, ` +
                                `no al área ${id_area} (${nombre})`
                            );
                        }

                        // Crear SesionPregunta
                        await SesionPregunta.create({
                            id_sesion_area: nuevaSesionArea.id_sesion_area,
                            id_pregunta: id_pregunta,
                            orden_en_sesion: ordenGlobalPregunta,
                            puntaje_base: 0.5 // Puntaje base por defecto
                        }, { transaction: t });

                        ordenGlobalPregunta++;
                    }

                    console.log(`  ✅ ${nombre}: ${preguntasArea.length} preguntas asignadas`);
                } else {
                    console.log(`  📝 ${nombre}: estructura creada (sin preguntas aún)`);
                }
            }

            await t.commit();

            console.log(`🎉 Simulacro "${nombre_simulacro}" creado exitosamente`);

            return {
                status: "ok",
                mensaje: tienePreguntas ? "Simulacro creado exitosamente con todas las preguntas" : "Simulacro creado exitosamente (estructura base)",
                simulacro: {
                    id_simulacro: nuevoSimulacro.id_simulacro,
                    nombre: nombre_simulacro,
                    sesion1_preguntas: tienePreguntas ? 120 : 0,
                    sesion2_preguntas: tienePreguntas ? 134 : 0,
                    total_preguntas: tienePreguntas ? 254 : 0
                }
            };
        }

    } catch (error) {
        await t.rollback();
        console.error("❌ Error al crear simulacro:", error.message);
        throw error;
    }
}


/**
 * Validar que las preguntas cumplan con la estructura ICFES
 */
function validarEstructuraPreguntas(preguntas_sesion1, preguntas_sesion2) {
    const errores = [];

    // Validar Sesión 1
    if (!preguntas_sesion1.matematicas || preguntas_sesion1.matematicas.length !== 25) {
        errores.push("Sesión 1 - Matemáticas: debe tener exactamente 25 preguntas");
    }
    if (!preguntas_sesion1.lectura_critica || preguntas_sesion1.lectura_critica.length !== 41) {
        errores.push("Sesión 1 - Lectura Crítica: debe tener exactamente 41 preguntas");
    }
    if (!preguntas_sesion1.sociales || preguntas_sesion1.sociales.length !== 25) {
        errores.push("Sesión 1 - Ciencias Sociales: debe tener exactamente 25 preguntas");
    }
    if (!preguntas_sesion1.naturales || preguntas_sesion1.naturales.length !== 29) {
        errores.push("Sesión 1 - Ciencias Naturales: debe tener exactamente 29 preguntas");
    }

    // Validar Sesión 2
    if (!preguntas_sesion2.matematicas || preguntas_sesion2.matematicas.length !== 25) {
        errores.push("Sesión 2 - Matemáticas: debe tener exactamente 25 preguntas");
    }
    if (!preguntas_sesion2.sociales || preguntas_sesion2.sociales.length !== 25) {
        errores.push("Sesión 2 - Ciencias Sociales: debe tener exactamente 25 preguntas");
    }
    if (!preguntas_sesion2.naturales || preguntas_sesion2.naturales.length !== 29) {
        errores.push("Sesión 2 - Ciencias Naturales: debe tener exactamente 29 preguntas");
    }
    if (!preguntas_sesion2.ingles || preguntas_sesion2.ingles.length !== 55) {
        errores.push("Sesión 2 - Inglés: debe tener exactamente 55 preguntas");
    }

    return errores;
}


/**
 * Obtener estructura ICFES oficial
 */
function obtenerEstructuraICFES() {
    return ESTRUCTURA_ICFES;
}

/**
 * Obtener todos los simulacros con filtros y paginación
 */
async function obtenerTodos(filtros = {}, paginacion = {}) {
    try {
        const { page = 1, limit = 10 } = paginacion;
        const offset = (page - 1) * limit;

        const where = {};
        if (filtros.estado !== undefined) {
            where.estado = filtros.estado;
        }

        const { count, rows } = await Simulacro.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['fecha_creacion', 'DESC']]
        });

        return {
            data: rows,
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit)
        };
    } catch (error) {
        throw new Error("Error al obtener simulacros: " + error.message);
    }
}

/**
 * Obtener un simulacro por ID con todas sus relaciones
 */
async function obtenerPorId(id_simulacro) {
    try {
        const simulacro = await Simulacro.findByPk(id_simulacro, {
            include: [
                {
                    model: Sesion,
                    as: 'sesions',
                    include: [
                        {
                            model: SesionArea,
                            include: [
                                {
                                    model: Area
                                },
                                {
                                    model: SesionPregunta,
                                    include: [
                                        {
                                            model: Pregunta
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        return simulacro;
    } catch (error) {
        throw new Error("Error al obtener simulacro: " + error.message);
    }
}

/**
 * Actualizar un simulacro
 */
async function actualizarSimulacro(id_simulacro, datos) {
    try {
        const simulacro = await Simulacro.findByPk(id_simulacro);

        if (!simulacro) {
            throw new Error("Simulacro no encontrado");
        }

        if (datos.nombre !== undefined) simulacro.nombre = datos.nombre;
        if (datos.descripcion !== undefined) simulacro.descripcion = datos.descripcion;
        if (datos.estado !== undefined) simulacro.estado = datos.estado;

        await simulacro.save();

        return simulacro;
    } catch (error) {
        throw new Error("Error al actualizar simulacro: " + error.message);
    }
}

/**
 * Desactivar un simulacro (soft delete)
 */
async function desactivarSimulacro(id_simulacro) {
    try {
        const simulacro = await Simulacro.findByPk(id_simulacro);

        if (!simulacro) {
            throw new Error("Simulacro no encontrado");
        }

        simulacro.estado = false;
        await simulacro.save();

        return simulacro;
    } catch (error) {
        throw new Error("Error al desactivar simulacro: " + error.message);
    }
}

/**
 * Asignar simulacro a cursos
 */
async function asignarSimulacroACursos(id_simulacro, asignaciones) {
    const t = await db.transaction();

    try {
        // Validar que el simulacro existe
        const simulacro = await Simulacro.findByPk(id_simulacro, { transaction: t });
        if (!simulacro) {
            throw new Error("Simulacro no encontrado");
        }

        const resultados = [];

        for (const asignacion of asignaciones) {
            const { grado, grupo, cohorte, id_institucion, fecha_apertura_s1, fecha_cierre_s1, fecha_apertura_s2, fecha_cierre_s2 } = asignacion;

            // Validar que el curso existe
            const curso = await Curso.findOne({
                where: { grado, grupo, cohorte, id_institucion },
                transaction: t
            });

            if (!curso) {
                throw new Error(`Curso ${grado}${grupo} (cohorte ${cohorte}) no encontrado en la institución ${id_institucion}`);
            }

            // Verificar si ya existe la asignación (usando grado, grupo, cohorte, id_simulacro)
            const existe = await CursoSimulacro.findOne({
                where: {
                    id_simulacro,
                    grado,
                    grupo,
                    cohorte
                },
                transaction: t
            });

            if (existe) {
                // Actualizar fechas
                existe.fecha_apertura_s1 = fecha_apertura_s1;
                existe.fecha_cierre_s1 = fecha_cierre_s1;
                existe.fecha_apertura_s2 = fecha_apertura_s2;
                existe.fecha_cierre_s2 = fecha_cierre_s2;
                await existe.save({ transaction: t });
                resultados.push({ ...existe.get({ plain: true }), actualizado: true });
            } else {
                // Crear nueva asignación
                // Obtener el siguiente id_curso_simulacro
                const ultimo = await CursoSimulacro.findOne({
                    order: [['id_curso_simulacro', 'DESC']],
                    transaction: t
                });
                const nuevoId = ultimo ? ultimo.id_curso_simulacro + 1 : 1;

                const nuevaAsignacion = await CursoSimulacro.create({
                    id_curso_simulacro: nuevoId,
                    id_simulacro,
                    grado,
                    grupo,
                    cohorte,
                    fecha_apertura_s1,
                    fecha_cierre_s1,
                    fecha_apertura_s2,
                    fecha_cierre_s2
                }, { transaction: t });

                resultados.push({ ...nuevaAsignacion.get({ plain: true }), actualizado: false });
            }
        }

        await t.commit();
        return resultados;
    } catch (error) {
        await t.rollback();
        throw new Error("Error al asignar simulacro: " + error.message);
    }
}

/**
 * Agregar pregunta a una sesión/área
 */
async function agregarPreguntaASesion(id_simulacro, numero_sesion, id_area, id_pregunta, puntaje_base = 0.5) {
    const t = await db.transaction();

    try {
        // Obtener la sesión
        const sesion = await Sesion.findOne({
            where: {
                id_simulacro,
                orden: numero_sesion
            },
            transaction: t
        });

        if (!sesion) {
            throw new Error(`Sesión ${numero_sesion} no encontrada en el simulacro ${id_simulacro}`);
        }

        // Obtener o crear SesionArea
        let sesionArea = await SesionArea.findOne({
            where: {
                id_sesion: sesion.id_sesion,
                id_area
            },
            transaction: t
        });

        if (!sesionArea) {
            // Obtener el orden del área
            const areasEnSesion = await SesionArea.count({
                where: { id_sesion: sesion.id_sesion },
                transaction: t
            });

            sesionArea = await SesionArea.create({
                id_sesion: sesion.id_sesion,
                id_area,
                orden_area: areasEnSesion + 1,
                cantidad_preguntas: 0
            }, { transaction: t });
        }

        // Verificar que la pregunta existe y pertenece al área
        const pregunta = await Pregunta.findByPk(id_pregunta, { transaction: t });
        if (!pregunta) {
            throw new Error(`Pregunta ${id_pregunta} no encontrada`);
        }
        if (pregunta.id_area !== id_area) {
            throw new Error(`La pregunta ${id_pregunta} no pertenece al área ${id_area}`);
        }

        // Verificar que no esté ya agregada
        const existe = await SesionPregunta.findOne({
            where: {
                id_sesion_area: sesionArea.id_sesion_area,
                id_pregunta
            },
            transaction: t
        });

        if (existe) {
            throw new Error("La pregunta ya está agregada a esta sesión/área");
        }

        // Obtener el orden en la sesión
        const preguntasEnSesion = await SesionPregunta.count({
            include: [{
                model: SesionArea,
                where: { id_sesion: sesion.id_sesion },
                required: true
            }],
            transaction: t
        });

        // Crear SesionPregunta
        await SesionPregunta.create({
            id_sesion_area: sesionArea.id_sesion_area,
            id_pregunta,
            orden_en_sesion: preguntasEnSesion + 1,
            puntaje_base
        }, { transaction: t });

        // Actualizar cantidad de preguntas en SesionArea
        sesionArea.cantidad_preguntas = (sesionArea.cantidad_preguntas || 0) + 1;
        await sesionArea.save({ transaction: t });

        await t.commit();
        return { success: true, mensaje: "Pregunta agregada correctamente" };
    } catch (error) {
        await t.rollback();
        throw error;
    }
}

/**
 * Eliminar pregunta de una sesión/área
 */
async function eliminarPreguntaDeSesion(id_simulacro, numero_sesion, id_area, id_pregunta) {
    const t = await db.transaction();

    try {
        // Obtener la sesión
        const sesion = await Sesion.findOne({
            where: {
                id_simulacro,
                orden: numero_sesion
            },
            transaction: t
        });

        if (!sesion) {
            throw new Error(`Sesión ${numero_sesion} no encontrada`);
        }

        // Obtener SesionArea
        const sesionArea = await SesionArea.findOne({
            where: {
                id_sesion: sesion.id_sesion,
                id_area
            },
            transaction: t
        });

        if (!sesionArea) {
            throw new Error("Área no encontrada en esta sesión");
        }

        // Eliminar SesionPregunta
        const eliminado = await SesionPregunta.destroy({
            where: {
                id_sesion_area: sesionArea.id_sesion_area,
                id_pregunta
            },
            transaction: t
        });

        if (eliminado === 0) {
            throw new Error("Pregunta no encontrada en esta sesión/área");
        }

        // Actualizar cantidad de preguntas
        sesionArea.cantidad_preguntas = Math.max(0, (sesionArea.cantidad_preguntas || 0) - 1);
        await sesionArea.save({ transaction: t });

        await t.commit();
        return { success: true, mensaje: "Pregunta eliminada correctamente" };
    } catch (error) {
        await t.rollback();
        throw error;
    }
}

export default {
    obtenerUltimoSimulacro,
    obtenerSimulacrosDisponibles,
    obtenerResultadosSimulacro,
    crearSimulacro,
    validarEstructuraPreguntas,
    obtenerEstructuraICFES,
    obtenerTodos,
    obtenerPorId,
    actualizarSimulacro,
    desactivarSimulacro,
    asignarSimulacroACursos,
    agregarPreguntaASesion,
    eliminarPreguntaDeSesion
};
