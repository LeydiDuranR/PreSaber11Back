import { DataTypes } from "sequelize";
import db from "../db/db.js";
import Simulacro from "./Simulacro.js";
import Usuario from "./Usuario.js";

const ResultadoSimulacro = db.define("resultado_simulacro", {
    id_resultado_simulacro: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    fecha_fin: { type: DataTypes.DATE, allowNull: true },
    puntaje_total: { type: DataTypes.INTEGER, allowNull: false },
    completado: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
    tableName: "resultado_simulacro",
    timestamps: false,
    freezeTableName: true
});



Usuario.hasMany(ResultadoSimulacro, { foreignKey: "id_estudiante" });
ResultadoSimulacro.belongsTo(Usuario, { foreignKey: "id_estudiante" });

Simulacro.hasMany(ResultadoSimulacro, { foreignKey: "id_simulacro" });
ResultadoSimulacro.belongsTo(Simulacro, { foreignKey: "id_simulacro" });

export default ResultadoSimulacro;
