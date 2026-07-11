/**
 * Утилиты для захвата системного аудио через getDisplayMedia.
 */

import { disableVideoTracks, isElectron } from '@/utils/mediaRecorder';

/** Запрашивает захват экрана/окна с системным аудио. */
export async function captureSystemAudioStream(): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
    video: true,
  });

  const audioTracks = stream.getAudioTracks();
  if (audioTracks.length === 0) {
    stream.getTracks().forEach((track) => track.stop());
    throw new Error(
      'Аудиодорожка не выбрана. При выборе источника включите «Поделиться системным звуком».',
    );
  }

  // В Electron отключаем видео (не stop!) — иначе ломается loopback.
  // В Chrome видеодорожка должна оставаться в потоке для MediaRecorder (video/webm).
  if (isElectron()) {
    disableVideoTracks(stream);
  }

  return stream;
}

/** Обработчик завершения захвата — пользователь нажал «Прекратить показ» в браузере. */
export function onDisplayStreamEnded(stream: MediaStream, callback: () => void): void {
  const videoTrack = stream.getVideoTracks()[0];
  const audioTrack = stream.getAudioTracks()[0];

  const handleEnded = () => callback();

  videoTrack?.addEventListener('ended', handleEnded);
  audioTrack?.addEventListener('ended', handleEnded);
}
