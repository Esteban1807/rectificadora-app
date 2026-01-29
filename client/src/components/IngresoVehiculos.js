import React, { useState, useEffect } from 'react';
import './IngresoVehiculos.css';
import jsPDF from 'jspdf';
import { getMotores, finalizarMotor, eliminarMotor, getMotorById } from '../services/api';
import { useNavigate } from 'react-router-dom';

function IngresoVehiculos() {
  const [motores, setMotores] = useState([]);
  const [filtro, setFiltro] = useState('todos'); // todos, activos, finalizados
  const [busqueda, setBusqueda] = useState(''); // Filtro de búsqueda
  const navigate = useNavigate();

  useEffect(() => {
    loadMotores();
  }, []);

  const loadMotores = async () => {
    try {
      const data = await getMotores(true); // Incluir eliminados
      setMotores(data);
    } catch (error) {
      console.error('Error al cargar motores:', error);
    }
  };

  const handleGenerarFactura = async (motorId) => {
    try {
      const motorCompleto = await getMotorById(motorId);
      // Formato ticket de 5cm de ancho (50mm). Altura grande para que quepa todo.
      const doc = new jsPDF({
        unit: 'mm',
        format: [50, 400]
      });

      const hoy = new Date().toISOString().split('T')[0];

      // Encabezado (ancho total 50mm, centro en 25mm)
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Rectificadora Santofimio', 25, 10, { align: 'center' });

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text(`Fecha: ${hoy}`, 5, 16);
      doc.text(`Cliente: ${motorCompleto.cliente || ''}`, 5, 21);
      doc.text(
        `Vehículo: ${(motorCompleto.marca || '')} ${(motorCompleto.vehiculo || '')}`.trim(),
        5,
        26
      );
      doc.text(
        `Motor: ${motorCompleto.numeroMotor || motorCompleto.numeroSerie || ''}`,
        5,
        31
      );

      let y = 38;

      // Tabla de trabajos
      doc.setFont(undefined, 'bold');
      doc.text('Descripción', 5, y);
      doc.text('Precio', 48, y, { align: 'right' });
      y += 6;
      doc.setFont(undefined, 'normal');

      const trabajos = motorCompleto.trabajos || [];
      const subtotalTrabajos = trabajos.reduce(
        (s, t) => s + parseFloat(t.precio || 0),
        0
      );
      const items = motorCompleto.items || [];
      const subtotalItems = items.reduce(
        (s, i) => s + (i.cantidad * i.valor),
        0
      );
      const subtotal = subtotalTrabajos + subtotalItems;
      const iva = motorCompleto.incluirIva ? subtotal * 0.19 : 0;
      const total = subtotal + iva;

      trabajos.forEach((t) => {
        if (y > 380) {
          doc.addPage();
          y = 10;
        }
        doc.text(t.descripcion || '', 5, y);
        doc.text(
          `$${parseFloat(t.precio || 0).toLocaleString()}`,
          48,
          y,
          { align: 'right' }
        );
        y += 6;
      });

      // Totales
      y += 8;
      doc.setFont(undefined, 'bold');
      doc.text('Subtotal:', 5, y);
      doc.text(`$${subtotal.toLocaleString()}`, 48, y, { align: 'right' });
      y += 5;

      if (motorCompleto.incluirIva) {
        doc.setFont(undefined, 'normal');
        doc.text('IVA (19%):', 5, y);
        doc.text(`$${iva.toLocaleString()}`, 48, y, { align: 'right' });
        y += 5;
      }

      doc.setFont(undefined, 'bold');
      doc.text('TOTAL:', 5, y);
      doc.text(`$${total.toLocaleString()}`, 48, y, { align: 'right' });

      doc.save(`Factura_Motor_${motorCompleto.numeroMotor || motorCompleto.numeroSerie}.pdf`);
    } catch (error) {
      console.error('Error al generar factura:', error);
      alert('Error al generar la factura');
    }
  };

  const handleFinalizar = async (id) => {
    if (!window.confirm('¿Está seguro de finalizar este trabajo?')) return;

    try {
      await finalizarMotor(id);
      await loadMotores();
      alert('Trabajo finalizado exitosamente');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al finalizar el trabajo');
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este motor? Esta acción no se puede deshacer.')) return;

    try {
      await eliminarMotor(id);
      await loadMotores();
      alert('Motor eliminado exitosamente');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar el motor');
    }
  };

  const getEstadoColor = (estado) => {
    const estados = {
      'En proceso': '#0d6efd',
      'En espera': '#ffc107',
      'Finalizado': '#198754',
      'Pendiente': '#dc3545'
    };
    return estados[estado] || '#6c757d';
  };

  const motoresFiltrados = motores.filter(motor => {
    // Filtro por estado
    if (filtro === 'activos' && motor.estado === 'Finalizado') return false;
    if (filtro === 'finalizados' && motor.estado !== 'Finalizado') return false;
    
    // Filtro de búsqueda
    if (busqueda.trim()) {
      const busquedaLower = busqueda.toLowerCase().trim();
      const coincideMecanico = motor.mecanicoNombre?.toLowerCase().includes(busquedaLower);
      const coincideMarca = motor.marca?.toLowerCase().includes(busquedaLower);
      const coincideModelo = motor.vehiculo?.toLowerCase().includes(busquedaLower);
      const coincideNumeroMotor = motor.numeroMotor?.toLowerCase().includes(busquedaLower);
      
      if (!coincideMecanico && !coincideMarca && !coincideModelo && !coincideNumeroMotor) {
        return false;
      }
    }
    
    return true;
  });

  return (
    <div className="ingreso-vehiculos">
      <div className="ingreso-header">
        <h2>Ingreso de Vehículos</h2>
        <div className="header-actions">
          <button className="btn-nuevo-ingreso" onClick={() => navigate('/ingreso/nuevo')}>
            <span className="icon-plus">+</span>
            Nuevo Ingreso
          </button>
        </div>
      </div>

      <div className="vehiculos-taller">
        <div className="taller-header">
          <h3>Vehículos en Taller</h3>
          <div className="header-controls">
            <div className="filtros">
              <button
                className={filtro === 'todos' ? 'active' : ''}
                onClick={() => setFiltro('todos')}
              >
                Todos
              </button>
              <button
                className={filtro === 'activos' ? 'active' : ''}
                onClick={() => setFiltro('activos')}
              >
                Activos
              </button>
              <button
                className={filtro === 'finalizados' ? 'active' : ''}
                onClick={() => setFiltro('finalizados')}
              >
                Finalizados
              </button>
            </div>
            <span className="badge-activos">{motoresFiltrados.length} {filtro}</span>
          </div>
          <div className="busqueda-container">
            <input
              type="text"
              className="input-busqueda"
              placeholder="Buscar por mecánico, marca, modelo o número de motor..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        {motoresFiltrados.length === 0 ? (
          <div className="empty-state">
            <p>No hay vehículos en esta categoría</p>
          </div>
        ) : (
          <div className="vehiculos-list">
            {motoresFiltrados.map(motor => (
              <div key={motor.id} className="vehiculo-card">
                <div className="vehiculo-id">#{String(motor.id).padStart(3, '0')} {motor.numeroMotor || motor.numeroSerie}</div>
                <div className="vehiculo-info">
                  <div className="info-row">
                    <span className="label">Mecanico:</span>
                    <span className="value">{motor.mecanicoNombre}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Vehículo:</span>
                    <span className="value">{motor.vehiculo || motor.marca || 'N/A'}</span>
                  </div>
                </div>
                <div className="vehiculo-footer">
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getEstadoColor(motor.estado) + '20', color: getEstadoColor(motor.estado) }}
                  >
                    {motor.estado}
                  </span>
                  <div className="vehiculo-actions">
                    {motor.estado !== 'Finalizado' && (
                      <>
                        <button
                          className="btn-finalizar"
                          onClick={() => handleFinalizar(motor.id)}
                        >
                          Finalizar
                        </button>
                        <button
                          className="btn-eliminar"
                          onClick={() => handleEliminar(motor.id)}
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                    <button
                      className="btn-continuar"
                      onClick={() => navigate(`/motor/${motor.id}`)}
                    >
                      Ver Información
                    </button>
                    <button
                      className="btn-factura"
                      onClick={() => handleGenerarFactura(motor.id)}
                    >
                      Factura PDF
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default IngresoVehiculos;
