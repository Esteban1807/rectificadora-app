import React, { useState, useEffect } from 'react';
import './OrdenTrabajo.css';
import { getMotorById, addTrabajo, updateTrabajo, deleteTrabajo, updateMotor } from '../services/api';

function OrdenTrabajo({ motorId, onBack }) {
  const [motor, setMotor] = useState(null);
  const [trabajos, setTrabajos] = useState([]);
  const [newTrabajo, setNewTrabajo] = useState({
    descripcion: '',
    parteAsociada: '',
    precio: null,
    mecanico: ''
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [incluirIva, setIncluirIva] = useState(false);
  const [ivaConfirmado, setIvaConfirmado] = useState(false);

  useEffect(() => {
    loadMotor();
  }, [motorId]);

  const loadMotor = async () => {
    try {
      const data = await getMotorById(motorId);
      setMotor(data);
      setTrabajos(data.trabajos || []);
      setIncluirIva(data.incluirIva || false);
    } catch (error) {
      console.error('Error al cargar motor:', error);
      alert('Error al cargar la información del motor');
    }
  };

  const handleAddTrabajo = async () => {
    if (!newTrabajo.descripcion.trim()) {
      alert('Por favor ingrese una descripción para el trabajo');
      return;
    }

    if (newTrabajo.precio === null || newTrabajo.precio === '') {
      alert('Por favor ingrese un precio para el trabajo');
      return;
    }

    try {
      const trabajo = await addTrabajo(motorId, {
        ...newTrabajo,
        precio: parseFloat(newTrabajo.precio) || 0
      });
      setTrabajos([...trabajos, trabajo]);
      setNewTrabajo({ descripcion: '', parteAsociada: '', precio: null, mecanico: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al agregar el trabajo');
    }
  };

  const handleUpdateTrabajo = async (id, estado) => {
    try {
      const trabajo = trabajos.find(t => t.id === id);
      const updated = await updateTrabajo(id, { ...trabajo, estado });
      setTrabajos(trabajos.map(t => t.id === id ? updated : t));
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar el trabajo');
    }
  };

  const handleDeleteTrabajo = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este trabajo?')) return;

    try {
      await deleteTrabajo(id);
      setTrabajos(trabajos.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar el trabajo');
    }
  };

  const handleConfirmarIva = async () => {
    try {
      // Actualizar el motor en el backend
      await updateMotor(motorId, { 
        ...motor, 
        incluirIva: incluirIva,
        numeroMotor: motor.numeroMotor,
        cliente: motor.cliente,
        celular: motor.celular,
        marca: motor.marca,
        vehiculo: motor.vehiculo,
        descripcion: motor.descripcion || '',
        estado: motor.estado || 'En proceso'
      });
      setIvaConfirmado(true);
      await loadMotor(); // Recargar para obtener los datos actualizados
      alert('IVA confirmado exitosamente');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al confirmar IVA');
    }
  };

  const handleToggleIva = () => {
    setIncluirIva(!incluirIva);
    setIvaConfirmado(false);
  };

  const subtotal = trabajos.reduce((sum, t) => sum + parseFloat(t.precio || 0), 0);
  const iva = incluirIva && ivaConfirmado ? subtotal * 0.19 : 0;
  const total = subtotal + iva;

  if (!motor) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <div className="orden-trabajo">
      <div className="orden-header">
        <button className="btn-back" onClick={onBack}>← Volver</button>
        <h2>Orden de Trabajo</h2>
      </div>

      <div className="motor-info-card">
        <div className="motor-main-info">
          <h3>{motor.vehiculo || motor.marca || 'Motor'}</h3>
          <p><strong>Motor:</strong> {motor.numeroMotor || motor.numeroSerie}</p>
          <p><strong>Cliente:</strong> {motor.cliente}</p>
        </div>
        {motor.fotoMotor && (
          <div className="motor-photo-container" style={{ marginTop: '20px', textAlign: 'center' }}>
            <h4 style={{ marginBottom: '10px' }}>Foto del Motor</h4>
            <img 
              src={motor.fotoMotor} 
              alt="Foto del motor" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '400px', 
                border: '2px solid #ddd', 
                borderRadius: '8px',
                padding: '5px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }} 
            />
          </div>
        )}
      </div>

      <div className="trabajos-section">
        <div className="section-header">
          <h3>Trabajos a Realizar</h3>
          <button className="btn-add-trabajo" onClick={() => setShowAddForm(!showAddForm)}>
            + Añadir Trabajo
          </button>
        </div>

        {showAddForm && (
          <div className="add-trabajo-form">
            <div className="form-row">
              <div className="form-group">
                <label>Descripción del Trabajo *</label>
                <input
                  type="text"
                  value={newTrabajo.descripcion}
                  onChange={(e) => setNewTrabajo({ ...newTrabajo, descripcion: e.target.value })}
                  placeholder="Ej: Cambio de filtro de aceite"
                />
              </div>
              <div className="form-group">
                <label>Parte Asociada</label>
                <input
                  type="text"
                  value={newTrabajo.parteAsociada}
                  onChange={(e) => setNewTrabajo({ ...newTrabajo, parteAsociada: e.target.value })}
                  placeholder="Ej: Filtro de aceite"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Precio *</label>
                <input
                  type="number"
                  value={newTrabajo.precio === null ? '' : newTrabajo.precio}
                  onChange={(e) => setNewTrabajo({ 
                    ...newTrabajo, 
                    precio: e.target.value === '' ? null : parseFloat(e.target.value) || null 
                  })}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>Mecánico</label>
                <input
                  type="text"
                  value={newTrabajo.mecanico}
                  onChange={(e) => setNewTrabajo({ ...newTrabajo, mecanico: e.target.value })}
                  placeholder="Nombre del mecánico"
                />
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-cancel" onClick={() => setShowAddForm(false)}>Cancelar</button>
              <button className="btn-save" onClick={handleAddTrabajo}>Guardar</button>
            </div>
          </div>
        )}

        <div className="trabajos-list">
          {trabajos.length === 0 ? (
            <p className="empty-message">No hay trabajos registrados</p>
          ) : (
            trabajos.map(trabajo => (
              <div key={trabajo.id} className={`trabajo-card ${trabajo.estado === 'Finalizado' ? 'finalizado' : 'en-proceso'}`}>
                <div className="trabajo-header">
                  <h4>{trabajo.descripcion}</h4>
                  <span className={`status-badge ${trabajo.estado === 'Finalizado' ? 'finalizado' : 'en-proceso'}`}>
                    {trabajo.estado}
                  </span>
                </div>
                {trabajo.parteAsociada && (
                  <p className="parte-asociada"><strong>Parte:</strong> {trabajo.parteAsociada}</p>
                )}
                <p className="precio">Precio: ${parseFloat(trabajo.precio || 0).toLocaleString()}</p>
                {trabajo.mecanico && (
                  <p className="mecanico"><strong>Mecánico:</strong> {trabajo.mecanico}</p>
                )}
                <div className="trabajo-actions">
                  {trabajo.estado !== 'Finalizado' && (
                    <button
                      className="btn-finalizar"
                      onClick={() => handleUpdateTrabajo(trabajo.id, 'Finalizado')}
                    >
                      Finalizar
                    </button>
                  )}
                  <button
                    className="btn-eliminar"
                    onClick={() => handleDeleteTrabajo(trabajo.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="resumen-section">
        <div className="resumen-card">
          <h3>Resumen</h3>
          <div className="resumen-row">
            <span>Subtotal:</span>
            <span>${subtotal.toLocaleString()}</span>
          </div>
          <div className="iva-section">
            <div className="iva-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={incluirIva}
                  onChange={handleToggleIva}
                  disabled={ivaConfirmado}
                />
                Incluir IVA (19% - Colombia)
              </label>
              {incluirIva && !ivaConfirmado && (
                <button className="btn-confirmar-iva" onClick={handleConfirmarIva}>
                  Confirmar IVA
                </button>
              )}
              {ivaConfirmado && (
                <span className="iva-confirmado">✓ IVA Confirmado</span>
              )}
            </div>
          </div>
          {incluirIva && ivaConfirmado && (
            <div className="resumen-row">
              <span>IVA (19%):</span>
              <span>${iva.toLocaleString()}</span>
            </div>
          )}
          <div className="resumen-row total">
            <span><strong>Total:</strong></span>
            <span><strong>${total.toLocaleString()}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrdenTrabajo;
