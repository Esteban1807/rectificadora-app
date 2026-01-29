import React, { useState, useEffect } from 'react';
import './ChecklistIngreso.css';
import { useNavigate } from 'react-router-dom';
import { addMotor, updateChecklist } from '../services/api';

const COMPONENTES_POR_SECCION = {
  bloque: [
    'Bloque', 'Tapa de Bancada', 'Bancada', 'Guías de Empaque', 'Tapón del Eje de Levas',
    'Trompo de Lubricación', 'Soportes', 'Funda Varilla de Aceite', 'Racores', 'Espárragos',
    'Plaqueta', 'Guías y Tubos de Lubricación parte Frontal', 'Pasta Bomba de Gasolina',
    'Camisas Flotantes', 'Roceadores', 'Deflectores', 'Sensores', 'Tapas Laterales',
    'Tornillos', 'Base filtro de Aceite', 'Base piñon loco / Arandela'
  ],
  cigueñal: [
    'Cigüeñal', 'Piñon', 'Cuñas', 'Pesas', 'Tornillos', 'Arandelas', 'Tuercas', 'Guías de Volante'
  ],
  culata: [
    'Culata', 'Armada', 'Desarmada', 'Válvulas', 'Resortes', 'Porta Cuñas', 'Cuñas',
    'Arandelas de resorte', 'Bloque', 'Flautas', 'Balancines', 'Separadores'
  ],
  bielas: [
    'Bielas', 'Pistones', 'Tapas', 'Pasadores', 'Tornillo', 'Pinas', 'Tuercas'
  ],
  arbolLevas: [
    'Arbol de Levas', 'Piñon', 'Cuña', 'Tornillos', 'Arandela', 'Tuercas', 'Arandela Axial'
  ],
  varios: [
    'Collarín trasero', 'baseenfriador aceite', 'Tapa repartición', 'Care vaca', 'Impulsadores', 'Lata espejo',
    'Codos', 'Poma', 'Latas', 'Base filtro', 'Bomba agua',
    'Filtro aceite', 'Tapa reparación con bomba aceite', 'Teléfono', 'Base termostato', 'Lata lateral', 'Ventilador', 'Tubos',
    'Tortuga', 'Compensador', 'Casueletas', 'Soporte aluminio', 'Piñones',
    'Mangueras'
  ]
};

// Usar solo el color azul principal para todos los elementos
const COLOR_AZUL = '#667eea';
const COLORES = [COLOR_AZUL, COLOR_AZUL, COLOR_AZUL, COLOR_AZUL, COLOR_AZUL, COLOR_AZUL, COLOR_AZUL, COLOR_AZUL, COLOR_AZUL, COLOR_AZUL];

