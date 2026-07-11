/**
 * Утилиты для MediaRecorder с автоподбором MIME-типа под состав потока.
 */

/** Поток содержит видеодорожку (getDisplayMedia) — нужен video/* MIME. */
function hasVideoTrack(stream: MediaStream): boolean {
  return stream.getVideoTracks().length > 0;
}

/** Кандидаты MIME-типов в порядке приоритета для конкретного потока. */
export function getMimeTypeCandidatesForStream(stream: MediaStream): string[] {
  if (hasVideoTrack(stream)) {
    // Chrome: display capture с видеодорожкой требует video/webm, audio/webm не запустится
    return [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4;codecs=avc1,mp4a.40.2',
      'video/mp4',
    ];
  }

  return [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
}

/** Первый поддерживаемый MIME-тип для потока. */
export function getSupportedMimeTypeForStream(stream: MediaStream): string {
  for (const mimeType of getMimeTypeCandidatesForStream(stream)) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }
  return '';
}

/** @deprecated Используйте getSupportedMimeTypeForStream для display capture. */
export function getSupportedAudioMimeType(): string {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
  for (const mimeType of candidates) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }
  return '';
}

/**
 * Создаёт MediaRecorder, перебирая MIME-типы пока конструктор не примет поток.
 */
export function createMediaRecorder(stream: MediaStream, preferredMimeType?: string): MediaRecorder {
  const candidates = preferredMimeType
    ? [preferredMimeType, ...getMimeTypeCandidatesForStream(stream)]
    : getMimeTypeCandidatesForStream(stream);

  const uniqueCandidates = [...new Set(candidates.filter(Boolean))];

  for (const mimeType of uniqueCandidates) {
    if (!MediaRecorder.isTypeSupported(mimeType)) continue;
    try {
      return new MediaRecorder(stream, { mimeType });
    } catch {
      // пробуем следующий
    }
  }

  return new MediaRecorder(stream);
}

/**
 * Запускает MediaRecorder с fallback по MIME-типам.
 * Бросает ошибку, если ни одна конфигурация не сработала.
 */
export function startMediaRecorder(
  stream: MediaStream,
  handlers: {
    onDataAvailable: (event: BlobEvent) => void;
    onError?: (event: Event) => void;
  },
  timesliceMs = 1000,
): { recorder: MediaRecorder; mimeType: string } {
  const candidates = [...getMimeTypeCandidatesForStream(stream), ''];

  for (const mimeType of candidates) {
    if (mimeType && !MediaRecorder.isTypeSupported(mimeType)) continue;

    try {
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorder.ondataavailable = handlers.onDataAvailable;
      if (handlers.onError) recorder.onerror = handlers.onError;

      recorder.start(timesliceMs);

      return {
        recorder,
        mimeType: recorder.mimeType || mimeType || 'video/webm',
      };
    } catch {
      // пробуем следующий MIME-тип
    }
  }

  throw new Error(
    'MediaRecorder не может записать этот поток. Попробуйте другой источник или браузер Chrome/Edge.',
  );
}

export function getExtensionFromMimeType(mimeType: string): string {
  if (mimeType.includes('mp4')) return 'mp4';
  if (mimeType.includes('ogg')) return 'ogg';
  return 'webm';
}

export function buildSystemAudioFileName(extension: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `system-audio-${timestamp}.${extension}`;
}

export function buildMicrophoneAudioFileName(extension: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `microphone-${timestamp}.${extension}`;
}

/** Скачивает Blob через браузерный API (работает и в Electron). */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

/** Останавливает все дорожки потока. */
export function stopMediaStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}

/** Отключает видеодорожки, не прерывая аудиосессию (важно для Electron). */
export function disableVideoTracks(stream: MediaStream): void {
  stream.getVideoTracks().forEach((track) => {
    track.enabled = false;
  });
}

/** Определяет, запущено ли приложение в Electron. */
export function isElectron(): boolean {
  return typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('electron');
}
