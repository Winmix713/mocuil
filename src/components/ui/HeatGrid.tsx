type HeatGridProps = {
  values?: number[];
  cols?: number;
  rows?: number;
  cellClass?: string;
  className?: string;
};

function generateValues(count: number): number[] {
  const v: number[] = [];
  for (let i = 0; i < count; i++) {
    v.push(Math.random());
  }
  return v;
}

export function HeatGrid({ values, cols = 8, rows = 5, cellClass = 'w-4 h-4 sm:w-5 sm:h-5', className = '' }: HeatGridProps) {
  const data = values ?? generateValues(cols * rows);

  return (
    <div className={`grid gap-1.5 ${className}`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {data.map((v, i) => {
        let bg = 'rgba(255,255,255,0.05)';
        if (v > 0.75) bg = 'rgba(163,230,53,0.85)';
        else if (v > 0.5) bg = 'rgba(163,230,53,0.4)';
        else if (v > 0.25) bg = 'rgba(163,230,53,0.15)';
        return (
          <div
            key={i}
            className={`${cellClass} rounded animate-scale-in`}
            style={{ background: bg, animationDelay: `${i * 15}ms` }}
          />
        );
      })}
    </div>
  );
}
