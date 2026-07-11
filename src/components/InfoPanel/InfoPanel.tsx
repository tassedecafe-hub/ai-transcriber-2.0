import type { AppStatus, TranscriptionStats, SystemAudioState } from '@/types';
import { STATUS_COLORS } from '@/constants/sources';
import { Panel } from '@/components/ui/Panel';

interface InfoPanelProps {
  status: AppStatus;
  statusLabel: string;
  recordingTime: string;
  stats: TranscriptionStats;
  systemAudio: SystemAudioState;
}

interface StatItemProps {
  label: string;
  value: string | number;
  highlight?: boolean;
}

function StatItem({ label, value, highlight = false }: StatItemProps) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-text-secondary">{label}</span>
      <span
        className={`text-sm font-semibold tabular-nums ${
          highlight ? 'text-accent' : 'text-text-primary'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export function InfoPanel({ status, statusLabel, recordingTime, stats, systemAudio }: InfoPanelProps) {
  const statusColor = STATUS_COLORS[status] ?? 'bg-slate-400';

  return (
    <Panel title="Информация" className="w-56 shrink-0">
      <div className="flex flex-col gap-1 p-4">
        <div className="mb-3 rounded-lg bg-surface-secondary px-3 py-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">
            Статус
          </p>
          <div className="flex items-center gap-2">
            <span className="relative inline-flex h-2.5 w-2.5">
              {status === 'recording' && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              )}
              <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${statusColor}`} />
            </span>
            <span className="text-sm font-semibold text-text-primary">{statusLabel}</span>
          </div>

          {systemAudio.isRecording && (
            <div className="mt-3 flex items-center gap-2 rounded-md bg-red-50 px-2.5 py-2">
              <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <span className="text-xs font-medium text-red-600">Запись системного звука</span>
            </div>
          )}

          {systemAudio.savedFileName && !systemAudio.isRecording && (
            <p className="mt-2 truncate text-xs text-emerald-600" title={systemAudio.savedFileName}>
              ✓ {systemAudio.savedFileName}
            </p>
          )}
        </div>

        <div className="divide-y divide-border">
          <StatItem label="Время записи" value={recordingTime} highlight={status === 'recording'} />
          <StatItem label="Слов" value={stats.wordCount.toLocaleString('ru-RU')} />
          <StatItem label="Символов" value={stats.charCount.toLocaleString('ru-RU')} />
        </div>
      </div>
    </Panel>
  );
}
