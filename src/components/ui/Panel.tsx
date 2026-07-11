import type { ReactNode } from 'react';

interface PanelProps {
  title: string;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
}

export function Panel({ title, children, className = '', headerAction }: PanelProps) {
  return (
    <aside
      className={`flex flex-col rounded-xl border border-border bg-surface shadow-panel ${className}`}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
        {headerAction}
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    </aside>
  );
}
