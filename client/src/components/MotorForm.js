import React, { useState } from 'react';
import './MotorForm.css';

function MotorForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    numeroSerie: '',
    cliente: '',
    descripcion: '',
    fechaEntrada: new Date().toISOString().split('T')[0],
    estado: 'En proceso'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.numeroSerie.trim() || !formData.cliente.trim()) {
      alert('Por favor complete el número de serie y el cliente');
      return;
    }

    onSubmit(formData);
    
    // Resetear formulario
    setFormData({
      numeroSerie: '',
      cliente: '',
      descripcion: '',
      fechaEntrada: new Date().toISOString().split('T')[0],
      estado: 'En proceso'
    });
  };

  return (
    <div className="motor-form">
      <h2>Registrar Entrada de Motor</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="numeroSerie">Número de Serie *</label>
          <input
            type="text"
            id="numeroSerie"
            name="numeroSerie"
            value={formData.numeroSerie}
            onChange={handleChange}
            required
            placeholder="Ej: MOT-2024-001"
          />
        </div>

        <div className="form-group">
          <label htmlFor="cliente">Cliente *</label>
          <input
            type="text"
            id="cliente"
            name="cliente"
            value={formData.cliente}
            onChange={handleChange}
            required
            placeholder="Nombre del cliente"
          />
        </div>

        <div className="form-group">
          <label htmlFor="descripcion">Descripción</label>
          <textarea
            id="descripcion"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            rows="3"
            placeholder="Descripción del motor, tipo, modelo, etc."
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="fechaEntrada">Fecha de Entrada *</label>
            <input
              type="date"
              id="fechaEntrada"
              name="fechaEntrada"
              value={formData.fechaEntrada}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="estado">Estado</label>
            <select
              id="estado"
              name="estado"
              value={formData.estado}
              onChange={handleChange}
            >
              <option value="En proceso">En proceso</option>
              <option value="En espera">En espera</option>
              <option value="Completado">Completado</option>
              <option value="Pendiente">Pendiente</option>
            </select>
          </div>
        </div>

        <button type="submit" className="submit-btn">
          Registrar Entrada
        </button>
      </form>
    </div>
  );
}

export default MotorForm;
