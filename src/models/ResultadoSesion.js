import { DataTypes } from "sequelize";
import db from "../db/db.js";
import Sesion from "./Sesion.js";
import ResultadoSimulacro from "./ResultadoSimulacro.js";

const ResultadoSesion = db.define("resultado_sesion", {
    id_resultado_sesion: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    puntaje_sesion: { type: DataTypes.INTEGER, allowNull: false },
    tiempo_usado_segundos: { type: DataTypes.INTEGER, allowNull: false },
    fecha_inicio: { type: DataTypes.DATE, allowNull: false },
    fecha_fin: { type: DataTypes.DATE, allowNull: false },
}, {
    tableName: "resultado_sesion",
    timestamps: false,
    freezeTableName: true
});

Sesion.hasMany(ResultadoSesion, { foreignKey: "id_sesion" });
ResultadoSesion.belongsTo(Sesion, { foreignKey: "id_sesion" });

ResultadoSimulacro.hasMany(ResultadoSesion, { foreignKey: "id_resultado_simulacro" });
ResultadoSesion.belongsTo(ResultadoSimulacro, { foreignKey: "id_resultado_simulacro" });

export default ResultadoSesion;
