import { DataTypes } from "sequelize";
import db from "../db/db.js";
import Simulacro from "./Simulacro.js";

const Sesion = db.define("sesion", {
    id_sesion: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    duracion_segundos: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    orden: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: "sesion",
    timestamps: false,
    freezeTableName: true
});

// Relaciones
Simulacro.hasMany(Sesion, { foreignKey: "id_simulacro"});
Sesion.belongsTo(Simulacro, { foreignKey: "id_simulacro"});

export default Sesion;