function ChecklistIngreso() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [checklist, setChecklist] = useState({});
  const [observaciones, setObservaciones] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Recuperar datos del formulario desde localStorage
    const motorTemp = localStorage.getItem('motorTemp');
    if (!motorTemp) {
      navigate('/ingreso/nuevo');
      return;
    }
    setFormData(JSON.parse(motorTemp));
  }, [navigate]);

  const handleToggle = (seccion, componente) => {
    const key = `${seccion}-${componente}`;
    setChecklist(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleObservacionesChange = (seccion, value) => {
    setObservaciones(prev => ({
      ...prev,
      [seccion]: value
    }));
  };

  const handleGuardar = async () => {
    if (!formData) return;

    setLoading(true);
    try {
      
      // Crear el motor
      const motor = await addMotor({
        cliente: formData.cliente,
        celular: formData.celular,
        marca: formData.marca,
        vehiculo: formData.vehiculo,
        fechaEntrada: formData.fechaEntrada,
        estado: 'En proceso',
        mecanicoNombre: formData.mecanicoNombre,
        mecanicoTelefono: formData.mecanicoTelefono,
        fotoMotor: formData.fotoMotor || null
      });
      const id = motor.lastID; // ID autoincremental de la BD
      const numeroSerie = motor.lastNumeroSerie; // Usar el ID como número de serie

      // Actualizar el motor con el número de serie
      await addMotor({
        id,
        numeroSerie,
        cliente: formData.cliente,
        celular: formData.celular,
        marca: formData.marca,
        vehiculo: formData.vehiculo,
        fechaEntrada: formData.fechaEntrada,
        estado: 'En proceso',
        mecanicoNombre: formData.mecanicoNombre,
        mecanicoTelefono: formData.mecanicoTelefono,
        fotoMotor: formData.fotoMotor || null
      });


      // Guardar checklist
      const componentes = [];
      Object.keys(COMPONENTES_POR_SECCION).forEach(seccion => {
        COMPONENTES_POR_SECCION[seccion].forEach(componente => {
          const key = `${seccion}-${componente}`;
          componentes.push({
            componente,
            seccion,
            presente: checklist[key] || false,
            observaciones: observaciones[seccion] || null
          });
        });
      });

      await updateChecklist(motor.id, componentes);

      // Limpiar localStorage
      localStorage.removeItem('motorTemp');

      alert('Motor registrado exitosamente');
      navigate('/motor/' + motor.id + '/orden');
    } catch (error) {
      console.error('Error:', error);
      alert(error.response?.data?.error || 'Error al registrar el motor');
    } finally {
      setLoading(false);
    }
  };

  const handleVolver = () => {
    navigate('/ingreso/nuevo');
  };

  if (!formData) {
    return <div className="loading">Cargando...</div>;
  }

  const renderSeccion = (seccion, titulo, colorIndex) => {
    const componentes = COMPONENTES_POR_SECCION[seccion];
    const mitad = Math.ceil(componentes.length / 2);
    const columna1 = componentes.slice(0, mitad);
    const columna2 = componentes.slice(mitad);
    const color = COLORES[colorIndex % COLORES.length];

    return (
      <div key={seccion} className="checklist-seccion" style={{ borderColor: color }}>
        <h3 className="seccion-titulo" style={{ color: color }}>{titulo}</h3>
        <div className="seccion-content">
          <div className="seccion-columna">
            {columna1.map((componente, idx) => {
              const key = `${seccion}-${componente}`;
              const itemColor = COLORES[(colorIndex + idx) % COLORES.length];
              return (
                <div key={componente} className="checklist-item">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={checklist[key] || false}
                      onChange={() => handleToggle(seccion, componente)}
                      style={{ accentColor: itemColor }}
                      className="checkbox-circular"
                    />
                    <span className="checkmark" style={{ borderColor: itemColor }}></span>
                    <span className="componente-text">{componente}</span>
                  </label>
                </div>
              );
            })}
          </div>
          <div className="seccion-columna">
            {columna2.map((componente, idx) => {
              const key = `${seccion}-${componente}`;
              const itemColor = COLORES[(colorIndex + mitad + idx) % COLORES.length];
              return (
                <div key={componente} className="checklist-item">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={checklist[key] || false}
                      onChange={() => handleToggle(seccion, componente)}
                      style={{ accentColor: itemColor }}
                      className="checkbox-circular"
                    />
                    <span className="checkmark" style={{ borderColor: itemColor }}></span>
                    <span className="componente-text">{componente}</span>
                  </label>
                </div>
              );
            })}
          </div>
        </div>
        {(seccion === 'varios' || seccion === 'bielas') && (
          <div className="observaciones-box">
            <label>Observaciones:</label>
            <textarea
              rows="3"
              placeholder="Ingrese observaciones..."
              value={observaciones[seccion] || ''}
              onChange={(e) => handleObservacionesChange(seccion, e.target.value)}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="checklist-ingreso">
      <div className="checklist-header">
        <button className="btn-back" onClick={handleVolver}>← Volver</button>
        <h2>Checklist de Componentes del Motor</h2>
        <div></div>
      </div>

      <div className="motor-info-summary">
        <p><strong>Cliente:</strong> {formData.cliente}</p>
        <p><strong>Vehículo:</strong> {formData.marca} {formData.vehiculo}</p>
        <p><strong>Número de Motor:</strong> {formData.numeroMotor}</p>
      </div>

      <div className="checklist-container">
        {renderSeccion('bloque', 'Bloque', 0)}
        {renderSeccion('cigueñal', 'Cigüeñal', 1)}
        {renderSeccion('culata', 'Culata', 2)}
        {renderSeccion('bielas', 'Bielas', 3)}
        {renderSeccion('arbolLevas', 'Arbol de Levas', 4)}
        {renderSeccion('varios', 'Componentes varios', 5)}
      </div>

      <div className="checklist-actions">
        <button className="btn-cancel" onClick={handleVolver}>
          Cancelar
        </button>
        <button className="btn-guardar" onClick={handleGuardar} disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar Motor y Continuar'}
        </button>
      </div>
    </div>
  );
}

export default ChecklistIngreso;
