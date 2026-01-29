const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Usar base de datos SQLite local
const dbPath = path.join(__dirname, 'inventario.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err);
  } else {
    console.log('Conectado a la base de datos SQLite');
  }
});

// Promisificar para usar async/await
db.run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

db.get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

db.all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

// Inicializar base de datos
function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Crear tabla de motores
      db.run(`
        CREATE TABLE IF NOT EXISTS motores (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          numero_serie TEXT UNIQUE,
          cliente TEXT NOT NULL,
          celular TEXT,
          marca TEXT,
          vehiculo TEXT,
          placa TEXT,
          descripcion TEXT,
          fecha_entrada DATETIME NOT NULL,
          fecha_salida DATETIME,
          estado TEXT DEFAULT 'En proceso',
          observaciones TEXT,
          incluir_iva INTEGER DEFAULT 0,
          mecanico_nombre TEXT,
          mecanico_telefono TEXT,
          medida_bloque TEXT,
          medida_biela TEXT,
          medida_bancada TEXT,
          medida_cigueñal TEXT,
          eliminado INTEGER DEFAULT 0,
          foto_motor LONGTEXT
        )
      `, (err) => {
        if (err) console.error('Error creando tabla motores:', err);
      });

      // Crear tabla de trabajos
      db.run(`
        CREATE TABLE IF NOT EXISTS trabajos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          motor_id INTEGER NOT NULL,
          descripcion TEXT,
          estado TEXT DEFAULT 'pendiente',
          FOREIGN KEY(motor_id) REFERENCES motores(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) console.error('Error creando tabla trabajos:', err);
      });

      // Crear tabla de items de motor
      db.run(`
        CREATE TABLE IF NOT EXISTS items_motor (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          motor_id INTEGER NOT NULL,
          item TEXT,
          cantidad INTEGER,
          costo REAL,
          FOREIGN KEY(motor_id) REFERENCES motores(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) console.error('Error creando tabla items_motor:', err);
      });

      // Crear tabla de checklist de componentes
      db.run(`
        CREATE TABLE IF NOT EXISTS checklist_componentes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          motor_id INTEGER NOT NULL,
          componente TEXT,
          estado TEXT,
          observaciones TEXT,
          FOREIGN KEY(motor_id) REFERENCES motores(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) console.error('Error creando tabla checklist_componentes:', err);
        resolve();
      });
    });
  });
}

// Funciones CRUD para motores
async function getMotores() {
  return db.all('SELECT * FROM motores WHERE eliminado = 0 ORDER BY fecha_entrada DESC');
}

async function getMotorById(id) {
  return db.get('SELECT * FROM motores WHERE id = ? AND eliminado = 0', [id]);
}

async function addMotor(motorData) {
  const sql = `
    INSERT INTO motores (
      numero_serie, cliente, celular, marca, vehiculo, placa, 
      descripcion, fecha_entrada, mecanico_nombre, mecanico_telefono,
      medida_bloque, medida_biela, medida_bancada, medida_cigueñal, 
      incluir_iva, foto_motor
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const result = await db.run(sql, [
    motorData.numero_serie,
    motorData.cliente,
    motorData.celular,
    motorData.marca,
    motorData.vehiculo,
    motorData.placa,
    motorData.descripcion,
    new Date().toISOString(),
    motorData.mecanico_nombre,
    motorData.mecanico_telefono,
    motorData.medida_bloque,
    motorData.medida_biela,
    motorData.medida_bancada,
    motorData.medida_cigueñal,
    motorData.incluir_iva || 0,
    motorData.foto_motor
  ]);
  return result.lastID;
}

async function updateMotor(id, motorData) {
  const fields = [];
  const values = [];
  
  for (const [key, value] of Object.entries(motorData)) {
    fields.push(`${key} = ?`);
    values.push(value);
  }
  
  values.push(id);
  
  const sql = `UPDATE motores SET ${fields.join(', ')} WHERE id = ?`;
  return db.run(sql, values);
}

async function registrarSalida(id, datosSalida) {
  const sql = `
    UPDATE motores 
    SET fecha_salida = ?, estado = 'completado', observaciones = ?
    WHERE id = ?
  `;
  return db.run(sql, [new Date().toISOString(), datosSalida.observaciones || '', id]);
}

async function getHistorial() {
  return db.all(`
    SELECT * FROM motores 
    WHERE estado = 'completado' OR eliminado = 1
    ORDER BY fecha_salida DESC
  `);
}

// Funciones para items
async function getItemsMotor(motorId) {
  return db.all('SELECT * FROM items_motor WHERE motor_id = ?', [motorId]);
}

async function addItemMotor(motorId, item) {
  const sql = `
    INSERT INTO items_motor (motor_id, item, cantidad, costo)
    VALUES (?, ?, ?, ?)
  `;
  return db.run(sql, [motorId, item.item, item.cantidad, item.costo]);
}

async function deleteItemMotor(itemId) {
  return db.run('DELETE FROM items_motor WHERE id = ?', [itemId]);
}

// Funciones para trabajos
async function getTrabajosMotor(motorId) {
  return db.all('SELECT * FROM trabajos WHERE motor_id = ?', [motorId]);
}

async function addTrabajo(motorId, trabajo) {
  const sql = `
    INSERT INTO trabajos (motor_id, descripcion, estado)
    VALUES (?, ?, ?)
  `;
  return db.run(sql, [motorId, trabajo.descripcion, trabajo.estado || 'pendiente']);
}

async function updateTrabajo(id, trabajo) {
  const sql = 'UPDATE trabajos SET descripcion = ?, estado = ? WHERE id = ?';
  return db.run(sql, [trabajo.descripcion, trabajo.estado, id]);
}

async function deleteTrabajo(id) {
  return db.run('DELETE FROM trabajos WHERE id = ?', [id]);
}

// Funciones para checklist
async function getChecklistMotor(motorId) {
  return db.all('SELECT * FROM checklist_componentes WHERE motor_id = ?', [motorId]);
}

async function updateChecklist(motorId, checklist) {
  for (const item of checklist) {
    if (item.id) {
      const sql = `
        UPDATE checklist_componentes 
        SET estado = ?, observaciones = ?
        WHERE id = ? AND motor_id = ?
      `;
      await db.run(sql, [item.estado, item.observaciones || '', item.id, motorId]);
    } else {
      const sql = `
        INSERT INTO checklist_componentes (motor_id, componente, estado, observaciones)
        VALUES (?, ?, ?, ?)
      `;
      await db.run(sql, [motorId, item.componente, item.estado, item.observaciones || '']);
    }
  }
  return { success: true };
}

async function finalizarMotor(id) {
  const sql = 'UPDATE motores SET estado = ?, fecha_salida = ? WHERE id = ?';
  return db.run(sql, ['completado', new Date().toISOString(), id]);
}

async function eliminarMotor(id) {
  const sql = 'UPDATE motores SET eliminado = 1 WHERE id = ?';
  return db.run(sql, [id]);
}

async function updateMotorNumeroSerie(id, numero_serie) {
  const sql = 'UPDATE motores SET numero_serie = ? WHERE id = ?';
  return db.run(sql, [numero_serie, id]);
}

async function getNextMotorNumber() {
  const result = await db.get('SELECT COUNT(*) as count FROM motores WHERE eliminado = 0');
  return result ? result.count + 1 : 1;
}

module.exports = {
  db,
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
  updateMotorNumeroSerie,
  getNextMotorNumber
};
