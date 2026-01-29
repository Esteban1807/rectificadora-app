require('dotenv').config();
const mysql = require('mysql2/promise');

// Configuración de conexión a MySQL
const pool = mysql.createPool({
  host: process.env.MYSQLHOST || 'localhost',
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || '',
  database: process.env.MYSQLDATABASE || 'rectificadora',
  port: process.env.MYSQLPORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

function initDatabase() {
  return new Promise(async (resolve, reject) => {
    const MAX_RETRIES = 5;
    let retries = 0;
    
    const tryConnect = async () => {
      try {
        console.log('Inicializando base de datos MySQL...');
        console.log('Host:', process.env.MYSQLHOST);
        console.log('Usuario:', process.env.MYSQLUSER);
        console.log('Base de datos:', process.env.MYSQLDATABASE);

        const connection = await pool.getConnection();
        console.log('✓ Conexión a MySQL establecida');
        
        // Crear tabla de motores
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS motores (
            id INT AUTO_INCREMENT PRIMARY KEY,
            numero_serie VARCHAR(255) UNIQUE,
            cliente VARCHAR(255) NOT NULL,
            celular VARCHAR(20),
            marca VARCHAR(100),
            vehiculo VARCHAR(100),
            placa VARCHAR(20),
            descripcion TEXT,
            fecha_entrada DATETIME NOT NULL,
            fecha_salida DATETIME,
            estado VARCHAR(50) DEFAULT 'En proceso',
            observaciones TEXT,
            incluir_iva TINYINT DEFAULT 0,
            mecanico_nombre VARCHAR(255),
            mecanico_telefono VARCHAR(20),
            medida_bloque VARCHAR(100),
            medida_biela VARCHAR(100),
            medida_bancada VARCHAR(100),
            medida_cigueñal VARCHAR(100),
            eliminado TINYINT DEFAULT 0,
            foto_motor LONGTEXT,
            numero_motor VARCHAR(50),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_cliente (cliente),
            INDEX idx_fecha_entrada (fecha_entrada),
            INDEX idx_estado (estado)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ Tabla motores lista');

        // Crear tabla de trabajos
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS trabajos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            motor_id INT NOT NULL,
            descripcion TEXT NOT NULL,
            parte_asociada VARCHAR(255),
            precio DECIMAL(10, 2) NOT NULL,
            estado VARCHAR(50) DEFAULT 'En proceso',
            mecanico VARCHAR(255),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (motor_id) REFERENCES motores(id) ON DELETE CASCADE,
            INDEX idx_motor_id (motor_id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ Tabla trabajos lista');

        // Crear tabla de items/partes del motor
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS items_motor (
            id INT AUTO_INCREMENT PRIMARY KEY,
            motor_id INT NOT NULL,
            cantidad INT DEFAULT 1,
            descripcion VARCHAR(255) NOT NULL,
            valor DECIMAL(10, 2),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (motor_id) REFERENCES motores(id) ON DELETE CASCADE,
            INDEX idx_motor_id (motor_id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ Tabla items_motor lista');

        // Crear tabla de checklist de componentes
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS checklist_componentes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            motor_id INT NOT NULL,
            componente VARCHAR(255) NOT NULL,
            seccion VARCHAR(100) NOT NULL,
            presente TINYINT DEFAULT 0,
            observaciones TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (motor_id) REFERENCES motores(id) ON DELETE CASCADE,
            INDEX idx_motor_id (motor_id),
            INDEX idx_seccion (seccion)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ Tabla checklist_componentes lista');

        connection.release();
        console.log('✓ Base de datos inicializada correctamente');
        resolve();
      } catch (error) {
        retries++;
        console.error(`Error al inicializar base de datos (intento ${retries}/${MAX_RETRIES}):`, error.message);
        
        if (retries < MAX_RETRIES) {
          console.log(`Reintentando en 3 segundos...`);
          setTimeout(tryConnect, 3000);
        } else {
          console.error('❌ No se pudo conectar a la base de datos después de varios intentos');
          reject(error);
        }
      }
    };
    
    tryConnect();
  });
}

function updateMotorNumeroSerie(id, numeroSerie) {
  return new Promise(async (resolve, reject) => {
    try {
      const connection = await pool.getConnection();
      await connection.execute(
        `UPDATE motores SET numero_serie = ? WHERE id = ?`,
        [numeroSerie, id]
      );
      connection.release();
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

function getMotores(includeEliminados = false) {
  return new Promise(async (resolve, reject) => {
    try {
      let query = `SELECT * FROM motores WHERE fecha_salida IS NULL`;
      if (!includeEliminados) {
        query += ` AND (eliminado = 0 OR eliminado IS NULL)`;
      }
      query += ` ORDER BY fecha_entrada DESC`;

      const connection = await pool.getConnection();
      const [rows] = await connection.execute(query);
      connection.release();

      resolve(rows.map(row => ({
        id: row.id,
        numeroSerie: row.numero_serie,
        cliente: row.cliente,
        celular: row.celular,
        marca: row.marca,
        vehiculo: row.vehiculo,
        placa: row.placa,
        descripcion: row.descripcion,
        fechaEntrada: row.fecha_entrada,
        fechaSalida: row.fecha_salida,
        estado: row.estado,
        observaciones: row.observaciones,
        incluirIva: row.incluir_iva === 1,
        mecanicoNombre: row.mecanico_nombre || null,
        mecanicoTelefono: row.mecanico_telefono || null,
        medidaBloque: row.medida_bloque || null,
        medidaBiela: row.medida_biela || null,
        medidaBancada: row.medida_bancada || null,
        medidaCigueñal: row.medida_cigueñal || null,
        eliminado: row.eliminado === 1,
        fotoMotor: row.foto_motor || null,
        numeroMotor: row.numero_motor || null,
        createdAt: row.created_at
      })));
    } catch (error) {
      reject(error);
    }
  });
}

function getMotorById(id) {
  return new Promise(async (resolve, reject) => {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.execute(`SELECT * FROM motores WHERE id = ?`, [id]);
      connection.release();

      if (rows.length === 0) {
        resolve(null);
        return;
      }

      const row = rows[0];
      resolve({
        id: row.id,
        numeroSerie: row.numero_serie,
        cliente: row.cliente,
        celular: row.celular,
        marca: row.marca,
        vehiculo: row.vehiculo,
        placa: row.placa,
        descripcion: row.descripcion,
        fechaEntrada: row.fecha_entrada,
        fechaSalida: row.fecha_salida,
        estado: row.estado,
        observaciones: row.observaciones,
        incluirIva: row.incluir_iva === 1,
        mecanicoNombre: row.mecanico_nombre || null,
        mecanicoTelefono: row.mecanico_telefono || null,
        medidaBloque: row.medida_bloque || null,
        medidaBiela: row.medida_biela || null,
        medidaBancada: row.medida_bancada || null,
        medidaCigueñal: row.medida_cigueñal || null,
        eliminado: row.eliminado === 1,
        fotoMotor: row.foto_motor || null,
        numeroMotor: row.numero_motor || null,
        createdAt: row.created_at
      });
    } catch (error) {
      reject(error);
    }
  });
}

function addMotor(motor) {
  return new Promise(async (resolve, reject) => {
    try {
      const connection = await pool.getConnection();
      
      const [result] = await connection.execute(
        `INSERT INTO motores (cliente, celular, marca, vehiculo, descripcion, fecha_entrada, estado, incluir_iva, mecanico_nombre, mecanico_telefono, foto_motor)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          motor.cliente,
          motor.celular || null,
          motor.marca || null,
          motor.vehiculo || null,
          motor.descripcion || '',
          motor.fechaEntrada,
          motor.estado || 'En proceso',
          motor.incluirIva ? 1 : 0,
          motor.mecanicoNombre || null,
          motor.mecanicoTelefono || null,
          motor.fotoMotor || null
        ]
      );
      
      connection.release();
      
      const newMotor = await getMotorById(result.insertId);
      resolve(newMotor);
    } catch (error) {
      reject(error);
    }
  });
}

function updateMotor(id, motor) {
  return new Promise(async (resolve, reject) => {
    try {
      const connection = await pool.getConnection();
      
      await connection.execute(
        `UPDATE motores SET 
          numero_motor = ?, cliente = ?, celular = ?, marca = ?, vehiculo = ?, 
          descripcion = ?, estado = ?, incluir_iva = ?, 
          mecanico_nombre = ?, mecanico_telefono = ?, medida_bloque = ?, 
          medida_biela = ?, medida_bancada = ?, medida_cigueñal = ?, eliminado = ?,
          foto_motor = ?
         WHERE id = ?`,
        [
          motor.numeroMotor || null,
          motor.cliente,
          motor.celular || null,
          motor.marca || null,
          motor.vehiculo || null,
          motor.descripcion || '',
          motor.estado || 'En proceso',
          motor.incluirIva ? 1 : 0,
          motor.mecanicoNombre || null,
          motor.mecanicoTelefono || null,
          motor.medidaBloque || null,
          motor.medidaBiela || null,
          motor.medidaBancada || null,
          motor.medidaCigueñal || null,
          motor.eliminado ? 1 : 0,
          motor.fotoMotor !== undefined ? motor.fotoMotor : null,
          id
        ]
      );
      
      connection.release();
      
      const updatedMotor = await getMotorById(id);
      resolve(updatedMotor);
    } catch (error) {
      reject(error);
    }
  });
}

function registrarSalida(id, datosSalida) {
  return new Promise(async (resolve, reject) => {
    try {
      const connection = await pool.getConnection();
      
      // Verificar que el motor existe y no ha salido
      const [rows] = await connection.execute(
        `SELECT * FROM motores WHERE id = ? AND fecha_salida IS NULL`,
        [id]
      );
      
      if (rows.length === 0) {
        connection.release();
        resolve(null);
        return;
      }

      // Actualizar con fecha de salida
      await connection.execute(
        `UPDATE motores SET fecha_salida = ?, observaciones = ? WHERE id = ?`,
        [datosSalida.fechaSalida, datosSalida.observaciones, id]
      );
      
      connection.release();
      
      const updatedMotor = await getMotorById(id);
      resolve(updatedMotor);
    } catch (error) {
      reject(error);
    }
  });
}

function getHistorial() {
  return new Promise(async (resolve, reject) => {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.execute(
        `SELECT * FROM motores ORDER BY fecha_entrada DESC, fecha_salida DESC`
      );
      connection.release();

      resolve(rows.map(row => ({
        id: row.id,
        numeroSerie: row.numero_serie,
        cliente: row.cliente,
        descripcion: row.descripcion,
        fechaEntrada: row.fecha_entrada,
        fechaSalida: row.fecha_salida,
        estado: row.estado,
        observaciones: row.observaciones,
        createdAt: row.created_at
      })));
    } catch (error) {
      reject(error);
    }
  });
}

// Funciones para items/partes del motor
function getItemsMotor(motorId) {
  return new Promise(async (resolve, reject) => {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.execute(
        `SELECT * FROM items_motor WHERE motor_id = ? ORDER BY created_at DESC`,
        [motorId]
      );
      connection.release();

      resolve(rows.map(row => ({
        id: row.id,
        motorId: row.motor_id,
        cantidad: row.cantidad,
        descripcion: row.descripcion,
        valor: row.valor,
        createdAt: row.created_at
      })));
    } catch (error) {
      reject(error);
    }
  });
}

function addItemMotor(item) {
  return new Promise(async (resolve, reject) => {
    try {
      const connection = await pool.getConnection();
      
      const [result] = await connection.execute(
        `INSERT INTO items_motor (motor_id, cantidad, descripcion, valor)
         VALUES (?, ?, ?, ?)`,
        [item.motorId, item.cantidad || 1, item.descripcion, item.valor]
      );
      
      const [rows] = await connection.execute(
        `SELECT * FROM items_motor WHERE id = ?`,
        [result.insertId]
      );
      
      connection.release();
      
      const row = rows[0];
      resolve({
        id: row.id,
        motorId: row.motor_id,
        cantidad: row.cantidad,
        descripcion: row.descripcion,
        valor: row.valor,
        createdAt: row.created_at
      });
    } catch (error) {
      reject(error);
    }
  });
}

function deleteItemMotor(itemId) {
  return new Promise(async (resolve, reject) => {
    try {
      const connection = await pool.getConnection();
      await connection.execute(`DELETE FROM items_motor WHERE id = ?`, [itemId]);
      connection.release();
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

// Funciones para trabajos
function getTrabajosMotor(motorId) {
  return new Promise(async (resolve, reject) => {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.execute(
        `SELECT * FROM trabajos WHERE motor_id = ? ORDER BY created_at DESC`,
        [motorId]
      );
      connection.release();

      resolve(rows.map(row => ({
        id: row.id,
        motorId: row.motor_id,
        descripcion: row.descripcion,
        parteAsociada: row.parte_asociada,
        precio: row.precio,
        estado: row.estado,
        mecanico: row.mecanico,
        createdAt: row.created_at
      })));
    } catch (error) {
      reject(error);
    }
  });
}

function addTrabajo(trabajo) {
  return new Promise(async (resolve, reject) => {
    try {
      const connection = await pool.getConnection();
      
      const [result] = await connection.execute(
        `INSERT INTO trabajos (motor_id, descripcion, parte_asociada, precio, estado, mecanico)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          trabajo.motorId,
          trabajo.descripcion,
          trabajo.parteAsociada || null,
          trabajo.precio,
          trabajo.estado || 'En proceso',
          trabajo.mecanico || null
        ]
      );
      
      const [rows] = await connection.execute(
        `SELECT * FROM trabajos WHERE id = ?`,
        [result.insertId]
      );
      
      connection.release();
      
      const row = rows[0];
      resolve({
        id: row.id,
        motorId: row.motor_id,
        descripcion: row.descripcion,
        parteAsociada: row.parte_asociada,
        precio: row.precio,
        estado: row.estado,
        mecanico: row.mecanico,
        createdAt: row.created_at
      });
    } catch (error) {
      reject(error);
    }
  });
}

function updateTrabajo(id, trabajo) {
  return new Promise(async (resolve, reject) => {
    try {
      const connection = await pool.getConnection();
      
      await connection.execute(
        `UPDATE trabajos SET descripcion = ?, parte_asociada = ?, precio = ?, estado = ?, mecanico = ?
         WHERE id = ?`,
        [
          trabajo.descripcion,
          trabajo.parteAsociada || null,
          trabajo.precio,
          trabajo.estado,
          trabajo.mecanico || null,
          id
        ]
      );
      
      const [rows] = await connection.execute(
        `SELECT * FROM trabajos WHERE id = ?`,
        [id]
      );
      
      connection.release();
      
      const row = rows[0];
      resolve({
        id: row.id,
        motorId: row.motor_id,
        descripcion: row.descripcion,
        parteAsociada: row.parte_asociada,
        precio: row.precio,
        estado: row.estado,
        mecanico: row.mecanico,
        createdAt: row.created_at
      });
    } catch (error) {
      reject(error);
    }
  });
}

function deleteTrabajo(id) {
  return new Promise(async (resolve, reject) => {
    try {
      const connection = await pool.getConnection();
      await connection.execute(`DELETE FROM trabajos WHERE id = ?`, [id]);
      connection.release();
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

// Funciones para checklist
function getChecklistMotor(motorId) {
  return new Promise(async (resolve, reject) => {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.execute(
        `SELECT * FROM checklist_componentes WHERE motor_id = ? ORDER BY seccion, componente`,
        [motorId]
      );
      connection.release();

      resolve(rows.map(row => ({
        id: row.id,
        motorId: row.motor_id,
        componente: row.componente,
        seccion: row.seccion,
        presente: row.presente === 1,
        observaciones: row.observaciones,
        createdAt: row.created_at
      })));
    } catch (error) {
      reject(error);
    }
  });
}

function updateChecklist(motorId, componentes) {
  return new Promise(async (resolve, reject) => {
    try {
      const connection = await pool.getConnection();
      
      // Eliminar checklist existente
      await connection.execute(`DELETE FROM checklist_componentes WHERE motor_id = ?`, [motorId]);
      
      // Insertar nuevos componentes
      for (const comp of componentes) {
        await connection.execute(
          `INSERT INTO checklist_componentes (motor_id, componente, seccion, presente, observaciones)
           VALUES (?, ?, ?, ?, ?)`,
          [
            motorId,
            comp.componente,
            comp.seccion,
            comp.presente ? 1 : 0,
            comp.observaciones || null
          ]
        );
      }
      
      connection.release();
      
      const updatedChecklist = await getChecklistMotor(motorId);
      resolve(updatedChecklist);
    } catch (error) {
      reject(error);
    }
  });
}

function finalizarMotor(id) {
  return new Promise(async (resolve, reject) => {
    try {
      const connection = await pool.getConnection();
      await connection.execute(
        `UPDATE motores SET estado = 'Finalizado' WHERE id = ?`,
        [id]
      );
      connection.release();
      
      const updatedMotor = await getMotorById(id);
      resolve(updatedMotor);
    } catch (error) {
      reject(error);
    }
  });
}

function eliminarMotor(id) {
  return new Promise(async (resolve, reject) => {
    try {
      const connection = await pool.getConnection();
      await connection.execute(
        `UPDATE motores SET eliminado = 1 WHERE id = ?`,
        [id]
      );
      connection.release();
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

function getNextMotorNumber() {
  return new Promise(async (resolve, reject) => {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.execute(
        `SELECT numero_motor FROM motores 
         WHERE numero_motor REGEXP '^[0-9]+$'
         ORDER BY CAST(numero_motor AS UNSIGNED) DESC
         LIMIT 1`
      );
      connection.release();

      if (rows.length === 0) {
        resolve('0001');
        return;
      }

      const lastNumber = parseInt(rows[0].numero_motor, 10);
      const nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
      const formattedNumber = String(nextNumber).padStart(4, '0');

      resolve(formattedNumber);
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
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
  getNextMotorNumber,
  pool
};
