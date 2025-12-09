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
                                    as: "resultado_sesions",
                                    attributes: [
                                        "tiempo_usado_segundos"
                                    ],
                                    include: [
                                        {
                                            model: ResultadoArea,
                                            as: "resultado_areas",
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
            cohorte: c.cohorte
        }));

        // function ahoraColombia() {
        //     // Obtengo la hora local de Colombia (string)
        //     const str = new Date().toLocaleString("en-US", { timeZone: "America/Bogota" });

        //     // Transformo ese string a Date SIN conversión automática a UTC
        //     const [month, day, year, hour, minute, second] =
        //         str.match(/\d+/g).map(Number);

        //     return new Date(year, month - 1, day, hour, minute, second);
        // }

        // let ahora = ahoraColombia();

        // 3. Buscar los curso_simulacro activos

        let ahora = new Date();
        const cursoSim = await CursoSimulacro.findAll({
            where: {
                [Op.or]: condicionesCurso,
                fecha_cierre_s2: { [Op.gt]: ahora }  //ARREGLAR LO DE UTC
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

        const resultado = cursoSim.map(cs => {
            const sim = cs.simulacro;

            const sesionesConEstado = sim.sesions.map(sesion => {
                const orden = sesion.orden;

                // nombre dinámico: fecha_apertura_s1, fecha_cierre_s1, etc.
                const apertura = cs[`fecha_apertura_s${orden}`];
                const cierre = cs[`fecha_cierre_s${orden}`];

                let habilitada = false;

                if (apertura && cierre) {
                    habilitada = (apertura <= ahora && cierre > ahora);
                }

                return {
                    ...sesion.get({ plain: true }),
                    habilitada,
                    fecha_apertura: apertura,
                    fecha_cierre: cierre
                };
            });

            return {
                ...cs.get({ plain: true }),
                simulacro: {
                    ...sim.get({ plain: true }),
                    sesions: sesionesConEstado
                }
            };
        });

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
                include: [{
                    model: ResultadoArea,
                    include: [{ model: SesionArea, include: [{ model: Area }] }]
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
            include: [{ model: Sesion }]
        });

        const sesiones = simulacro.sesions || [];
        let puntajeMaximoTotal = 0;

        for (const sesion of sesiones) {
            const sesionPreguntas = await SesionPregunta.findAll({
                attributes: ['puntaje_base'],
                include: [{
                    model: SesionArea,
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

        resSim.resultado_sesions.forEach(rs => {
            rs.resultado_areas.forEach(ra => {
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
                include: [{ model: Area }]
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
        resSim.resultado_sesions.forEach(rs => {
            rs.resultado_areas.forEach(ra => {
                const area = ra.sesion_area?.area;
                if (area && resultadosPorArea[area.id_area]) {
                    resultadosPorArea[area.id_area].puntaje_obtenido += Number(ra.puntaje_area || 0);
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
            duracion_sesion_1, 
            duracion_sesion_2,
            preguntas_sesion1,
            preguntas_sesion2
        } = datos;

        // Validaciones básicas
        if (!nombre_simulacro || !duracion_sesion_1 || !duracion_sesion_2) {
            throw new Error("Faltan datos obligatorios: nombre o duraciones");
        }

        if (!preguntas_sesion1 || !preguntas_sesion2) {
            throw new Error("Faltan las preguntas de las sesiones");
        }

        // 1. Crear el simulacro
        const nuevoSimulacro = await Simulacro.create({
            nombre: nombre_simulacro,
            descripcion: datos.descripcion || null,
            activo: true,
            fecha_creacion: new Date()
        }, { transaction: t });

        console.log(`✅ Simulacro creado: ${nuevoSimulacro.id_simulacro} - ${nombre_simulacro}`);

        // 2. Duraciones por sesión
        const duraciones = [duracion_sesion_1, duracion_sesion_2];

        // 3. Mapeo de preguntas recibidas
        const preguntasPorSesion = [
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
        ];

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
                duracion_segundos: duraciones[i],
                activo: true
            }, { transaction: t });

            console.log(`✅ ${estructuraSesion.nombre} creada: ${nuevaSesion.id_sesion}`);

            let ordenGlobalPregunta = 1; // Orden secuencial en toda la sesión

            // 5. Crear áreas y asignar preguntas
            for (const areaConfig of estructuraSesion.areas) {
                const { id_area, nombre, cantidad } = areaConfig;

                // Crear SesionArea
                const nuevaSesionArea = await SesionArea.create({
                    id_sesion: nuevaSesion.id_sesion,
                    id_area: id_area,
                    nombre: nombre
                }, { transaction: t });

                // Obtener preguntas para esta área
                const preguntasArea = preguntasSesion[id_area] || [];

                // Validar cantidad de preguntas
                if (preguntasArea.length !== cantidad) {
                    throw new Error(
                        `${estructuraSesion.nombre} - ${nombre}: ` +
                        `Se esperaban ${cantidad} preguntas, pero se recibieron ${preguntasArea.length}`
                    );
                }

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
                        puntaje_base: 1.0 // Puntaje estándar ICFES
                    }, { transaction: t });

                    ordenGlobalPregunta++;
                }

                console.log(`  ✅ ${nombre}: ${preguntasArea.length} preguntas asignadas`);
            }
        }

        await t.commit();

        console.log(`🎉 Simulacro "${nombre_simulacro}" creado exitosamente`);

        return {
            status: "ok",
            mensaje: "Simulacro creado exitosamente",
            simulacro: {
                id_simulacro: nuevoSimulacro.id_simulacro,
                nombre: nombre_simulacro,
                sesion1_preguntas: 120,
                sesion2_preguntas: 134,
                total_preguntas: 254
            }
        };

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


export default { obtenerUltimoSimulacro,
     obtenerSimulacrosDisponibles, obtenerResultadosSimulacro ,
      crearSimulacro, validarEstructuraPreguntas};
