import React, { useState } from 'react';
import './ModalPDF.css';
import jsPDF from 'jspdf';
import { getMotorById, updateMotor } from '../services/api';

const MEDIDAS_BIELA_BANCADA = ['Estandar', '0.25', '0.50', '0.75', '1.00'];
const MEDIDAS_BLOQUE = ['Estandar', '0.25', '0.50', '0.75', '1.00', '1.25', '1.50', '1.75'];

function ModalPDF({ motor, onClose }) {
  const [medidas, setMedidas] = useState({
    bloque: motor.medidaBloque || '',
    biela: motor.medidaBiela || '',
    bancada: motor.medidaBancada || ''
  });
  const [telefono, setTelefono] = useState(motor.mecanicoTelefono || '');
  const [loading, setLoading] = useState(false);

  const handleMedidaChange = (tipo, value) => {
    setMedidas(prev => ({
      ...prev,
      [tipo]: value
    }));
  };

  const cargarLogoBase64 = async () => {
    try {
      // Intentar cargar el logo desde la carpeta public
      const response = await fetch('/logo.png');
      if (!response.ok) throw new Error('Logo no encontrado');
      
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn('No se pudo cargar el logo:', error);
      return null;
    }
  };

  const generarPDF = async () => {
    // Validar que al menos haya una medida
    if (!medidas.bloque && !medidas.biela && !medidas.bancada) {
      alert('Por favor ingrese al menos una medida');
      return;
    }

    setLoading(true);
    try {
      // Cargar el logo antes de generar el PDF
      const logoBase64 = await cargarLogoBase64();
      
      // Actualizar medidas en el motor
      await updateMotor(motor.id, {
        ...motor,
        medidaBloque: medidas.bloque,
        medidaBiela: medidas.biela,
        medidaBancada: medidas.bancada
      });

      // Cargar motor completo con checklist y trabajos
      const motorCompleto = await getMotorById(motor.id);

      // Calcular totales
      const subtotalTrabajos = (motorCompleto.trabajos || []).reduce((sum, t) => sum + parseFloat(t.precio || 0), 0);
      const subtotalItems = (motorCompleto.items || []).reduce((sum, i) => sum + (i.cantidad * i.valor), 0);
      const subtotal = subtotalTrabajos + subtotalItems;
      const iva = motorCompleto.incluirIva ? subtotal * 0.19 : 0;
      const total = subtotal + iva;

      // Generar PDF
      const doc = new jsPDF();
      
      // Colores del esquema: azul principal #667eea (102, 126, 234) y gris
      const colorAzul = [102, 126, 234];
      const colorGris = [128, 128, 128];
      const colorGrisClaro = [240, 240, 240];
      
      // Logo - Usar el logo PNG cargado como base64
      const logoX = 20;
      const logoY = 10;
      const logoWidth = 40;
      const logoHeight = 40;
      
      if (logoBase64) {
        try {
          // Agregar el logo PNG real
          doc.addImage(logoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight);
        } catch (error) {
          console.warn('Error al agregar logo al PDF:', error);
          // Fallback a placeholder
          doc.setDrawColor(...colorGris);
          doc.setFillColor(...colorGrisClaro);
          doc.roundedRect(logoX, logoY, logoWidth, logoHeight, 3, 3, 'FD');
          doc.setFontSize(7);
          doc.setTextColor(...colorGris);
          doc.text('LOGO', logoX + logoWidth/2, logoY + logoHeight/2, { align: 'center' });
        }
      } else {
        // Placeholder si no hay logo
        doc.setDrawColor(...colorGris);
        doc.setFillColor(...colorGrisClaro);
        doc.roundedRect(logoX, logoY, logoWidth, logoHeight, 3, 3, 'FD');
        doc.setFontSize(7);
        doc.setTextColor(...colorGris);
        doc.text('LOGO', logoX + logoWidth/2, logoY + logoHeight/2, { align: 'center' });
      }
      
      // Título con color azul
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...colorAzul);
      doc.text('Rectificadora Santofimio', 105, 25, { align: 'center' });
      doc.setFontSize(14);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('Información del Motor', 105, 35, { align: 'center' });
      
      // Línea separadora con color gris
      doc.setDrawColor(...colorGris);
      doc.line(20, 42, 190, 42);

      // Información del cliente y mecánico lado a lado
      let y = 55;
      const clienteX = 20;
      const mecanicoX = 105; // Columna derecha
      
      doc.setFontSize(11);
      
      // Columna izquierda - Cliente
      doc.setFont(undefined, 'bold');
      doc.text('Cliente:', clienteX, y);
      doc.setFont(undefined, 'normal');
      doc.text(motor.cliente || 'N/A', clienteX + 30, y);
      
      y += 8;
      doc.setFont(undefined, 'bold');
      doc.text('Vehículo:', clienteX, y);
      doc.setFont(undefined, 'normal');
      doc.text(`${motor.marca || ''} ${motor.vehiculo || ''}`.trim() || 'N/A', clienteX + 30, y);
      
      y += 8;
      doc.setFont(undefined, 'bold');
      doc.text('Número Motor:', clienteX, y);
      doc.setFont(undefined, 'normal');
      doc.text(motor.numeroMotor || 'N/A', clienteX + 30, y);
      
      // Columna derecha - Mecánico (mismo nivel Y que cliente)
      let yMecanico = 55;
      doc.setFont(undefined, 'bold');
      doc.text('Mecánico:', mecanicoX, yMecanico);
      doc.setFont(undefined, 'normal');
      doc.text(motor.mecanicoNombre || 'N/A', mecanicoX + 35, yMecanico);
      
      yMecanico += 8;
      doc.setFont(undefined, 'bold');
      doc.text('Teléfono:', mecanicoX, yMecanico);
      doc.setFont(undefined, 'normal');
      const telefonoEnvio = telefono.trim() || motor.mecanicoTelefono || 'N/A';
      doc.text(telefonoEnvio, mecanicoX + 35, yMecanico);
      
      // Ajustar Y al mayor de los dos para continuar
      y = Math.max(y, yMecanico);

      // Medidas con cuadro destacado (encima de la foto) - mejor organizado
      y += 15;
      doc.setDrawColor(...colorAzul);
      doc.setLineWidth(1.5);
      doc.setFillColor(...colorGrisClaro);
      
      // Calcular altura dinámica según medidas disponibles
      let medidasCount = 0;
      if (medidas.bloque) medidasCount++;
      if (medidas.biela || medidas.bancada) medidasCount++; // Cigüeñal cuenta como una sola medida
      const alturaMedidas = medidasCount > 0 ? medidasCount * 7 + 20 : 25;
      
      doc.roundedRect(20, y - 5, 170, alturaMedidas, 3, 3, 'FD');
      
      // Título con color azul
      doc.setFont(undefined, 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...colorAzul);
      doc.text('MEDIDAS DEL MOTOR', 25, y);
      
      let yMedidas = y + 10;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);
      
      if (medidas.bloque) {
        doc.setFont(undefined, 'bold');
        doc.text('Bloque:', 25, yMedidas);
        doc.setFont(undefined, 'normal');
        doc.text(medidas.bloque, 50, yMedidas);
        yMedidas += 7;
      }
      
      // Cigüeñal (bancada y biela) como una sola medida
      if (medidas.biela || medidas.bancada) {
        doc.setFont(undefined, 'bold');
        doc.text('Cigüeñal:', 25, yMedidas);
        doc.setFont(undefined, 'normal');
        const medidasCigueñal = [];
        if (medidas.bancada) medidasCigueñal.push(`Bancada: ${medidas.bancada}`);
        if (medidas.biela) medidasCigueñal.push(`Biela: ${medidas.biela}`);
        doc.text(medidasCigueñal.join(', '), 50, yMedidas);
        yMedidas += 7;
      }
      
      // Actualizar Y después de las medidas
      if (medidasCount === 0) {
        yMedidas += 8; // Si no hay medidas, solo dejar espacio para el título
      }
      y = yMedidas + 5;

      // Agregar foto del motor si existe (debajo de las medidas)
      if (motorCompleto.fotoMotor) {
        y += 10;
        
        // Verificar si necesitamos nueva página para la foto
        if (y > 200) {
          doc.addPage();
          y = 20;
        }
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('Foto del Motor:', 20, y);
        y += 8;
        
        try {
          // Ajustar tamaño de la imagen (máximo 80mm de ancho, altura proporcional)
          const maxWidth = 80; // mm
          const maxHeight = 60; // mm
          
          // Detectar el formato de la imagen desde el data URI
          let format = 'JPEG';
          let imageData = motorCompleto.fotoMotor;
          
          if (imageData.startsWith('data:image/')) {
            const formatMatch = imageData.match(/data:image\/(\w+);/);
            if (formatMatch) {
              format = formatMatch[1].toUpperCase();
              if (format === 'JPG') format = 'JPEG';
            }
          }
          
          // Cargar la imagen desde base64
          doc.addImage(
            imageData,
            format,
            20, // x
            y, // y
            maxWidth, // width
            maxHeight, // height
            undefined, // alias
            'FAST' // compression
          );
          
          y += maxHeight + 10;
        } catch (error) {
          console.error('Error al agregar imagen al PDF:', error);
          doc.setFontSize(9);
          doc.setTextColor(150, 150, 150);
          doc.text('No se pudo cargar la imagen del motor', 20, y);
          y += 8;
          doc.setTextColor(0, 0, 0);
        }
      }

      // Checklist con recuadros visuales
      y += 15;
      
      // Definir componentes por sección (debe coincidir exactamente con ChecklistComponentes.js)
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
          'Arandelas de resorte', 'Bloque', 'Flautas', 'Balancines', 'Resortes', 'Separadores'
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

      // Mapear checklist a un objeto de búsqueda rápida
      const checklistMap = {};
      (motorCompleto.checklist || []).forEach(item => {
        const key = `${item.seccion}-${item.componente}`;
        checklistMap[key] = item.presente;
      });

      // Colores para cada sección - usando azul principal y variaciones con gris
      const COLORES_SECCIONES = {
        bloque: [102, 126, 234],      // Azul principal
        cigueñal: [102, 126, 234],    // Azul principal
        culata: [102, 126, 234],      // Azul principal
        bielas: [102, 126, 234],      // Azul principal
        arbolLevas: [102, 126, 234],  // Azul principal
        varios: [102, 126, 234]       // Azul principal
      };

      const TITULOS_SECCIONES = {
        bloque: 'BLOQUE',
        cigueñal: 'CIGÜEÑAL',
        culata: 'CULATA',
        bielas: 'BIELAS',
        arbolLevas: 'ÁRBOL DE LEVAS',
        varios: 'COMPONENTES VARIOS'
      };

      // Función para dibujar un checkbox
      const dibujarCheckbox = (x, y, checked, color) => {
        const size = 4;
        const checkboxY = y - size/2;
        doc.setDrawColor(...color);
        doc.setLineWidth(0.5);
        doc.rect(x, checkboxY, size, size);
        if (checked) {
          doc.setFillColor(...color);
          doc.rect(x, checkboxY, size, size, 'FD');
          doc.setFontSize(6);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(255, 255, 255);
          // Centrar el checkmark manualmente
          const checkmarkX = x + size/2;
          const checkmarkY = y + 0.8;
          doc.text('✓', checkmarkX, checkmarkY, { align: 'center' });
          doc.setTextColor(0, 0, 0);
          doc.setFont(undefined, 'normal');
        }
      };

      // Renderizar cada sección
      Object.keys(COMPONENTES_POR_SECCION).forEach((seccion, seccionIdx) => {
        const componentes = COMPONENTES_POR_SECCION[seccion];
        const color = COLORES_SECCIONES[seccion] || [100, 100, 100];
        const titulo = TITULOS_SECCIONES[seccion] || seccion.toUpperCase();

        // Dividir componentes en dos columnas
        const mitad = Math.ceil(componentes.length / 2);
        const columna1 = componentes.slice(0, mitad);
        const columna2 = componentes.slice(mitad);
        const maxRows = Math.max(columna1.length, columna2.length);

        // Calcular altura aproximada (conservadora para dejar espacio extra)
        let alturaAprox = maxRows * 7 + 20; // Espacio generoso para componentes
        
        // Verificar si hay observaciones
        const observacionesItem = (motorCompleto.checklist || []).find(
          item => (item.seccion === seccion) && item.observaciones
        );
        if (observacionesItem && observacionesItem.observaciones) {
          const obsLines = doc.splitTextToSize(observacionesItem.observaciones || '', 150);
          alturaAprox += obsLines.length * 5 + 10;
        }

        // Verificar si necesitamos nueva página
        if (y + alturaAprox > 260) {
          doc.addPage();
          y = 20;
        }

        // Separación entre recuadros de secciones (espacio antes de cada sección)
        if (seccionIdx > 0) {
          y += 15; // Espacio adicional entre secciones para evitar que se vean remontadas
        }

        const startY = y;

        // Dibujar recuadro de la sección (se ajustará después si es necesario)
        doc.setDrawColor(...color);
        doc.setLineWidth(1.5);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(20, y - 8, 170, alturaAprox, 4, 4, 'FD');
        
        // Borde interno con gris claro para mejor organización
        doc.setDrawColor(...colorGris);
        doc.setLineWidth(0.5);
        doc.roundedRect(21, y - 7, 168, alturaAprox - 2, 3, 3);

        // Título de la sección (alineado a la derecha)
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...color);
        doc.text(titulo, 185, y + 2, { align: 'right' });

        const col1X = 30;
        const col2X = 105;
        let currentY = y + 10;

        // Renderizar columnas - renderizar ambos lados de la fila simultáneamente
        for (let i = 0; i < maxRows; i++) {
          let maxHeightInRow = 6; // Altura mínima por fila
          
          // Columna 1
          if (i < columna1.length) {
            const componente = columna1[i];
            const key = `${seccion}-${componente}`;
            const presente = checklistMap[key] || false;
            
            dibujarCheckbox(col1X, currentY, presente, color);
            doc.setFontSize(8);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(0, 0, 0);
            const textoComponente = doc.splitTextToSize(componente, 60);
            doc.text(textoComponente[0], col1X + 6, currentY);
            if (textoComponente.length > 1) {
              doc.text(textoComponente[1], col1X + 6, currentY + 4);
              maxHeightInRow = Math.max(maxHeightInRow, 10);
            }
          }

          // Columna 2 - mantener misma altura base
          if (i < columna2.length) {
            const componente = columna2[i];
            const key = `${seccion}-${componente}`;
            const presente = checklistMap[key] || false;
            
            dibujarCheckbox(col2X, currentY, presente, color);
            doc.setFontSize(8);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(0, 0, 0);
            const textoComponente = doc.splitTextToSize(componente, 60);
            doc.text(textoComponente[0], col2X + 6, currentY);
            if (textoComponente.length > 1) {
              doc.text(textoComponente[1], col2X + 6, currentY + 4);
              maxHeightInRow = Math.max(maxHeightInRow, 10);
            }
          }

          currentY += maxHeightInRow;
        }

        // Agregar observaciones si existen (para bielas y varios)
        if (observacionesItem && observacionesItem.observaciones) {
          currentY += 4;
          doc.setFontSize(7);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(0, 0, 0);
          doc.text('Observaciones:', col1X, currentY);
          currentY += 4;
          doc.setFont(undefined, 'normal');
          const obsLines = doc.splitTextToSize(observacionesItem.observaciones, 150);
          obsLines.forEach(line => {
            doc.text(line, col1X, currentY);
            currentY += 4;
          });
        }

        // Actualizar Y al final de la sección con espacio adicional para separación
        y = currentY + 25; // Aumentado de 20 a 25 para mejor separación
      });

      y += 10; // separación antes del resumen financiero


      // Resumen Financiero con recuadro ordenado
      if (y > 200) {
        doc.addPage();
        y = 20;
      }
      y += 10;
      
      // Calcular altura del recuadro basado en el contenido real
      let alturaResumen = 15; // Título y espacio
      alturaResumen += 7; // Subtotal Trabajos
      alturaResumen += 7; // Subtotal Items
      alturaResumen += 7; // Subtotal
      if (motorCompleto.incluirIva) alturaResumen += 7; // IVA
      alturaResumen += 5; // Línea separadora
      alturaResumen += 8; // Total
      alturaResumen += 5; // Padding inferior
      
      const startY = y;
      
      // Recuadro del resumen financiero
      doc.setDrawColor(...colorAzul);
      doc.setLineWidth(1.5);
      doc.setFillColor(...colorGrisClaro);
      doc.roundedRect(20, startY - 5, 170, alturaResumen, 4, 4, 'FD');
      
      // Borde interno
      doc.setDrawColor(...colorGris);
      doc.setLineWidth(0.5);
      doc.roundedRect(21, startY - 4, 168, alturaResumen - 2, 3, 3);
      
      // Título
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...colorAzul);
      doc.text('RESUMEN FINANCIERO', 25, startY);
      
      let currentY = startY + 10;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);
      
      // Filas del resumen
      doc.text(`Subtotal Trabajos:`, 25, currentY);
      doc.text(`$${subtotalTrabajos.toLocaleString()}`, 165, currentY, { align: 'right' });
      currentY += 7;
      
      doc.text(`Subtotal Items:`, 25, currentY);
      doc.text(`$${subtotalItems.toLocaleString()}`, 165, currentY, { align: 'right' });
      currentY += 7;
      
      doc.setFont(undefined, 'bold');
      doc.text(`Subtotal:`, 25, currentY);
      doc.text(`$${subtotal.toLocaleString()}`, 165, currentY, { align: 'right' });
      currentY += 7;
      
      if (motorCompleto.incluirIva) {
        doc.setFont(undefined, 'normal');
        doc.text(`IVA (19%):`, 25, currentY);
        doc.text(`$${iva.toLocaleString()}`, 165, currentY, { align: 'right' });
        currentY += 7;
      }
      
      // Línea separadora antes del total
      currentY += 2;
      doc.setDrawColor(...colorAzul);
      doc.setLineWidth(1);
      doc.line(25, currentY, 165, currentY);
      currentY += 5;
      
      // Total destacado (dentro del recuadro)
      doc.setFont(undefined, 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...colorAzul);
      doc.text(`TOTAL:`, 25, currentY);
      doc.text(`$${total.toLocaleString()}`, 165, currentY, { align: 'right' });
      
      // Actualizar Y para continuar después del recuadro
      y = startY + alturaResumen;

      // Guardar PDF
      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Motor_${motor.numeroSerie}_${motor.cliente}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      // Enviar por WhatsApp solo si hay teléfono disponible
      const telefonoWhatsApp = telefono.trim() || motor.mecanicoTelefono;
      if (telefonoWhatsApp) {
        const medidasTexto = [];
        if (medidas.bloque) medidasTexto.push(`Bloque: ${medidas.bloque}`);
        const medidasCigueñal = [];
        if (medidas.bancada) medidasCigueñal.push(`Bancada: ${medidas.bancada}`);
        if (medidas.biela) medidasCigueñal.push(`Biela: ${medidas.biela}`);
        if (medidasCigueñal.length > 0) {
          medidasTexto.push(`Cigüeñal (${medidasCigueñal.join(', ')})`);
        }
        
        const mensaje = encodeURIComponent(
          `Información del Motor - ${motor.cliente}\n` +
          `Vehículo: ${motor.marca || ''} ${motor.vehiculo || ''}\n` +
          `Número Motor: ${motor.numeroMotor || 'N/A'}\n` +
          `Medidas: ${medidasTexto.join(', ')}\n` +
          `Total: $${total.toLocaleString()}`
        );
        const whatsappUrl = `https://wa.me/57${telefonoWhatsApp.replace(/\D/g, '')}?text=${mensaje}`;
        window.open(whatsappUrl, '_blank');
        alert('PDF generado y enlace de WhatsApp abierto');
      } else {
        alert('PDF generado exitosamente');
      }
      onClose();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al generar el PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Generar PDF y Enviar por WhatsApp</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Medida del Bloque</label>
            <select
              value={medidas.bloque}
              onChange={(e) => handleMedidaChange('bloque', e.target.value)}
            >
              <option value="">Seleccione</option>
              {MEDIDAS_BLOQUE.map(medida => (
                <option key={medida} value={medida}>{medida}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Cigüeñal (Bancada y Biela)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: '#666' }}>Bancada</label>
                <select
                  value={medidas.bancada}
                  onChange={(e) => handleMedidaChange('bancada', e.target.value)}
                >
                  <option value="">Seleccione</option>
                  {MEDIDAS_BIELA_BANCADA.map(medida => (
                    <option key={medida} value={medida}>{medida}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: '#666' }}>Biela</label>
                <select
                  value={medidas.biela}
                  onChange={(e) => handleMedidaChange('biela', e.target.value)}
                >
                  <option value="">Seleccione</option>
                  {MEDIDAS_BIELA_BANCADA.map(medida => (
                    <option key={medida} value={medida}>{medida}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Teléfono para WhatsApp (Opcional)</label>
            <input
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder={motor.mecanicoTelefono || "3001234567"}
            />
            <small>Si no se especifica, se usará el teléfono del mecánico guardado. Si no hay teléfono, solo se descargará el PDF.</small>
          </div>

          <div className="modal-footer">
            <button className="btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button 
              className="btn-generar" 
              onClick={generarPDF}
              disabled={loading || (!medidas.bloque && !medidas.biela && !medidas.bancada)}
            >
              {loading ? 'Generando...' : 'Generar PDF y Enviar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalPDF;
