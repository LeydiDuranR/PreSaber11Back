import ResultadoSimulacro from "../models/ResultadoSimulacro.js";
import ResultadoSesion from "../models/ResultadoSesion.js";
import Simulacro from "../models/Simulacro.js";
import Sesion from "../models/Sesion.js";
import ResultadoArea from "../models/ResultadoArea.js";
import Participante from "../models/Participante.js";
import CursoSimulacro from "../models/CursoSimulacro.js";
import Curso from "../models/Curso.js";
import { Op } from "sequelize";


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


export default { obtenerUltimoSimulacro, obtenerSimulacrosDisponibles };
