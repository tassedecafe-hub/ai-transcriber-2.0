/**
 * Быстрый запуск Electron для разработки (npm run electron:start).
 * Настройки медиа и разрешений синхронизированы с electron/main.ts.
 */
const { app, BrowserWindow, session, desktopCapturer } = require('electron');
const path = require('path');

// --- Флаги для Web Speech API и захвата медиа ---
app.commandLine.appendSwitch('enable-usermedia-screen-capturing');
app.commandLine.appendSwitch(
  'enable-features',
  'WebRtcCapture,WebSpeechRecognition,WebSpeechRecognitionOnDevice',
);

const MEDIA_PERMISSIONS = new Set(['media', 'audioCapture', 'display-capture', 'mediaKeySystem']);

function setupSession() {
  const ses = session.defaultSession;

  ses.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(MEDIA_PERMISSIONS.has(permission));
  });

  ses.setPermissionCheckHandler((_wc, permission) => {
    return MEDIA_PERMISSIONS.has(permission);
  });

  ses.setDisplayMediaRequestHandler(
    (_request, callback) => {
      desktopCapturer
        .getSources({ types: ['screen', 'window'] })
        .then((sources) => {
          if (sources.length === 0) {
            callback({});
            return;
          }
          callback({ video: sources[0], audio: 'loopback' });
        })
        .catch((err) => {
          console.error('desktopCapturer error:', err);
          callback({});
        });
    },
    { useSystemPicker: true },
  );
}

function createWindow() {
  const preloadPath = path.join(__dirname, 'dist-electron', 'preload.mjs');

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      preload: preloadPath,
    },
  });

  win.loadURL('http://localhost:5173');
  win.webContents.openDevTools({ mode: 'detach' });
}

app.whenReady().then(() => {
  setupSession();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
