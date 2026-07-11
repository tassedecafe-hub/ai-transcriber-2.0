import type { AudioSource } from '@/types';
import { SOURCE_OPTIONS } from '@/constants/sources';
import { Panel } from '@/components/ui/Panel';
import { SourceIcon } from '@/components/ui/Icons';

interface SourceSelectorProps {
  selected: AudioSource;
  onSelect: (source: AudioSource) => void;
  disabled?: boolean;
}

export function SourceSelector({ selected, onSelect, disabled = false }: SourceSelectorProps) {
  return (
    <Panel title="Источник" className="w-64 shrink-0">
      <nav className="flex flex-col gap-1 p-3">
        {SOURCE_OPTIONS.map((option) => {
          const isActive = selected === option.id;

          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(option.id)}
              className={`group flex items-start gap-3 rounded-lg px-3 py-3 text-left transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${
                isActive
                  ? 'bg-accent-light text-accent shadow-sm ring-1 ring-accent/20'
                  : 'text-text-secondary hover:bg-surface-tertiary hover:text-text-primary'
              }`}
            >
              <span
                className={`mt-0.5 shrink-0 transition-colors ${
                  isActive ? 'text-accent' : 'text-text-muted group-hover:text-text-secondary'
                }`}
              >
                <SourceIcon type={option.icon} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">{option.label}</span>
                <span className="mt-0.5 block text-xs text-text-muted">{option.description}</span>
              </span>
            </button>
          );
        })}
      </nav>
    </Panel>
  );
}
