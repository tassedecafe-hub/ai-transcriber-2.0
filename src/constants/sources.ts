import type { SourceOption } from '@/types';

export const SOURCE_OPTIONS: SourceOption[] = [
  {
    id: 'microphone',
    label: 'Микрофон',
    description: 'Запись с микрофона',
    icon: 'mic',
  },
  {
    id: 'system',
    label: 'Системный звук',
    description: 'Захват системного аудио',
    icon: 'speaker',
  },
  {
    id: 'audio-file',
    label: 'Аудиофайл',
    description: 'MP3, WAV, FLAC и др.',
    icon: 'audio',
  },
  {
    id: 'video-file',
    label: 'Видеофайл',
    description: 'MP4, MKV, AVI и др.',
    icon: 'video',
  },
];

export const STATUS_COLORS: Record<string, string> = {
  idle: 'bg-emerald-500',
  recording: 'bg-red-500',
  processing: 'bg-amber-500',
  paused: 'bg-slate-400',
};
