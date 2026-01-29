const { app, BrowserWindow } = require('electron');
const path = require('path');

let server = null;
const PORT = 5000;
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    fullscreen: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    },
    icon: path.join(__dirname, 'build', 'icon.ico'),
    title: 'Rectificadora Santofimio'
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  startServer().then((port) => {
    mainWindow.loadURL(`http://localhost:${port}`);
  });
}

async function startServer() {
  return new Promise((resolve, reject) => {
    try {
      process.env.ELECTRON = 'true';
      process.env.NODE_ENV = 'production';

      if (app.isPackaged) {
        process.env.APP_DATA_PATH = app.getPath('userData');
      } else {
        process.env.APP_DATA_PATH = path.join(__dirname, 'server');
      }

      const expressApp = require('./server/index');

      if (server && server.listening) {
        resolve(PORT);
        return;
      }

      function tryStartServer(port) {
        server = expressApp.listen(port, '127.0.0.1', () => {
          console.log(`Servidor Express iniciado en puerto ${port}`);
          resolve(port);
        });

        server.on('error', (err) => {
          if (err.code === 'EADDRINUSE') {
            console.log(`Puerto ${port} ocupado, intentando ${port + 1}`);
            tryStartServer(port + 1);
          } else {
            reject(err);
          }
        });
      }

      // Esperar a que la DB esté lista antes de iniciar el listener
      if (expressApp.dbReady && typeof expressApp.dbReady.then === 'function') {
        expressApp.dbReady.then(() => tryStartServer(PORT)).catch(err => {
          console.error('No se pudo inicializar la DB antes de iniciar el servidor:', err);
          reject(err);
        });
      } else {
        tryStartServer(PORT);
      }

    } catch (error) {
      reject(error);
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    server?.close();
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  server?.close();
});

process.on('SIGTERM', () => {
  server?.close();
  app.quit();
});

process.on('SIGINT', () => {
  server?.close();
  app.quit();
});