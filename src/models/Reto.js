import { DataTypes } from "sequelize";
import db from "../db/db.js";
import Tema from "./Tema.js";

const Reto = db.define('reto', {
    id_reto: {
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
        allowNull: false
    },
    nivel_dificultad: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    duracion: {
        type: DataTypes.TIME,
        allowNull: false
    },
    fecha_creacion: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    cantidad_preguntas: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    timestamps: false,
    freezeTableName: true
});


Tema.hasMany(Reto, {
    foreignKey: "id_tema",
});
Reto.belongsTo(Tema, {
    foreignKey: "id_tema",
});

export default Reto;
