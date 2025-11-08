import db from "../db/db.js";
import { DataTypes } from "sequelize";

const Institucion = db.define("institucion", {
    id_institucion: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    nombre: { type: DataTypes.STRING(150), allowNull: false },
    departamento: { type: DataTypes.STRING(150), allowNull: false },
    municipio: { type: DataTypes.STRING(150), allowNull: false },
    direccion: { type: DataTypes.STRING(150), allowNull: false },
    correo: { type: DataTypes.STRING(100), unique:true, allowNull: false },
    telefono: { type: DataTypes.STRING(21), unique:true, allowNull: false }
}, {
    timestamps: false,
    freezeTableName: true
});

export default Institucion;