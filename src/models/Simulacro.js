import { DataTypes } from "sequelize";
import db from "../db/db.js";

const Simulacro = db.define("simulacro", {
    id_simulacro: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    fecha_creacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: "simulacro",
    timestamps: false,
    freezeTableName: true
});

export default Simulacro;
