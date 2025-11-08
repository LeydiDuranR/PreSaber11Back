import db from "../db/db.js";
import { DataTypes } from "sequelize";

const TipoDocumento = db.define("tipo_documento", {
    id_tipo_documento: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    descripcion: { type: DataTypes.STRING(100), allowNull: false },
}, {
    timestamps: false,
    freezeTableName: true
});

export default TipoDocumento;