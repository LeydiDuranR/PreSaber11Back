import axios from 'axios';

const API_COLOMBIA_URL = process.env.API_COLOMBIA_URL

// Obtener todos los departamentos
export const obtenerDepartamentos = async () => {
  try {
    const response = await axios.get(`${API_COLOMBIA_URL}/api/v1/Department`);
    
    // Ordenar por nombre
    const departamentos = response.data.sort((a, b) => 
      a.name.localeCompare(b.name)
    );

    return departamentos.map(dept => ({
      id: dept.id,
      nombre: dept.name,
    }));

  } catch (error) {
    console.error('Error al obtener departamentos:', error.message);
    throw new Error('Error al obtener departamentos de Colombia');
  }
};

// Obtener municipios de un departamento
export const obtenerMunicipios = async (idDepartamento) => {
  try {
    if (!idDepartamento) {
      throw new Error('El ID del departamento es requerido');
    }

    const response = await axios.get(
      `${API_COLOMBIA_URL}/api/v1/Department/${idDepartamento}/cities`
    );
    
    // Ordenar por nombre
    const municipios = response.data.sort((a, b) => 
      a.name.localeCompare(b.name)
    );

    return municipios.map(city => ({
      id: city.id,
      nombre: city.name,
    }));

  } catch (error) {
    console.error('Error al obtener municipios:', error.message);
    
    if (error.response && error.response.status === 404) {
      throw new Error('Departamento no encontrado');
    }
    
    throw new Error('Error al obtener municipios');
  }
};