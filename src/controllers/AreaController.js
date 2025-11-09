import AreaService from "../services/AreaService.js";


async function obtenerAreas(req,res) {
    try{
        const areas =  await AreaService.obtenerAreas();
        res.status(200).json(areas);
    }catch(error){
        res.status(500).json({message: error.message});
    }
}


export default { obtenerAreas };