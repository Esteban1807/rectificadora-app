import React, { useState, useEffect, useRef } from 'react';
import './FormularioIngreso.css';
import { useNavigate } from 'react-router-dom';
import { getNextMotorNumber } from '../services/api';

const MARCAS_VEHICULOS = [
  'Toyota', 'Honda', 'Nissan', 'Mazda', 'Hyundai', 'Kia', 'Chevrolet',
  'Ford', 'Volkswagen', 'Renault', 'Peugeot', 'Citroën', 'BMW', 'Mercedes-Benz',
  'Audi', 'Volvo', 'Mitsubishi', 'Suzuki', 'Fiat', 'Dodge', 'Jeep', 'Subaru',
  'Isuzu', 'Daihatsu', 'Changan', 'Great Wall', 'Chery', 'JAC', 'BYD', 'Otro'
];

function FormularioIngreso() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fechaEntrada: new Date().toISOString().split('T')[0],
    numeroMotor: '',
    celular: '',
    marca: '',
    cliente: '',
    vehiculo: '',
    mecanicoNombre: '',
    mecanicoTelefono: ''
  });
  const [fotoMotor, setFotoMotor] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [mostrarCamara, setMostrarCamara] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Solicitar permisos de cámara al iniciar el formulario para evitar problemas en el portable
  useEffect(() => {
    const solicitarPermisoCamara = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('API de cámara no disponible en este entorno');
        return;
      }
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Cerramos inmediatamente, solo es para que el usuario acepte permisos
        tempStream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.error('Permiso de cámara denegado o no disponible:', error);
      }
    };

    solicitarPermisoCamara();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        alert('Por favor seleccione un archivo de imagen');
        return;
      }
      
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no debe ser mayor a 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoMotor(reader.result); // Base64 string
        setFotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const iniciarCamara = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Cámara trasera si está disponible
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setMostrarCamara(true);
      }
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      alert('No se pudo acceder a la cámara. Por favor, verifique los permisos.');
    }
  };

  const detenerCamara = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setMostrarCamara(false);
  };

  const capturarFoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      
      // Convertir a base64
      const fotoBase64 = canvas.toDataURL('image/jpeg', 0.8);
      setFotoMotor(fotoBase64);
      setFotoPreview(fotoBase64);
      
      // Detener la cámara
      detenerCamara();
    }
  };

  // Limpiar stream al desmontar el componente
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar que todos los campos estén completos
    if (!formData.fechaEntrada || !formData.celular || 
        !formData.marca || !formData.cliente || !formData.vehiculo ||
        !formData.mecanicoNombre || !formData.mecanicoTelefono) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    // Validar que se haya subido una foto
    if (!fotoMotor) {
      alert('Por favor seleccione o capture una foto del motor');
      return;
    }
    
    // Detener la cámara si está activa
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    // Guardar datos del formulario en localStorage para pasarlo al checklist
    localStorage.setItem('motorTemp', JSON.stringify({ ...formData, fotoMotor }));
    
    // Navegar al checklist
    navigate('/ingreso/checklist');
  };

  return (
    <div className="formulario-ingreso">
      <div className="form-header">
        <h2>Nuevo Ingreso de Motor</h2>
        <button className="btn-back" onClick={() => navigate('/')}>← Volver</button>
      </div>

      <form onSubmit={handleSubmit} className="ingreso-form">
        <div className="form-section">
          <div className="form-row">
            <div className="date-inputs">
              <label>Fecha de Ingreso</label>
              <div className="date-fields">
                <input
                  type="date"
                  name="fechaEntrada"
                  value={formData.fechaEntrada}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Celular *</label>
              <input
                type="tel"
                name="celular"
                value={formData.celular}
                onChange={handleChange}
                placeholder="Número"
                required
              />
            </div>

            <div className="form-group">
              <label>Marca *</label>
              <select
                name="marca"
                value={formData.marca}
                onChange={handleChange}
                required
                className="select-marca"
              >
                <option value="">Seleccione una marca</option>
                {MARCAS_VEHICULOS.map(marca => (
                  <option key={marca} value={marca}>{marca}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Cliente *</label>
              <input
                type="text"
                name="cliente"
                value={formData.cliente}
                onChange={handleChange}
                placeholder="Nombre del cliente"
                required
              />
            </div>

            <div className="form-group">
              <label>Vehículo *</label>
              <input
                type="text"
                name="vehiculo"
                value={formData.vehiculo}
                onChange={handleChange}
                placeholder="Ej: Corolla 2018"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Nombre del Mecánico *</label>
              <input
                type="text"
                name="mecanicoNombre"
                value={formData.mecanicoNombre}
                onChange={handleChange}
                placeholder="Nombre completo del mecánico"
                required
              />
            </div>

            <div className="form-group">
              <label>Teléfono del Mecánico *</label>
              <input
                type="tel"
                name="mecanicoTelefono"
                value={formData.mecanicoTelefono}
                onChange={handleChange}
                placeholder="3001234567"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Foto del Motor *</label>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <label style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'inline-block',
                transition: 'transform 0.2s ease'
              }}>
                📁 Cargar desde archivo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFotoChange}
                  style={{ display: 'none' }}
                />
              </label>
              <button
                type="button"
                onClick={mostrarCamara ? detenerCamara : iniciarCamara}
                style={{
                  background: mostrarCamara ? '#dc3545' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'transform 0.2s ease'
                }}
              >
                {mostrarCamara ? '📷 Detener cámara' : '📷 Tomar foto'}
              </button>
            </div>
            
            {mostrarCamara && (
              <div style={{ marginTop: '10px', textAlign: 'center' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  style={{
                    width: '100%',
                    maxWidth: '500px',
                    border: '2px solid #667eea',
                    borderRadius: '8px',
                    marginBottom: '10px'
                  }}
                />
                <button
                  type="button"
                  onClick={capturarFoto}
                  style={{
                    background: '#28a745',
                    color: 'white',
                    padding: '0.75rem 2rem',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '1rem'
                  }}
                >
                  Capturar Foto
                </button>
              </div>
            )}
            
            {fotoPreview && !mostrarCamara && (
              <div style={{ marginTop: '10px', textAlign: 'center' }}>
                <img 
                  src={fotoPreview} 
                  alt="Vista previa del motor" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '300px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px',
                    padding: '5px'
                  }} 
                />
                <button
                  type="button"
                  onClick={() => {
                    setFotoMotor(null);
                    setFotoPreview(null);
                  }}
                  style={{
                    marginTop: '10px',
                    background: '#dc3545',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Eliminar foto
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={() => navigate('/')}>
            Cancelar
          </button>
          <button type="submit" className="btn-submit">
            Registrar Ingreso
          </button>
        </div>
      </form>
    </div>
  );
}

export default FormularioIngreso;
