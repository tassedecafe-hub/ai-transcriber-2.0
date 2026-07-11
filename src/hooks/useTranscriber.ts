import { useState, useCallback, useEffect, useRef } from 'react';
import type { AppStatus, AudioSource, FileFilter, TranscriptionStats, SystemAudioState } from '@/types';
import { captureSystemAudioStream, onDisplayStreamEnded } from '@/utils/audioCapture';
import {
  startMediaRecorder,
  getExtensionFromMimeType,
  downloadBlob,
  buildSystemAudioFileName,
  stopMediaStream,
} from '@/utils/mediaRecorder';
import { transcribeWithGroq } from '@/services/groqTranscription';
import {
  createSpeechRecognition,
  getSpeechErrorMessage,
  getSpeechRecognitionConstructor,
  isFatalSpeechError,
  isIgnorableSpeechError,
  requestMicrophoneStream,
} from '@/utils/speechRecognition';

const STATUS_LABELS: Record<AppStatus, string> = {
  idle: 'Готов',
  recording: 'Запись',
  processing: 'Обработка',
  paused: 'Пауза',
};

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return [hrs, mins, secs].map((v) => String(v).padStart(2, '0')).join(':');
}

function selectFileViaInput(accept: string): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = () => {
      const file = input.files?.[0];
      resolve(file ? file.name : null);
    };
    input.click();
  });
}

function downloadTextFile(content: string, fileName: string): void {
  downloadBlob(new Blob([content], { type: 'text/plain;charset=utf-8' }), fileName);
}

