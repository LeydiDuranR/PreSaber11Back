import db from "../db/db.js";
import { DataTypes } from "sequelize";
import Institucion from "./Institucion.js";

const Curso = db.define("curso", {
    grado: {
        type: DataTypes.STRING(2),
        primaryKey: true,
        allowNull: false
    },
    grupo: {
        type: DataTypes.STRING(2),
        primaryKey: true,
        allowNull: false
    },
    cohorte: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    },
    id_institucion: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true, 
        references: {
            model: Institucion,
            key: "id_institucion"
        }
    },
    clave_acceso: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    habilitado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    timestamps: false,
    freezeTableName: true
});

// Relación curso pertenece a una institucion

Institucion.hasMany(Curso, {
    foreignKey: "id_institucion",
});

Curso.belongsTo(Institucion, {
    foreignKey: "id_institucion",
});


export default Curso;
