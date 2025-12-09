import { DataTypes } from "sequelize";
import db from "../db/db.js";
import Pregunta from "./Pregunta.js";
import SesionArea from "./SesionArea.js";

const SesionPregunta = db.define("sesion_pregunta", {
    id_sesion_pregunta: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    orden_en_sesion: { type: DataTypes.INTEGER, allowNull: false },
    puntaje_base: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
}, {
    tableName: "sesion_pregunta",
    timestamps: false,
    freezeTableName: true
});

//relaciones

SesionArea.hasMany(SesionPregunta, { foreignKey: "id_sesion_area" });
SesionPregunta.belongsTo(SesionArea, { foreignKey: "id_sesion_area" });

Pregunta.hasMany(SesionPregunta, { foreignKey: "id_pregunta" });
SesionPregunta.belongsTo(Pregunta, { foreignKey: "id_pregunta" });

export default SesionPregunta;
