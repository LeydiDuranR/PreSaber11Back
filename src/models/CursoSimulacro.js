import db from "../db/db.js";
import { DataTypes } from "sequelize";
import Simulacro from "./Simulacro.js";

const CursoSimulacro = db.define("curso_simulacro", {
    id_curso_simulacro: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    },
    fecha_apertura_s1: {
        type: DataTypes.DATE,
        allowNull: false
    },
    fecha_cierre_s1: {
        type: DataTypes.DATE,
        allowNull: false
    },
    fecha_apertura_s2: {
        type: DataTypes.DATE,
        allowNull: false
    },
    fecha_cierre_s2: {
        type: DataTypes.DATE,
        allowNull: false
    },
    grado: {
        type: DataTypes.STRING(2),
        allowNull: false
    },
    grupo: {
        type: DataTypes.STRING(2),
        allowNull: false
    },
    cohorte: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
}, {
    TableName: "curso_simulacro",
    timestamps: false,
    freezeTableName: true
});


//Relaciones

Simulacro.hasMany(CursoSimulacro, { foreignKey: "id_simulacro" });
CursoSimulacro.belongsTo(Simulacro, { foreignKey: "id_simulacro" });

export default CursoSimulacro;
