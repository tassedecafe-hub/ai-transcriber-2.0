/**
 * Утилиты для Web Speech API и доступа к микрофону.
 */

export type SpeechRecognitionCtor = new () => SpeechRecognition;

/** Проверяет доступность Web Speech API в текущем окружении. */
export function getSpeechRecognitionConstructor(): SpeechRecognitionCtor | null {
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

/** Запрашивает доступ к микрофону — обязательный шаг перед Speech Recognition. */
export async function requestMicrophoneStream(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });
}

/** Ошибки, при которых запись нужно остановить. */
const FATAL_SPEECH_ERRORS = new Set([
  'not-allowed',
  'service-not-allowed',
  'audio-capture',
  'network',
]);

/** Ошибки, которые можно игнорировать (нет речи, прервано и т.д.). */
const IGNORABLE_SPEECH_ERRORS = new Set(['no-speech', 'aborted']);

export function isFatalSpeechError(error: string): boolean {
  return FATAL_SPEECH_ERRORS.has(error);
}

export function isIgnorableSpeechError(error: string): boolean {
  return IGNORABLE_SPEECH_ERRORS.has(error);
}

export function getSpeechErrorMessage(error: string): string {
  switch (error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Доступ к микрофону запрещён. Разрешите доступ в настройках системы и приложения.';
    case 'audio-capture':
      return 'Не удалось захватить аудио с микрофона. Проверьте, что микрофон подключён и не занят другим приложением.';
    case 'network':
      return 'Для распознавания речи нужен доступ в интернет (Web Speech API использует облачный сервис Google).';
    default:
      return `Ошибка распознавания речи: ${error}`;
  }
}

/** Создаёт и настраивает экземпляр SpeechRecognition. */
export function createSpeechRecognition(lang = 'ru-RU'): SpeechRecognition {
  const Ctor = getSpeechRecognitionConstructor();
  if (!Ctor) {
    throw new Error('Web Speech API не поддерживается в этом браузере.');
  }

  const recognition = new Ctor();
  recognition.lang = lang;
  recognition.interimResults = true;
  recognition.continuous = true;
  recognition.maxAlternatives = 1;
  return recognition;
}

/** Определяет, запущено ли приложение в Electron. */
export function isElectron(): boolean {
  return typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('electron');
}
