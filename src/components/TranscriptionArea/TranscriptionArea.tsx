import { WaveformIcon } from '@/components/ui/Icons';

interface TranscriptionAreaProps {
  value: string;
  onChange: (value: string) => void;
  isRecording: boolean;
  isProcessing: boolean;
  selectedFile: string | null;
}

function getFileName(filePath: string): string {
  return filePath.split(/[\\/]/).pop() ?? filePath;
}

export function TranscriptionArea({
  value,
  onChange,
  isRecording,
  isProcessing,
  selectedFile,
}: TranscriptionAreaProps) {
  const isEmpty = !value.trim();
  const isBusy = isRecording || isProcessing;

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-panel">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-text-primary">Транскрипция</h2>
        {selectedFile && (
          <span className="max-w-xs truncate text-xs text-text-muted" title={selectedFile}>
            {getFileName(selectedFile)}
          </span>
        )}
      </div>

      <div className="relative flex flex-1 flex-col overflow-hidden">
        {isEmpty && !isBusy && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-text-muted">
            <WaveformIcon className="opacity-30" />
            <p className="text-sm">Текст транскрипции появится здесь</p>
            <p className="text-xs opacity-70">Выберите источник и нажмите «Начать»</p>
          </div>
        )}

        {isProcessing && (
          <div className="pointer-events-none absolute inset-x-0 top-4 flex items-center justify-center gap-2">
            <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-amber-500" />
            <span className="text-sm text-text-muted">Распознавание речи...</span>
          </div>
        )}

        {isRecording && isEmpty && !isProcessing && (
          <div className="pointer-events-none absolute inset-x-0 top-4 flex items-center justify-center gap-2">
            <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-red-500" />
            <span className="text-sm text-text-muted">Идёт запись...</span>
          </div>
        )}

        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder=""
          className="h-full w-full flex-1 resize-none bg-transparent px-5 py-4 text-base leading-relaxed text-text-primary outline-none"
          spellCheck={false}
          readOnly={isProcessing}
        />
      </div>
    </div>
  );
}
