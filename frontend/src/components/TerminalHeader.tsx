export function TerminalHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="terminal-window overflow-hidden">
      <div className="terminal-header">
        <div className="terminal-dot red" />
        <div className="terminal-dot yellow" />
        <div className="terminal-dot green" />
        <span className="ml-3 text-xs text-terminal-muted font-mono">{title}</span>
      </div>
      {subtitle && (
        <div className="px-4 py-2 border-b border-terminal-border/50 bg-terminal-gray/20">
          <p className="text-xs text-terminal-cyan/70 font-mono">$ {subtitle}</p>
        </div>
      )}
    </div>
  );
}
