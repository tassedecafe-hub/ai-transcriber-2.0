export interface FileFilter {
  name: string;
  extensions: string[];
}

export type AudioSource = 'microphone' | 'system' | 'audio-file' | 'video-file';

export type AppStatus = 'idle' | 'recording' | 'processing' | 'paused';

export interface TranscriptionStats {
  wordCount: number;
  charCount: number;
}

export interface SystemAudioState {
  /** Идёт ли запись системного звука */
  isRecording: boolean;
  /** Имя последнего сохранённого аудиофайла */
  savedFileName: string | null;
  /** Есть ли несохранённая запись (Blob доступен для повторного скачивания) */
  hasRecording: boolean;
}

export interface SourceOption {
  id: AudioSource;
  label: string;
  description: string;
  icon: string;
}

export interface StatusInfo {
  status: AppStatus;
  label: string;
  color: string;
}
