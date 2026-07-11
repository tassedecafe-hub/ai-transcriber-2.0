import { useTranscriber } from '@/hooks/useTranscriber';
import { SourceSelector } from '@/components/SourceSelector';
import { TranscriptionArea } from '@/components/TranscriptionArea';
import { ControlPanel } from '@/components/ControlPanel';
import { InfoPanel } from '@/components/InfoPanel';

export default function App() {
  const {
    source,
    setSource,
    status,
    statusLabel,
    transcription,
    setTranscription,
    selectedFile,
    recordingTime,
    stats,
    startRecording,
    stopRecording,
    selectFile,
    copyTranscription,
    clearTranscription,
    downloadTranscription,
    saveSystemAudioFile,
    systemAudio,
    isRecording,
    isProcessing,
    canSelectFile,
  } = useTranscriber();

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-surface px-6 py-4 shadow-panel">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-text-primary">AI Transcriber</h1>
            <p className="text-xs text-text-muted">v2.0</p>
          </div>
        </div>
        <span className="rounded-full bg-accent-light px-3 py-1 text-xs font-medium text-accent">
          Каркас приложения
        </span>
      </header>

      <main className="flex flex-1 gap-4 overflow-hidden p-4">
        <SourceSelector
          selected={source}
          onSelect={setSource}
          disabled={isRecording || isProcessing}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <TranscriptionArea
            value={transcription}
            onChange={setTranscription}
            isRecording={isRecording}
            isProcessing={isProcessing}
            selectedFile={selectedFile}
          />
          <ControlPanel
            isRecording={isRecording}
            isProcessing={isProcessing}
            canSelectFile={canSelectFile}
            hasTranscription={transcription.length > 0}
            canSaveSystemAudio={systemAudio.hasRecording}
            onStart={startRecording}
            onStop={stopRecording}
            onSelectFile={selectFile}
            onCopy={copyTranscription}
            onClear={clearTranscription}
            onDownload={downloadTranscription}
            onSaveSystemAudio={saveSystemAudioFile}
          />
        </div>

        <InfoPanel
          status={status}
          statusLabel={statusLabel}
          recordingTime={recordingTime}
          stats={stats}
          systemAudio={systemAudio}
        />
      </main>
    </div>
  );
}
