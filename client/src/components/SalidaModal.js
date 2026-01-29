import React, { useState } from 'react';
import './SalidaModal.css';

function SalidaModal({ motor, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    fechaSalida: new Date().toISOString().split('T')[0],
    observaciones: ''
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
    onSubmit(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Registrar Salida de Motor</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="motor-info-summary">
            <p><strong>Número de Serie:</strong> {motor.numeroSerie}</p>
            <p><strong>Cliente:</strong> {motor.cliente}</p>
            <p><strong>Fecha de Entrada:</strong> {new Date(motor.fechaEntrada).toLocaleDateString('es-ES')}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="fechaSalida">Fecha de Salida *</label>
              <input
                type="date"
                id="fechaSalida"
                name="fechaSalida"
                value={formData.fechaSalida}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="observaciones">Observaciones</label>
              <textarea
                id="observaciones"
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                rows="4"
                placeholder="Notas sobre la salida del motor, trabajo realizado, etc."
              />
            </div>

            <div className="modal-footer">
              <button type="button" className="cancel-btn" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="submit-btn">
                Registrar Salida
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SalidaModal;
