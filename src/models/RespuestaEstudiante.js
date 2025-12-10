import { DataTypes } from "sequelize";
import db from "../db/db.js";
import ResultadoArea from "./ResultadoArea.js";
import SesionPregunta from "./SesionPregunta.js";
import Opcion from "./Opcion.js";

const RespuestaEstudiante = db.define("respuesta_estudiante", {
    id_respuesta_estudiante: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    puntaje_respuesta: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false
    },
    es_correcta: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    }
}, {
    tableName: "respuesta_estudiante",
    timestamps: false,
    freezeTableName: true
});

//relaciones

ResultadoArea.hasMany(RespuestaEstudiante, { foreignKey: "id_resultado_area", as: "respuestas"});
RespuestaEstudiante.belongsTo(ResultadoArea, { foreignKey: "id_resultado_area", as: "resultado_area" });

SesionPregunta.hasMany(RespuestaEstudiante, { foreignKey: "id_sesion_pregunta", as: "respuestas" });
RespuestaEstudiante.belongsTo(SesionPregunta, { foreignKey: "id_sesion_pregunta",as: "sesion_pregunta"  });

Opcion.hasMany(RespuestaEstudiante, { foreignKey: "id_opcion_seleccionada", as: "respuestas" });
RespuestaEstudiante.belongsTo(Opcion, { foreignKey: "id_opcion_seleccionada", as: "opcion" });


export default RespuestaEstudiante;
