import { Button } from '@/components/ui/Button';
import {
  PlayIcon,
  StopIcon,
  FileIcon,
  CopyIcon,
  TrashIcon,
  DownloadIcon,
} from '@/components/ui/Icons';

interface ControlPanelProps {
  isRecording: boolean;
  isProcessing: boolean;
  canSelectFile: boolean;
  hasTranscription: boolean;
  canSaveSystemAudio: boolean;
  onStart: () => void;
  onStop: () => void;
  onSelectFile: () => void;
  onCopy: () => void;
  onClear: () => void;
  onDownload: () => void;
  onSaveSystemAudio: () => void;
}

export function ControlPanel({
  isRecording,
  isProcessing,
  canSelectFile,
  hasTranscription,
  canSaveSystemAudio,
  onStart,
  onStop,
  onSelectFile,
  onCopy,
  onClear,
  onDownload,
  onSaveSystemAudio,
}: ControlPanelProps) {
  const isBusy = isRecording || isProcessing;

  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 shadow-panel">
      <div className="flex items-center gap-2">
        <Button
          variant="primary"
          icon={<PlayIcon />}
          onClick={onStart}
          disabled={isBusy}
        >
          Начать
        </Button>
        <Button
          variant="danger"
          icon={<StopIcon />}
          onClick={onStop}
          disabled={!isRecording}
        >
          Остановить
        </Button>
      </div>

      <div className="mx-2 h-6 w-px bg-border" />

      <div className="flex flex-1 items-center gap-2">
        <Button
          variant="secondary"
          icon={<FileIcon />}
          onClick={onSelectFile}
          disabled={!canSelectFile || isBusy}
        >
          Выбрать файл
        </Button>
        <Button
          variant="secondary"
          icon={<CopyIcon />}
          onClick={onCopy}
          disabled={!hasTranscription}
        >
          Копировать
        </Button>
        <Button
          variant="ghost"
          icon={<TrashIcon />}
          onClick={onClear}
          disabled={(!hasTranscription && !isBusy) || isProcessing}
        >
          Очистить
        </Button>
        <Button
          variant="secondary"
          icon={<DownloadIcon />}
          onClick={onDownload}
          disabled={!hasTranscription}
        >
          Скачать TXT
        </Button>
        {canSaveSystemAudio && (
          <Button
            variant="secondary"
            icon={<DownloadIcon />}
            onClick={onSaveSystemAudio}
          >
            Скачать аудио
          </Button>
        )}
      </div>
    </div>
  );
}
