import axios from 'axios';

// En producción (Electron/Android), usar URL remota
// En desarrollo, usar localhost
const API_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'http://localhost:5000/api' 
    : 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getMotores = async () => {
  const response = await api.get('/motores');
  return response.data;
};

export const addMotor = async (motorData) => {
  const response = await api.post('/motores/entrada', motorData);
  return response.data;
};

export const registrarSalida = async (id, datosSalida) => {
  const response = await api.post(`/motores/salida/${id}`, datosSalida);
  return response.data;
};

export const getHistorial = async () => {
  const response = await api.get('/historial');
  return response.data;
};

export const getMotorById = async (id) => {
  const response = await api.get(`/motores/${id}`);
  return response.data;
};

export const updateMotor = async (id, motorData) => {
  const response = await api.put(`/motores/${id}`, motorData);
  return response.data;
};

export const getItemsMotor = async (motorId) => {
  const response = await api.get(`/motores/${motorId}/items`);
  return response.data;
};

export const addItemMotor = async (motorId, item) => {
  const response = await api.post(`/motores/${motorId}/items`, item);
  return response.data;
};

export const deleteItemMotor = async (itemId) => {
  const response = await api.delete(`/items/${itemId}`);
  return response.data;
};

export const getTrabajosMotor = async (motorId) => {
  const response = await api.get(`/motores/${motorId}/trabajos`);
  return response.data;
};

export const addTrabajo = async (motorId, trabajo) => {
  const response = await api.post(`/motores/${motorId}/trabajos`, trabajo);
  return response.data;
};

export const updateTrabajo = async (id, trabajo) => {
  const response = await api.put(`/trabajos/${id}`, trabajo);
  return response.data;
};

export const deleteTrabajo = async (id) => {
  const response = await api.delete(`/trabajos/${id}`);
  return response.data;
};

export const getChecklistMotor = async (motorId) => {
  const response = await api.get(`/motores/${motorId}/checklist`);
  return response.data;
};

export const updateChecklist = async (motorId, checklist) => {
  const response = await api.post(`/motores/${motorId}/checklist`, checklist);
  return response.data;
};

export const finalizarMotor = async (id) => {
  const response = await api.post(`/motores/${id}/finalizar`);
  return response.data;
};

export const eliminarMotor = async (id) => {
  const response = await api.post(`/motores/${id}/eliminar`);
  return response.data;
};

export const getNextMotorNumber = async () => {
  const response = await api.get('/motores/next-number');
  return response.data;
};



export default api;
