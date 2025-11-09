import Area from "../models/Area.js";

async function obtenerAreas() {
    try{
        const areas = await Area.findAll();
        return areas;
    } catch (error) {
        throw new Error("Error al obtener las áreas: " + error.message);
    } 
}

export default { obtenerAreas };