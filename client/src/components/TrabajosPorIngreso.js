import React, { useState, useEffect, useRef } from 'react';
import './TrabajosPorIngreso.css';
import { getMotorById, addTrabajo, updateTrabajo } from '../services/api';
import ChecklistComponentes from './ChecklistComponentes';
import ModalPDF from './ModalPDF';

function TrabajosPorIngreso({ motorId, onBack }) {
  const [motor, setMotor] = useState(null);
  const [activeTab, setActiveTab] = useState('trabajos');
  const [newTrabajo, setNewTrabajo] = useState({
    descripcion: '',
    parteAsociada: '',
    precio: null,
    mecanico: ''
  });
  // Mostrar el formulario de añadir trabajo inmediatamente para poder escribir
  const [showAddForm, setShowAddForm] = useState(true);
  const [pendingTrabajos, setPendingTrabajos] = useState([]);
  const descRef = useRef(null);
  const [loadError, setLoadError] = useState(false);
  const retryRef = useRef({ count: 0, timer: null, mounted: true });
  const [showModalPDF, setShowModalPDF] = useState(false);

  useEffect(() => {
    loadMotor();
    return () => {
      retryRef.current.mounted = false;
      if (retryRef.current.timer) clearTimeout(retryRef.current.timer);
    };
  }, [motorId]);

  useEffect(() => {
    if (showAddForm && descRef.current) {
      try { descRef.current.focus(); } catch(e){}
    }
  }, [showAddForm]);

  const loadMotor = async () => {
    if (!retryRef.current.mounted) return;
    try {
      const data = await getMotorById(motorId);
      setMotor(data);
      setLoadError(false);
      retryRef.current.count = 0;
      // Si existen trabajos pendientes, intentar enviarlos al servidor
      if (pendingTrabajos && pendingTrabajos.length > 0) {
        flushPendingTrabajos();
      }
    } catch (error) {
      console.warn('Error al cargar motor (se intentará de nuevo):', error.message || error);
      // retry with backoff
      retryRef.current.count += 1;
      const maxRetries = 12; // hasta ~1 minute con backoff
      if (retryRef.current.count <= maxRetries && retryRef.current.mounted) {
        const delay = Math.min(5000, 500 * Math.pow(1.5, retryRef.current.count));
        if (retryRef.current.timer) clearTimeout(retryRef.current.timer);
        retryRef.current.timer = setTimeout(() => {
          loadMotor();
        }, delay);
      } else {
        setLoadError(true);
      }
    }
  };

  const flushPendingTrabajos = async () => {
    const pendientes = [...pendingTrabajos];
    for (const t of pendientes) {
      try {
        // ensure motor exists before flushing
        if (!motor) await loadMotor();
        await addTrabajo(motorId, t);
        setPendingTrabajos(prev => prev.filter(p => p !== t));
        await loadMotor();
      } catch (err) {
        console.warn('Reintento falló, se volverá a intentar más tarde', err);
      }
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

    const trabajoToAdd = {
      descripcion: newTrabajo.descripcion,
      parteAsociada: newTrabajo.parteAsociada,
      precio: parseFloat(newTrabajo.precio) || 0,
      mecanico: newTrabajo.mecanico || null
    };

    // Optimistic UI: añadir localmente con id temporal
    const tempId = `tmp-${Date.now()}`;
    const optimistic = { id: tempId, ...trabajoToAdd, estado: 'En proceso', createdAt: new Date().toISOString() };
    setMotor(prev => ({ ...(prev || {}), trabajos: [optimistic].concat((prev && prev.trabajos) || []) }));
    setNewTrabajo({ descripcion: '', parteAsociada: '', precio: null, mecanico: '' });
    setShowAddForm(false);

    try {
      const added = await addTrabajo(motorId, trabajoToAdd);
      // Reemplazar optimista recargando desde servidor
      await loadMotor();
    } catch (error) {
      console.error('Error enviando trabajo al servidor, se guardará localmente y se reintentará:', error);
      setPendingTrabajos(prev => prev.concat([trabajoToAdd]));
      alert('No se pudo guardar en servidor. El trabajo se guardó localmente y se reintentará automáticamente.');
    }
  };

  const handleFinalizarTrabajo = async (id) => {
    try {
      const trabajo = motor.trabajos.find(t => t.id === id);
      await updateTrabajo(id, { ...trabajo, estado: 'Finalizado' });
      await loadMotor();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al finalizar el trabajo');
    }
  };

  // Permitir renderizar la UI antes de que el motor sea cargado para escribir rápidamente
  const currentMotor = motor || { trabajos: [], items: [], incluirIva: false, cliente: '', vehiculo: '', numeroMotor: '', numeroSerie: '', mecanico: '', fotoMotor: null };

  const subtotalTrabajos = (currentMotor.trabajos || []).reduce((sum, t) => sum + parseFloat(t.precio || 0), 0);
  const subtotalItems = (currentMotor.items || []).reduce((sum, i) => sum + (i.cantidad * i.valor), 0);
  const subtotal = subtotalTrabajos + subtotalItems;
  const iva = currentMotor.incluirIva ? subtotal * 0.19 : 0;
  const total = subtotal + iva;

  return (
    <div className="trabajos-por-ingreso">
      <div className="page-header">
        <button className="btn-back" onClick={onBack}>←</button>
        <h2>Trabajos por Ingreso</h2>
        <div className="header-menu"></div>
      </div>

      <div className="motor-info-card">
        <div className="motor-main">
          <div>
            <h3>{currentMotor.vehiculo || currentMotor.marca || 'Motor'}</h3>
            <p><strong>Motor:</strong> {currentMotor.numeroMotor || currentMotor.numeroSerie}</p>
            <p><strong>Confirmado por:</strong> Mecánico {currentMotor.mecanico || 'N/A'}</p>
          </div>
          <div className="motor-client">
            {currentMotor.fotoMotor ? (
              <img
                src={currentMotor.fotoMotor}
                alt="Foto del motor"
                style={{
                  width: '120px',
                  height: '120px',
                  objectFit: 'cover',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  padding: '5px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              />
            ) : (
              <div className="motor-image-placeholder">🚗</div>
            )}
            <p><strong>Cliente:</strong> {currentMotor.cliente}</p>
          </div>
        </div>
      </div>

      <div className="tabs-container">
        <div className="tabs">
          <button
            className={activeTab === 'trabajos' ? 'active' : ''}
            onClick={() => setActiveTab('trabajos')}
          >
            Trabajos
          </button>

          <button
            className={activeTab === 'checklist' ? 'active' : ''}
            onClick={() => setActiveTab('checklist')}
          >
            Checklist
          </button>
        </div>
        <button className="btn-pdf" onClick={() => setShowModalPDF(true)}>
          📄 Generar PDF y Enviar
        </button>
      </div>

      {activeTab === 'trabajos' && (
        <div className="trabajos-section">
          <div className="section-header">
            <h3>Trabajos Realizados</h3>
            <button className="btn-add-trabajo" onClick={() => setShowAddForm(!showAddForm)}>
              + Añadir Trabajo
            </button>
          </div>

          {showAddForm && (
            <div className="add-trabajo-form">
              <div className="form-group">
                <label>Descripción del Trabajo *</label>
                <input
                  type="text"
                  ref={descRef}
                  value={newTrabajo.descripcion}
                  onChange={(e) => setNewTrabajo({ ...newTrabajo, descripcion: e.target.value })}
                  placeholder="Ej: Cambio de filtro de aceite"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Parte Asociada</label>
                  <input
                    type="text"
                    value={newTrabajo.parteAsociada}
                    onChange={(e) => setNewTrabajo({ ...newTrabajo, parteAsociada: e.target.value })}
                    placeholder="Ej: Filtro de aceite"
                  />
                </div>
                <div className="form-group">
                  <label>Precio *</label>
                  <input
                    type="number"
                    value={newTrabajo.precio === null ? '' : newTrabajo.precio}
                    onChange={(e) => setNewTrabajo({
                      ...newTrabajo,
                      precio: e.target.value === '' ? null : parseFloat(e.target.value) || null
                    })}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
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

          {currentMotor.trabajos && currentMotor.trabajos.length > 0 ? (
            <div className="trabajos-list">
              {currentMotor.trabajos.map(trabajo => (
                <div key={trabajo.id} className={`trabajo-card ${trabajo.estado === 'Finalizado' ? 'finalizado' : 'en-proceso'}`}>
                  <div className="trabajo-content">
                    <div className="trabajo-main">
                      <h4>{trabajo.descripcion}</h4>
                      {trabajo.parteAsociada && (
                        <p><strong>Parte:</strong> {trabajo.parteAsociada}</p>
                      )}
                      <p className="precio">Precio: ${parseFloat(trabajo.precio || 0).toLocaleString()}</p>
                      {trabajo.mecanico && (
                        <p><strong>Mecánico:</strong> {trabajo.mecanico}</p>
                      )}
                    </div>
                    <div className="trabajo-status">
                      <span className={`status-badge ${trabajo.estado === 'Finalizado' ? 'finalizado' : 'en-proceso'}`}>
                        {trabajo.estado}
                      </span>
                    </div>
                  </div>
                  <div className="trabajo-actions">
                    {trabajo.estado !== 'Finalizado' && (
                      <button
                        className="btn-finalizar"
                        onClick={() => handleFinalizarTrabajo(trabajo.id)}
                      >
                        Finalizar
                      </button>
                    )}
                    <button className="btn-ver-detalles">Ver Detalles</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-message">No hay trabajos registrados</p>
          )}

          <div className="resumen-total">
            <div className="resumen-row">
              <span>Subtotal Trabajos:</span>
              <span>${subtotalTrabajos.toLocaleString()}</span>
            </div>
            <div className="resumen-row">
              <span>Subtotal Partes:</span>
              <span>${subtotalItems.toLocaleString()}</span>
            </div>
            <div className="resumen-row">
              <span>Subtotal:</span>
              <span>${subtotal.toLocaleString()}</span>
            </div>
            {currentMotor.incluirIva && (
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
      )}

      {activeTab === 'checklist' && (
        <ChecklistComponentes motorId={motorId} readOnly={true} />
      )}

      {showModalPDF && (
        <ModalPDF motor={currentMotor} onClose={() => setShowModalPDF(false)} />
      )}
    </div>
  );
}

export default TrabajosPorIngreso;

