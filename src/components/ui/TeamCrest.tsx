import type { Team } from '@/types';

type TeamCrestProps = {
  team: Team;
  size?: 'sm' | 'md' | 'lg';
};

export function TeamCrest({ team, size = 'md' }: TeamCrestProps) {
  const dims = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-14 h-14 text-sm',
  };

  return (
    <div
      className={`${dims[size]} rounded-lg grid place-items-center font-mono font-semibold shrink-0`}
      style={{
        background: `linear-gradient(135deg, ${team.color1}, ${team.color2})`,
        boxShadow: `0 2px 12px ${team.color1}40`,
      }}
    >
      <span className="drop-shadow-md">{team.short}</span>
    </div>
  );
}
