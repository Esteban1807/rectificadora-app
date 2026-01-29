import React, { useState } from 'react';
import './HistorialList.css';

function HistorialList({ historial }) {
  const [filter, setFilter] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistorial = historial.filter(motor => {
    const matchesFilter = filter === 'todos' || 
      (filter === 'activos' && !motor.fechaSalida) ||
      (filter === 'salidos' && motor.fechaSalida);
    
    const matchesSearch = 
      motor.numeroSerie.toLowerCase().includes(searchTerm.toLowerCase()) ||
      motor.cliente.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="historial-list">
      <div className="historial-header">
        <h2>Historial de Motores</h2>
      </div>

      <div className="historial-filters">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Buscar por número de serie o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-buttons">
          <button
            className={filter === 'todos' ? 'active' : ''}
            onClick={() => setFilter('todos')}
          >
            Todos
          </button>
          <button
            className={filter === 'activos' ? 'active' : ''}
            onClick={() => setFilter('activos')}
          >
            En Taller
          </button>
          <button
            className={filter === 'salidos' ? 'active' : ''}
            onClick={() => setFilter('salidos')}
          >
            Entregados
          </button>
        </div>
      </div>

      {filteredHistorial.length === 0 ? (
        <div className="empty-state">
          <p>No hay registros que coincidan con los filtros</p>
        </div>
      ) : (
        <div className="historial-table-container">
          <table className="historial-table">
            <thead>
              <tr>
                <th>Número de Serie</th>
                <th>Cliente</th>
                <th>Fecha Entrada</th>
                <th>Fecha Salida</th>
                <th>Estado</th>
                <th>Días en Taller</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistorial.map(motor => {
                const fechaEntrada = new Date(motor.fechaEntrada);
                const fechaSalida = motor.fechaSalida ? new Date(motor.fechaSalida) : new Date();
                const diasEnTaller = Math.floor((fechaSalida - fechaEntrada) / (1000 * 60 * 60 * 24));

                return (
                  <tr key={motor.id} className={motor.fechaSalida ? 'salido' : 'activo'}>
                    <td><strong>{motor.numeroSerie}</strong></td>
                    <td>{motor.cliente}</td>
                    <td>{fechaEntrada.toLocaleDateString('es-ES')}</td>
                    <td>
                      {motor.fechaSalida 
                        ? new Date(motor.fechaSalida).toLocaleDateString('es-ES')
                        : <span className="badge-en-taller">En taller</span>
                      }
                    </td>
                    <td>
                      <span className={`status-badge status-${motor.estado.toLowerCase().replace(' ', '-')}`}>
                        {motor.estado}
                      </span>
                    </td>
                    <td>{diasEnTaller} días</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default HistorialList;