export function useTranscriber() {
  const [source, setSource] = useState<AudioSource>('microphone');
  const [status, setStatus] = useState<AppStatus>('idle');
  const [transcription, setTranscription] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [systemAudioSavedFileName, setSystemAudioSavedFileName] = useState<string | null>(null);
  const [hasSystemAudioRecording, setHasSystemAudioRecording] = useState(false);

  // --- Микрофон ---
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const finalTranscriptRef = useRef('');

  // --- Системный звук ---
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const systemAudioBlobRef = useRef<Blob | null>(null);
  const recordingMimeTypeRef = useRef('audio/webm');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRecordingRef = useRef(false);
  const recordingTimeRef = useRef(0);
  const stopRecordingRef = useRef<() => void>(() => {});

  const startTimer = useCallback(() => {
    setRecordingTime(0);
    recordingTimeRef.current = 0;
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => {
        const next = prev + 1;
        recordingTimeRef.current = next;
        return next;
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const cleanupMicResources = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onend = null;
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    stopMediaStream(micStreamRef.current);
    micStreamRef.current = null;
  }, []);

  const cleanupSystemResources = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    mediaRecorderRef.current = null;
    stopMediaStream(displayStreamRef.current);
    displayStreamRef.current = null;
    audioChunksRef.current = [];
  }, []);

  /** Запуск распознавания речи с микрофона (getUserMedia + Web Speech API). */
  const startMicrophoneRecording = useCallback(async () => {
    if (!getSpeechRecognitionConstructor()) {
      alert('Web Speech API не поддерживается. Используйте Chrome, Edge или Electron.');
      return;
    }

    try {
      // Шаг 1: явный запрос доступа к микрофону (обязателен для Electron)
      const micStream = await requestMicrophoneStream();
      micStreamRef.current = micStream;

      // Шаг 2: инициализация Speech Recognition
      const recognition = createSpeechRecognition('ru-RU');
      recognitionRef.current = recognition;
      finalTranscriptRef.current = '';
      setTranscription('🎤 Слушаю... говорите в микрофон.');

      recognition.onresult = (event) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript + ' ';
          } else {
            interim += transcript;
          }
        }

        if (final) {
          finalTranscriptRef.current += final;
        }

        const combined = (finalTranscriptRef.current + interim).trim();
        if (combined) {
          setTranscription(combined);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);

        if (isIgnorableSpeechError(event.error)) {
          return;
        }

        if (isFatalSpeechError(event.error)) {
          alert(getSpeechErrorMessage(event.error));
          stopRecordingRef.current();
        }
      };

      recognition.onend = () => {
        // Перезапуск для непрерывного распознавания
        if (isRecordingRef.current && recognitionRef.current) {
          window.setTimeout(() => {
            if (!isRecordingRef.current || !recognitionRef.current) return;
            try {
              recognitionRef.current.start();
            } catch {
              // уже запущен
            }
          }, 300);
        }
      };

      recognition.start();
      isRecordingRef.current = true;
      setStatus('recording');
      startTimer();
    } catch (err) {
      console.error('Microphone start error:', err);
      cleanupMicResources();

      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        alert('Доступ к микрофону запрещён. Разрешите доступ в настройках.');
      } else {
        alert('Не удалось запустить микрофон. Проверьте подключение устройства.');
      }
      setStatus('idle');
    }
  }, [startTimer, cleanupMicResources]);

  /** Запуск MediaRecorder для системного звука. */
  const startSystemMediaRecorder = useCallback((stream: MediaStream) => {
    audioChunksRef.current = [];

    const { recorder, mimeType } = startMediaRecorder(
      stream,
      {
        onDataAvailable: (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        },
        onError: (event) => {
          console.error('MediaRecorder error:', event);
        },
      },
      1000,
    );

    recordingMimeTypeRef.current = mimeType;
    mediaRecorderRef.current = recorder;
  }, []);

  /** Запуск захвата системного звука через getDisplayMedia + MediaRecorder. */
  const startSystemAudioRecording = useCallback(async () => {
    try {
      const stream = await captureSystemAudioStream();
      displayStreamRef.current = stream;

      // Если пользователь нажал «Прекратить показ» в Chrome/Electron
      onDisplayStreamEnded(stream, () => {
        if (isRecordingRef.current) {
          stopRecordingRef.current();
        }
      });

      startSystemMediaRecorder(stream);

      isRecordingRef.current = true;
      setStatus('recording');
      setSystemAudioSavedFileName(null);
      setTranscription(
        '🔴 Запись системного звука...\n\nВыберите экран/окно и включите «Поделиться системным звуком».',
      );
      startTimer();
    } catch (err) {
      console.error('System audio capture error:', err);

      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        alert('Захват экрана отменён или запрещён.');
      } else {
        const message =
          err instanceof Error ? err.message : 'Не удалось начать захват системного звука.';
        alert(message);
      }

      cleanupSystemResources();
      setStatus('idle');
    }
  }, [startTimer, startSystemMediaRecorder, cleanupSystemResources]);

  const startRecording = useCallback(() => {
    if (status === 'recording' || status === 'processing') return;

    if (source === 'microphone') {
      void startMicrophoneRecording();
    } else if (source === 'system') {
      void startSystemAudioRecording();
    } else {
      alert('Для этого источника сначала выберите файл.');
    }
  }, [source, status, startMicrophoneRecording, startSystemAudioRecording]);

  /** Финализирует запись системного звука и сохраняет файл. */
  const finalizeSystemAudio = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;

      if (!recorder || recorder.state === 'inactive') {
        resolve();
        return;
      }

      recorder.onstop = () => {
        void (async () => {
          const mimeType = recordingMimeTypeRef.current || recorder.mimeType || 'audio/webm';
          const blob = new Blob(audioChunksRef.current, { type: mimeType });
          systemAudioBlobRef.current = blob;

          const fileName = buildSystemAudioFileName(getExtensionFromMimeType(mimeType));
          downloadBlob(blob, fileName);

          setSystemAudioSavedFileName(fileName);
          setHasSystemAudioRecording(true);

          setTranscription('⏳ Отправка на распознавание...');

          try {
            const text = await transcribeWithGroq(blob);
            finalTranscriptRef.current = text;
            setTranscription(text);
          } catch (err) {
            console.error('Ошибка транскрипции:', err);
            const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
            setTranscription(`❌ Ошибка распознавания: ${errorMessage}`);
          }

          audioChunksRef.current = [];
          resolve();
        })();
      };

      try {
        recorder.stop();
      } catch {
        resolve();
      }
    });
  }, []);

  const stopRecording = useCallback(() => {
    if (status !== 'recording') return;

    isRecordingRef.current = false;
    stopTimer();

    // --- Остановка микрофона ---
    if (recognitionRef.current || micStreamRef.current) {
      cleanupMicResources();
      if (finalTranscriptRef.current) {
        setTranscription(finalTranscriptRef.current.trim());
      }
      setStatus('idle');
      return;
    }

    // --- Остановка системного звука ---
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      setStatus('processing');
      void finalizeSystemAudio().then(() => {
        stopMediaStream(displayStreamRef.current);
        displayStreamRef.current = null;
        mediaRecorderRef.current = null;
        setStatus('idle');
      });
      return;
    }

    stopMediaStream(displayStreamRef.current);
    displayStreamRef.current = null;
    setStatus('idle');
  }, [status, stopTimer, cleanupMicResources, finalizeSystemAudio]);

  stopRecordingRef.current = stopRecording;

  const saveSystemAudioFile = useCallback(() => {
    const blob = systemAudioBlobRef.current;
    if (!blob) return;

    const fileName =
      systemAudioSavedFileName ??
      buildSystemAudioFileName(getExtensionFromMimeType(recordingMimeTypeRef.current));

    downloadBlob(blob, fileName);
  }, [systemAudioSavedFileName]);

  const selectFile = useCallback(async () => {
    const isElectronEnv = typeof window.electronAPI !== 'undefined';
    let filePath: string | null = null;

    if (isElectronEnv) {
      const isVideo = source === 'video-file';
      const filters: FileFilter[] = isVideo
        ? [{ name: 'Video Files', extensions: ['mp4', 'mkv', 'avi', 'mov', 'webm'] }]
        : [{ name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'] }];
      filePath = await window.electronAPI.openFile(filters);
    } else {
      const accept = source === 'video-file' ? 'video/*' : 'audio/*';
      filePath = await selectFileViaInput(accept);
    }

    if (filePath) {
      setSelectedFile(filePath);
      setStatus('idle');
      setTranscription('Файл выбран. Для транскрипции аудио/видео нужен внешний API.');
    }
  }, [source]);

  const copyTranscription = useCallback(async () => {
    if (!transcription) return;
    try {
      await navigator.clipboard.writeText(transcription);
    } catch (err) {
      console.error('Copy error:', err);
    }
  }, [transcription]);

  const clearTranscription = useCallback(() => {
    isRecordingRef.current = false;
    stopTimer();
    cleanupMicResources();
    cleanupSystemResources();

    setTranscription('');
    setSelectedFile(null);
    setRecordingTime(0);
    setStatus('idle');
    setSystemAudioSavedFileName(null);
    setHasSystemAudioRecording(false);
    finalTranscriptRef.current = '';
    systemAudioBlobRef.current = null;
  }, [stopTimer, cleanupMicResources, cleanupSystemResources]);

  const downloadTranscription = useCallback(() => {
    if (!transcription) return;
    const timestamp = new Date().toISOString().slice(0, 10);
    const fileName = `transcription-${timestamp}.txt`;

    if (typeof window.electronAPI !== 'undefined') {
      void window.electronAPI.saveFile(fileName, transcription);
    } else {
      downloadTextFile(transcription, fileName);
    }
  }, [transcription]);

  useEffect(() => {
    return () => {
      isRecordingRef.current = false;
      stopTimer();
      cleanupMicResources();
      cleanupSystemResources();
    };
  }, [stopTimer, cleanupMicResources, cleanupSystemResources]);

  const stats: TranscriptionStats = {
    wordCount: countWords(transcription),
    charCount: transcription.length,
  };

  const systemAudio: SystemAudioState = {
    isRecording: source === 'system' && status === 'recording',
    savedFileName: systemAudioSavedFileName,
    hasRecording: hasSystemAudioRecording,
  };

  return {
    source,
    setSource,
    status,
    statusLabel: STATUS_LABELS[status],
    transcription,
    setTranscription,
    selectedFile,
    recordingTime: formatTime(recordingTime),
    stats,
    systemAudio,
    startRecording,
    stopRecording,
    selectFile,
    copyTranscription,
    clearTranscription,
    downloadTranscription,
    saveSystemAudioFile,
    isRecording: status === 'recording',
    isProcessing: status === 'processing',
    canSelectFile: source === 'audio-file' || source === 'video-file',
  };
}
