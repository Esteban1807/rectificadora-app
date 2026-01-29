const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const {
  initDatabase,
  getMotores,
  getMotorById,
  addMotor,
  updateMotor,
  registrarSalida,
  getHistorial,
  getItemsMotor,
  addItemMotor,
  deleteItemMotor,
  getTrabajosMotor,
  addTrabajo,
  updateTrabajo,
  deleteTrabajo,
  getChecklistMotor,
  updateChecklist,
  finalizarMotor,
  eliminarMotor,
  getNextMotorNumber
} = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

// Inicializar base de datos
initDatabase().catch(err => {
  console.error('Error al inicializar BD:', err);
});

// Crear directorio temporal para PDFs si no existe
function getTempPdfDir() {
  const tempDir = path.join(__dirname, 'temp_pdfs');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
}

const TEMP_PDF_DIR = getTempPdfDir();

// Limpiar PDFs antiguos (más de 24 horas) cada hora
setInterval(() => {
  fs.readdir(TEMP_PDF_DIR, (err, files) => {
    if (err) return;
    const now = Date.now();
    files.forEach(file => {
      const filePath = path.join(TEMP_PDF_DIR, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return;
        // Eliminar archivos más antiguos de 24 horas
        if (now - stats.mtime.getTime() > 24 * 60 * 60 * 1000) {
          fs.unlink(filePath, () => {});
        }
      });
    });
  });
}, 60 * 60 * 1000); // Cada hora

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Rutas API

// Obtener todos los motores en inventario (que no han salido)
app.get('/api/motores', async (req, res) => {
  try {
    const motores = await getMotores();
    res.json(motores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Registrar entrada de un motor
app.post('/api/motores/entrada', async (req, res) => {
  try {
    const { cliente, celular, marca, vehiculo, descripcion, fechaEntrada, estado, incluirIva, mecanicoNombre, mecanicoTelefono, fotoMotor } = req.body;
    
    if (!cliente) {
      return res.status(400).json({ error: 'Cliente es requerido' });
    }

    const motor = await addMotor({
      cliente,
      celular,
      marca,
      vehiculo,
      descripcion: descripcion || '',
      fechaEntrada: fechaEntrada || new Date().toISOString().split('T')[0],
      estado: estado || 'En proceso',
      incluirIva: incluirIva || false,
      mecanicoNombre,
      mecanicoTelefono,
      fotoMotor
    });

    res.status(201).json(motor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener detalles de un motor
app.get('/api/motores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const motor = await getMotorById(id);
    
    if (!motor) {
      return res.status(404).json({ error: 'Motor no encontrado' });
    }

    res.json(motor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar un motor
app.put('/api/motores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const motor = await updateMotor(id, req.body);
    res.json(motor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Registrar salida de un motor
app.post('/api/motores/:id/salida', async (req, res) => {
  try {
    const { id } = req.params;
    const { fechaSalida, observaciones } = req.body;

    const motor = await registrarSalida(id, {
      fechaSalida: fechaSalida || new Date().toISOString().split('T')[0],
      observaciones: observaciones || ''
    });

    if (!motor) {
      return res.status(404).json({ error: 'Motor no encontrado o ya fue dado de salida' });
    }

    res.json(motor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener historial de motores que han salido
app.get('/api/historial', async (req, res) => {
  try {
    const historial = await getHistorial();
    res.json(historial);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener items de un motor
app.get('/api/motores/:motorId/items', async (req, res) => {
  try {
    const { motorId } = req.params;
    const items = await getItemsMotor(motorId);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Agregar item a un motor
app.post('/api/motores/:motorId/items', async (req, res) => {
  try {
    const { motorId } = req.params;
    const { item, cantidad, costo } = req.body;
    
    const newItem = await addItemMotor(motorId, { item, cantidad, costo });
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar item
app.delete('/api/items/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    await deleteItemMotor(itemId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener trabajos de un motor
app.get('/api/motores/:motorId/trabajos', async (req, res) => {
  try {
    const { motorId } = req.params;
    const trabajos = await getTrabajosMotor(motorId);
    res.json(trabajos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Agregar trabajo a un motor
app.post('/api/motores/:motorId/trabajos', async (req, res) => {
  try {
    const { motorId } = req.params;
    const { descripcion, estado } = req.body;
    
    const newTrabajo = await addTrabajo(motorId, { descripcion, estado });
    res.status(201).json(newTrabajo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar trabajo
app.put('/api/trabajos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion, estado } = req.body;
    
    const updatedTrabajo = await updateTrabajo(id, { descripcion, estado });
    res.json(updatedTrabajo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar trabajo
app.delete('/api/trabajos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await deleteTrabajo(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener checklist de un motor
app.get('/api/motores/:motorId/checklist', async (req, res) => {
  try {
    const { motorId } = req.params;
    const checklist = await getChecklistMotor(motorId);
    res.json(checklist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar checklist de un motor
app.put('/api/motores/:motorId/checklist', async (req, res) => {
  try {
    const { motorId } = req.params;
    const { checklist } = req.body;
    
    const updatedChecklist = await updateChecklist(motorId, checklist);
    res.json(updatedChecklist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Finalizar motor
app.post('/api/motores/:id/finalizar', async (req, res) => {
  try {
    const { id } = req.params;
    const finalizedMotor = await finalizarMotor(id);
    res.json(finalizedMotor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar motor
app.delete('/api/motores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await eliminarMotor(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener próximo número de motor
app.get('/api/proxximo-numero', async (req, res) => {
  try {
    const numero = await getNextMotorNumber();
    res.json({ numero });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
});
