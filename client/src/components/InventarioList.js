import React, { useState } from 'react';
import './InventarioList.css';
import SalidaModal from './SalidaModal';

function InventarioList({ motores, onSalida, onRefresh }) {
  const [selectedMotor, setSelectedMotor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMotores = motores.filter(motor =>
    motor.numeroSerie.toLowerCase().includes(searchTerm.toLowerCase()) ||
    motor.cliente.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSalidaClick = (motor) => {
    setSelectedMotor(motor);
  };

  const handleSalidaSubmit = (datosSalida) => {
    onSalida(selectedMotor.id, datosSalida);
    setSelectedMotor(null);
  };

  return (
    <div className="inventario-list">
      <div className="inventario-header">
        <h2>Inventario Actual</h2>
        <div className="inventario-stats">
          <span className="stat-badge">Total: {motores.length} motores</span>
        </div>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Buscar por número de serie o cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {filteredMotores.length === 0 ? (
        <div className="empty-state">
          {searchTerm ? (
            <p>No se encontraron motores que coincidan con la búsqueda</p>
          ) : (
            <p>No hay motores en inventario actualmente</p>
          )}
        </div>
      ) : (
        <div className="motores-grid">
          {filteredMotores.map(motor => (
            <div key={motor.id} className="motor-card">
              <div className="motor-card-header">
                <h3>{motor.numeroSerie}</h3>
                <span className={`status-badge status-${motor.estado.toLowerCase().replace(' ', '-')}`}>
                  {motor.estado}
                </span>
              </div>
              
              <div className="motor-card-body">
                <div className="motor-info">
                  <span className="info-label">Cliente:</span>
                  <span className="info-value">{motor.cliente}</span>
                </div>
                
                {motor.descripcion && (
                  <div className="motor-info">
                    <span className="info-label">Descripción:</span>
                    <span className="info-value">{motor.descripcion}</span>
                  </div>
                )}
                
                <div className="motor-info">
                  <span className="info-label">Fecha Entrada:</span>
                  <span className="info-value">
                    {new Date(motor.fechaEntrada).toLocaleDateString('es-ES')}
                  </span>
                </div>

                <div className="motor-info">
                  <span className="info-label">Días en taller:</span>
                  <span className="info-value">
                    {Math.floor((new Date() - new Date(motor.fechaEntrada)) / (1000 * 60 * 60 * 24))} días
                  </span>
                </div>
              </div>

              <div className="motor-card-footer">
                <button
                  className="salida-btn"
                  onClick={() => handleSalidaClick(motor)}
                >
                  Registrar Salida
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedMotor && (
        <SalidaModal
          motor={selectedMotor}
          onClose={() => setSelectedMotor(null)}
          onSubmit={handleSalidaSubmit}
        />
      )}
    </div>
  );
}

export default InventarioList;
