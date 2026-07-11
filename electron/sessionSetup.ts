/**
 * Общая настройка Electron-сессии: разрешения, захват экрана/звука.
 * Используется в electron/main.ts и start.js.
 */

import { app, session, desktopCapturer } from 'electron';

/** Флаги командной строки для медиа и распознавания речи. */
export function applyCommandLineSwitches(): void {
  app.commandLine.appendSwitch('enable-usermedia-screen-capturing');
  app.commandLine.appendSwitch(
    'enable-features',
    'WebRtcCapture,WebSpeechRecognition,WebSpeechRecognitionOnDevice',
  );
}

const MEDIA_PERMISSIONS = new Set(['media', 'audioCapture', 'display-capture', 'mediaKeySystem']);

/** Разрешения на микрофон, камеру и захват экрана. */
export function setupPermissionHandlers(): void {
  const ses = session.defaultSession;

  ses.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(MEDIA_PERMISSIONS.has(permission));
  });

  ses.setPermissionCheckHandler((_webContents, permission) => {
    return MEDIA_PERMISSIONS.has(permission);
  });
}

/** Обработчик getDisplayMedia для захвата системного звука. */
export function setupDisplayMediaHandler(): void {
  session.defaultSession.setDisplayMediaRequestHandler(
    (_request, callback) => {
      desktopCapturer
        .getSources({ types: ['screen', 'window'] })
        .then((sources) => {
          if (sources.length === 0) {
            callback({});
            return;
          }

          // loopback — системный звук (Windows/macOS)
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

/** Полная инициализация медиа-окружения Electron. */
export function setupElectronMedia(): void {
  setupPermissionHandlers();
  setupDisplayMediaHandler();
}
