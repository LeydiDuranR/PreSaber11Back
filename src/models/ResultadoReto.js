import db from "../db/db.js";
import { DataTypes } from "sequelize";
import Reto from "./Reto.js";
import Usuario from "./Usuario.js";

const ResultadoReto = db.define('resultado_reto', {

    id_resultado_reto: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    },
    puntaje_total: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
    },
    fecha_realizacion: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    duracion: {
        type: DataTypes.TIME,
        allowNull: false,
    },
}, {
    timestamps: false,
    freezeTableName: true
});

//Relacion con reto

Reto.hasMany(ResultadoReto, {
    foreignKey: "id_reto",
});

ResultadoReto.belongsTo(Reto, {
    foreignKey: "id_reto",
});

//Relacion con usuario (estudiante)
Usuario.hasMany(ResultadoReto, {
    foreignKey: "id_estudiante",
});

ResultadoReto.belongsTo(Usuario, {
    foreignKey: "id_estudiante",
});

export default ResultadoReto;
