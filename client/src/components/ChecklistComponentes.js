import React, { useState, useEffect } from 'react';
import './ChecklistComponentes.css';
import { getChecklistMotor, updateChecklist } from '../services/api';

// Usar solo el color azul principal para todos los elementos
const COLOR_AZUL = '#667eea';
const COLORES = [COLOR_AZUL, COLOR_AZUL, COLOR_AZUL, COLOR_AZUL, COLOR_AZUL, COLOR_AZUL, COLOR_AZUL, COLOR_AZUL, COLOR_AZUL, COLOR_AZUL];

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

function ChecklistComponentes({ motorId, readOnly = false }) {
  const [checklist, setChecklist] = useState({});
  const [observaciones, setObservaciones] = useState({});

  useEffect(() => {
    loadChecklist();
  }, [motorId]);

  const loadChecklist = async () => {
    try {
      const data = await getChecklistMotor(motorId);
      const checklistMap = {};
      const obsMap = {};
      
      data.forEach(item => {
        const key = `${item.seccion}-${item.componente}`;
        checklistMap[key] = item.presente;
        // Guardar observaciones por sección
        if (item.observaciones && (item.seccion === 'varios' || item.seccion === 'bielas')) {
          obsMap[item.seccion] = item.observaciones;
        }
      });
      
      setChecklist(checklistMap);
      setObservaciones(obsMap);
    } catch (error) {
      console.error('Error al cargar checklist:', error);
    }
  };

  const handleToggle = (seccion, componente) => {
    if (readOnly) return;
    const key = `${seccion}-${componente}`;
    setChecklist(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleObservacionesChange = (seccion, value) => {
    if (readOnly) return;
    setObservaciones(prev => ({
      ...prev,
      [seccion]: value
    }));
  };

  const handleSave = async () => {
    if (readOnly) return;
    try {
      const componentes = [];
      
      Object.keys(COMPONENTES_POR_SECCION).forEach(seccion => {
        COMPONENTES_POR_SECCION[seccion].forEach(componente => {
          const key = `${seccion}-${componente}`;
          componentes.push({
            componente,
            seccion,
            presente: checklist[key] || false,
            observaciones: observaciones[key] || null
          });
        });
      });

      await updateChecklist(motorId, componentes);
      alert('Checklist guardado exitosamente');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar el checklist');
    }
  };

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
                  <label className={`checkbox-label ${readOnly ? 'readonly' : ''}`}>
                    <input
                      type="checkbox"
                      checked={checklist[key] || false}
                      onChange={() => handleToggle(seccion, componente)}
                      disabled={readOnly}
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
                  <label className={`checkbox-label ${readOnly ? 'readonly' : ''}`}>
                    <input
                      type="checkbox"
                      checked={checklist[key] || false}
                      onChange={() => handleToggle(seccion, componente)}
                      disabled={readOnly}
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
              readOnly={readOnly}
              disabled={readOnly}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="checklist-componentes">
      <div className="checklist-header">
        <h3>Checklist de Componentes del Motor</h3>
        {!readOnly && (
          <button className="btn-save-checklist" onClick={handleSave}>
            Guardar Checklist
          </button>
        )}
        {readOnly && (
          <span className="readonly-badge">Solo Lectura de los Items ingresados</span>
        )}
      </div>

      <div className="checklist-container">
        {renderSeccion('bloque', 'Bloque', 0)}
        {renderSeccion('cigueñal', 'Cigüeñal', 1)}
        {renderSeccion('culata', 'Culata', 2)}
        {renderSeccion('bielas', 'Bielas', 3)}
        {renderSeccion('arbolLevas', 'Arbol de Levas', 4)}
        {renderSeccion('varios', 'Componentes varios', 5)}
      </div>
    </div>
  );
}

export default ChecklistComponentes;
