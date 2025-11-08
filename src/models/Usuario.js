import db from "../db/db.js";
import { DataTypes } from "sequelize";
import Rol from "./Rol.js";
import TipoDocumento from "./TipoDocumento.js";

const Usuario = db.define("usuario", {
    documento: { type: DataTypes.STRING(20), primaryKey: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    apellido: { type: DataTypes.STRING(100), allowNull: false },
    correo: { type: DataTypes.STRING(100), unique: true, allowNull: false },
    telefono: { type: DataTypes.STRING(20) },
    fecha_nacimiento: { type: DataTypes.DATEONLY, allowNull: false },
    uid_firebase: { type: DataTypes.STRING(128), unique: true, allowNull: true }
}, {
    timestamps: false,
    freezeTableName: true
});


//relacion con tipo documento
TipoDocumento.hasMany(Usuario, {
    foreignKey: "id_tipo_documento"
}
);
Usuario.belongsTo(TipoDocumento, {
    foreignKey: "id_tipo_documento"
});

//relacion con rol
Rol.hasMany(Usuario, {
    foreignKey: "id_rol"
});
Usuario.belongsTo(Rol, {
    foreignKey: "id_rol"
});

export default Usuario;