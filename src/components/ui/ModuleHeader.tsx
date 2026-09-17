type ModuleHeaderProps = {
  number: string;
  title: string;
  meta?: string;
};

export function ModuleHeader({ number, title, meta }: ModuleHeaderProps) {
  return (
    <div className="flex items-center justify-between px-5 sm:px-8 py-3 border-b border-white/[0.08]">
      <p className="text-xs uppercase tracking-[0.3em] text-neutral-500 font-mono">
        Module {number} · {title}
      </p>
      {meta && (
        <p className="text-xs text-neutral-600 tracking-widest hidden sm:block font-mono">{meta}</p>
      )}
    </div>
  );
}

type SectionLabelProps = {
  children: React.ReactNode;
  className?: string;
};

export function SectionLabel({ children, className = '' }: SectionLabelProps) {
  return (
    <p className={`text-xs uppercase tracking-[0.3em] font-mono text-lime ${className}`}>
      {children}
    </p>
  );
}
