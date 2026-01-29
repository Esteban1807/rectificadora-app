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

// Inicializar base de datos y exponer promesa de readiness en `app`
const dbReady = initDatabase();
app.dbReady = dbReady;

// Crear directorio temporal para PDFs si no existe
// Usar APP_DATA_PATH si está disponible (Electron empaquetado), sino usar __dirname
function getTempPdfDir() {
  if (process.env.APP_DATA_PATH) {
    const tempDir = path.join(process.env.APP_DATA_PATH, 'temp_pdfs');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    return tempDir;
  }
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

// Servir archivos estáticos del cliente (React build)
const clientBuildPath = path.join(__dirname, '../client/build');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  console.log('Sirviendo archivos estáticos del cliente desde:', clientBuildPath);
}



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
    const {cliente, celular, marca, vehiculo, descripcion, fechaEntrada, estado, incluirIva, mecanicoNombre, mecanicoTelefono, fotoMotor } = req.body;
    
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
app.post('/api/motores/salida/:id', async (req, res) => {
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

// Obtener historial completo (entradas y salidas)
app.get('/api/historial', async (req, res) => {
  try {
    const historial = await getHistorial();
    res.json(historial);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener un motor por ID (completo con items, trabajos y checklist)
app.get('/api/motores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const motor = await getMotorById(id);
    
    if (!motor) {
      return res.status(404).json({ error: 'Motor no encontrado' });
    }

    // Obtener items, trabajos y checklist
    const [items, trabajos, checklist] = await Promise.all([
      getItemsMotor(id),
      getTrabajosMotor(id),
      getChecklistMotor(id)
    ]);

    res.json({
      ...motor,
      items,
      trabajos,
      checklist
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rutas para items/partes del motor
app.get('/api/motores/:id/items', async (req, res) => {
  try {
    const items = await getItemsMotor(req.params.id);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/motores/:id/items', async (req, res) => {
  try {
    const item = await addItemMotor({
      motorId: req.params.id,
      ...req.body
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/items/:id', async (req, res) => {
  try {
    await deleteItemMotor(req.params.id);
    res.json({ message: 'Item eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rutas para trabajos
app.get('/api/motores/:id/trabajos', async (req, res) => {
  try {
    const trabajos = await getTrabajosMotor(req.params.id);
    res.json(trabajos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/motores/:id/trabajos', async (req, res) => {
  try {
    const trabajo = await addTrabajo({
      motorId: req.params.id,
      ...req.body
    });
    res.status(201).json(trabajo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/trabajos/:id', async (req, res) => {
  try {
    const trabajo = await updateTrabajo(req.params.id, req.body);
    res.json(trabajo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/trabajos/:id', async (req, res) => {
  try {
    await deleteTrabajo(req.params.id);
    res.json({ message: 'Trabajo eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rutas para checklist
app.get('/api/motores/:id/checklist', async (req, res) => {
  try {
    const checklist = await getChecklistMotor(req.params.id);
    res.json(checklist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/motores/:id/checklist', async (req, res) => {
  try {
    const checklist = await updateChecklist(req.params.id, req.body);
    res.json(checklist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Finalizar motor
app.post('/api/motores/:id/finalizar', async (req, res) => {
  try {
    const motor = await finalizarMotor(req.params.id);
    res.json(motor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar motor
app.post('/api/motores/:id/eliminar', async (req, res) => {
  try {
    await eliminarMotor(req.params.id);
    res.json({ message: 'Motor eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener siguiente número de motor automático
app.get('/api/motores/next-number', async (req, res) => {
  try {
    const nextNumber = await getNextMotorNumber();
    res.json({ numeroMotor: nextNumber });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para subir PDF temporal
app.post('/api/pdf/upload', (req, res) => {
  try {
    const { pdfData, fileName } = req.body;
    
    if (!pdfData || !fileName) {
      return res.status(400).json({ error: 'PDF data y fileName son requeridos' });
    }

    // Convertir base64 a buffer
    const pdfBuffer = Buffer.from(pdfData, 'base64');
    const sanitizedFileName = fileName.replace(/[^a-z0-9._-]/gi, '_');
    const uniqueFileName = `${Date.now()}_${sanitizedFileName}`;
    const filePath = path.join(TEMP_PDF_DIR, uniqueFileName);

    // Guardar archivo
    fs.writeFileSync(filePath, pdfBuffer);

    // Retornar URL para acceder al archivo
    const fileUrl = `http://localhost:${PORT}/api/pdf/download/${uniqueFileName}`;
    
    res.json({ 
      url: fileUrl,
      fileName: uniqueFileName,
      expiresIn: '24 horas'
    });
  } catch (error) {
    console.error('Error al subir PDF:', error);
    res.status(500).json({ error: 'Error al subir el PDF' });
  }
});

// Endpoint para descargar PDF temporal
app.get('/api/pdf/download/:fileName', (req, res) => {
  try {
    const { fileName } = req.params;
    const sanitizedFileName = fileName.replace(/[^a-z0-9._-]/gi, '');
    const filePath = path.join(TEMP_PDF_DIR, sanitizedFileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    // Enviar archivo con headers apropiados
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFileName}"`);
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    console.error('Error al descargar PDF:', error);
    res.status(500).json({ error: 'Error al descargar el PDF' });
  }
});

// Servir archivos estáticos de React en producción
if (process.env.NODE_ENV === 'production' || process.env.ELECTRON) {
  const buildPath = path.join(__dirname, '..', 'client', 'build');
  if (fs.existsSync(buildPath)) {
    app.use(express.static(buildPath));
    
    // Todas las rutas no-API deben servir index.html (para React Router)
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(buildPath, 'index.html'));
      }
    });
  }
}

// Ruta catch-all para React SPA - servir index.html para rutas no API
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../client/build/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// Iniciar servidor solo si se ejecuta directamente (esperar DB)
if (require.main === module) {
  console.log('Iniciando servidor...');
  
  dbReady.then(() => {
    console.log('Base de datos lista, iniciando servidor HTTP...');
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✓ Servidor corriendo en puerto ${PORT}`);
    });
    
    server.on('error', (err) => {
      console.error('Error del servidor:', err);
      process.exit(1);
    });
  }).catch(err => {
    console.error('❌ No se pudo inicializar la base de datos:', err.message);
    console.error('El servidor continuará en modo lectura (sin BD)');
    
    // Iniciar servidor de todas formas en modo sin DB
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`⚠️ Servidor corriendo en puerto ${PORT} (sin BD)`);
    });
    
    server.on('error', (err) => {
      console.error('Error del servidor:', err);
      process.exit(1);
    });
  });
}

// Exportar la app de Express para uso en Electron
module.exports = app;
