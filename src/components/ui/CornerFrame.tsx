type CornerFrameProps = {
  children: React.ReactNode;
  className?: string;
  corners?: 'all' | 'tl-br' | 'tr-bl';
};

export function CornerFrame({ children, className = '', corners = 'tl-br' }: CornerFrameProps) {
  const cornerClass = corners === 'all'
    ? 'before:!border-t-2 before:!border-l-2 after:!border-b-2 after:!border-r-2'
    : '';

  const extraCorners = corners === 'all' ? (
    <>
      <span className="absolute -top-px -right-px w-5 h-5 pointer-events-none" style={{ borderTop: '2px solid #a3e635', borderRight: '2px solid #a3e635' }} />
      <span className="absolute -bottom-px -left-px w-5 h-5 pointer-events-none" style={{ borderBottom: '2px solid #a3e635', borderLeft: '2px solid #a3e635' }} />
    </>
  ) : null;

  return (
    <div className={`corner-frame ${cornerClass} ${className}`}>
      {extraCorners}
      {children}
    </div>
  );
}
