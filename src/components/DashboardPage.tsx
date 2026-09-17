import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  Cpu,
  Eraser,
  Loader2,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  X,
  Zap,
} from 'lucide-react';
import { TEAMS, generatePrediction } from '@/data/predictions';
import { TeamCrest } from '@/components/ui/TeamCrest';
import type { Team, MatchPrediction, MatchSlot, Page } from '@/types';

type DashboardPageProps = {
  onNavigate: (page: Page) => void;
  onPredictionsReady: (predictions: MatchPrediction[]) => void;
};

const NUM_SLOTS = 8;
const ENGINE_DELAY = 1800;

const EMPTY_LABELS = {
  home: 'Select home team',
  away: 'Select away team',
} as const;

function createInitialSlots(): MatchSlot[] {
  return Array.from({ length: NUM_SLOTS }, (_, id) => ({
    id,
    home: null,
    away: null,
  }));
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

type TeamDropdownProps = {
  value: Team | null;
  onChange: (team: Team | null) => void;
  excludeIds: Set<string>;
  label: string;
  side: 'home' | 'away';
};

function TeamDropdown({
  value,
  onChange,
  excludeIds,
  label,
  side,
}: TeamDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
    if (!open) setQuery('');
  }, [open]);

  const options = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return TEAMS.filter((team) => {
      if (team.id !== value?.id && excludeIds.has(team.id)) return false;
      if (!normalized) return true;

      return (
        team.name.toLowerCase().includes(normalized) ||
        team.short.toLowerCase().includes(normalized) ||
        team.league.toLowerCase().includes(normalized)
      );
    });
  }, [excludeIds, query, value?.id]);

  return (
    <div ref={rootRef} className="wm-select">
      <button
        type="button"
        className={`wm-select__trigger ${open ? 'is-open' : ''} ${value ? 'has-value' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${side === 'home' ? 'Home' : 'Away'} team`}
        onClick={() => setOpen((current) => !current)}
      >
        {value ? (
          <>
            <TeamCrest team={value} size="sm" />
            <span className="wm-select__value">
              <strong>{value.name}</strong>
              <small>{value.league}</small>
            </span>
          </>
        ) : (
          <>
            <span className="wm-select__empty-icon">
              <Search size={14} />
            </span>
            <span className="wm-select__placeholder">{label}</span>
          </>
        )}

        <ChevronDown
          size={16}
          className={`wm-select__chevron ${open ? 'is-open' : ''}`}
        />
      </button>

      {open && (
        <div className="wm-dropdown" role="dialog" aria-label={`${label} picker`}>
          <div className="wm-dropdown__search">
            <Search size={14} />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search team, league..."
              aria-label="Search teams"
            />
            {query && (
              <button
                type="button"
                className="wm-icon-button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="wm-dropdown__meta">
            <span>{options.length} available</span>
            <span>ENTER to select</span>
          </div>

          <div className="wm-dropdown__list" role="listbox">
            {options.length === 0 ? (
              <div className="wm-dropdown__empty">
                <AlertCircle size={18} />
                <span>No matching teams</span>
              </div>
            ) : (
              options.map((team) => {
                const selected = team.id === value?.id;

                return (
                  <button
                    type="button"
                    key={team.id}
                    className={`wm-team-option ${selected ? 'is-selected' : ''}`}
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      onChange(team);
                      setOpen(false);
                    }}
                  >
                    <TeamCrest team={team} size="sm" />
                    <span className="wm-team-option__copy">
                      <strong>{team.name}</strong>
                      <small>{team.short} · {team.league}</small>
                    </span>
                    {selected && <Check size={16} className="wm-lime" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricBar({ value, muted = false }: { value: number; muted?: boolean }) {
  return (
    <div className="wm-metric-bar" aria-hidden="true">
      <span
        style={{
          width: `${clamp(value) * 100}%`,
          opacity: muted ? 0.42 : 1,
        }}
      />
    </div>
  );
}

function MatchCard({
  slot,
  index,
  allSelectedIds,
  onChange,
  onClear,
}: {
  slot: MatchSlot;
  index: number;
  allSelectedIds: Set<string>;
  onChange: (field: 'home' | 'away', team: Team | null) => void;
  onClear: () => void;
}) {
  const complete = Boolean(slot.home && slot.away);

  const homeExclusions = useMemo(() => {
    const set = new Set(allSelectedIds);
    if (slot.home) set.delete(slot.home.id);
    if (slot.away) set.delete(slot.away.id);
    return set;
  }, [allSelectedIds, slot.away, slot.home]);

  const awayExclusions = useMemo(() => {
    const set = new Set(allSelectedIds);
    if (slot.home) set.delete(slot.home.id);
    if (slot.away) set.delete(slot.away.id);
    return set;
  }, [allSelectedIds, slot.away, slot.home]);

  return (
    <article className={`wm-match-card ${complete ? 'is-complete' : ''}`}>
      <div className="wm-match-card__top">
        <div className="wm-fixture-id">
          <span>{String(index + 1).padStart(2, '0')}</span>
          <small>FIXTURE</small>
        </div>

        <div className="wm-match-status">
          {complete ? (
            <>
              <CheckCircle2 size={14} />
              <span>READY</span>
            </>
          ) : (
            <>
              <span className="wm-status-dot" />
              <span>AWAITING INPUT</span>
            </>
          )}
        </div>

        {(slot.home || slot.away) && (
          <button
            type="button"
            className="wm-clear-row"
            onClick={onClear}
            aria-label={`Clear fixture ${index + 1}`}
            title="Clear fixture"
          >
            <Eraser size={14} />
          </button>
        )}
      </div>

      <div className="wm-match-card__selectors">
        <TeamDropdown
          value={slot.home}
          onChange={(team) => onChange('home', team)}
          excludeIds={homeExclusions}
          label={EMPTY_LABELS.home}
          side="home"
        />

        <div className="wm-vs">
          <span>VS</span>
          <i />
        </div>

        <TeamDropdown
          value={slot.away}
          onChange={(team) => onChange('away', team)}
          excludeIds={awayExclusions}
          label={EMPTY_LABELS.away}
          side="away"
        />
      </div>

      {complete && slot.home && slot.away ? (
        <div className="wm-preview">
          <div className="wm-preview__team">
            <TeamCrest team={slot.home} size="sm" />
            <div>
              <strong>{slot.home.short}</strong>
              <span>xG {slot.home.xg.toFixed(2)}</span>
            </div>
          </div>

          <div className="wm-preview__signal">
            <span>STRENGTH</span>
            <div>
              <MetricBar value={slot.home.strength} />
              <MetricBar value={slot.away.strength} muted />
            </div>
          </div>

          <div className="wm-preview__team wm-preview__team--away">
            <div>
              <strong>{slot.away.short}</strong>
              <span>xG {slot.away.xg.toFixed(2)}</span>
            </div>
            <TeamCrest team={slot.away} size="sm" />
          </div>
        </div>
      ) : (
        <div className="wm-preview wm-preview--empty">
          <Target size={14} />
          <span>Select both sides to unlock the fixture signal</span>
        </div>
      )}
    </article>
  );
}

export function DashboardPage({
  onNavigate,
  onPredictionsReady,
}: DashboardPageProps) {
  const [slots, setSlots] = useState<MatchSlot[]>(createInitialSlots);
  const [running, setRunning] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [activePulse, setActivePulse] = useState(false);
  const engineTimer = useRef<number | null>(null);
  const toastTimer = useRef<number | null>(null);

  const completeCount = useMemo(
    () => slots.filter((slot) => slot.home && slot.away).length,
    [slots],
  );

  const selectedFieldCount = useMemo(
    () => slots.reduce((total, slot) => total + Number(Boolean(slot.home)) + Number(Boolean(slot.away)), 0),
    [slots],
  );

  const progress = completeCount / NUM_SLOTS;
  const isComplete = completeCount === NUM_SLOTS;

  const allSelectedIds = useMemo(() => {
    const ids = new Set<string>();

    slots.forEach((slot) => {
      if (slot.home) ids.add(slot.home.id);
      if (slot.away) ids.add(slot.away.id);
    });

    return ids;
  }, [slots]);

  const notify = useCallback((message: string) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  useEffect(() => {
    return () => {
      if (engineTimer.current) window.clearTimeout(engineTimer.current);
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const updateSlot = useCallback(
    (id: number, field: 'home' | 'away', team: Team | null) => {
      setSlots((current) =>
        current.map((slot) => {
          if (slot.id !== id) return slot;

          const opposite = field === 'home' ? slot.away : slot.home;
          if (team && opposite?.id === team.id) return slot;

          return { ...slot, [field]: team };
        }),
      );
      setActivePulse(true);
      window.setTimeout(() => setActivePulse(false), 260);
    },
    [],
  );

  const clearRow = useCallback((id: number) => {
    setSlots((current) =>
      current.map((slot) =>
        slot.id === id ? { ...slot, home: null, away: null } : slot,
      ),
    );
  }, []);

  const clearAll = useCallback(() => {
    setSlots(createInitialSlots());
    setRunning(false);
    notify('Round cleared · ready for a new slate');
  }, [notify]);

  const runEngine = useCallback(() => {
    if (!isComplete || running) return;

    setRunning(true);
    notify('Neon Engine · analyzing fixture signals');

    engineTimer.current = window.setTimeout(() => {
      const predictions = slots
        .filter((slot): slot is MatchSlot & { home: Team; away: Team } => Boolean(slot.home && slot.away))
        .map((slot) => generatePrediction(slot.id, slot.home, slot.away));

      setRunning(false);
      setToast(null);
      onPredictionsReady(predictions);
      onNavigate('insights');
    }, ENGINE_DELAY);
  }, [isComplete, onNavigate, onPredictionsReady, running, slots, notify]);

  const helperItems = [
    {
      icon: Target,
      eyebrow: '01',
      title: 'Form signal',
      text: 'Recent momentum and five-round pattern context.',
    },
    {
      icon: Cpu,
      eyebrow: '02',
      title: 'xG divergence',
      text: 'Expected-goal asymmetry between selected sides.',
    },
    {
      icon: ShieldCheck,
      eyebrow: '03',
      title: 'Risk screen',
      text: 'Strength gaps and volatility windows stay visible.',
    },
  ];

  return (
    <div className="wm-page">
      <div className="wm-bg-grid" aria-hidden="true" />
      <div className="wm-bg-glow wm-bg-glow--one" aria-hidden="true" />
      <div className="wm-bg-glow wm-bg-glow--two" aria-hidden="true" />

      <main className="wm-shell">
        <header className="wm-header">
          <div className="wm-header__copy">
            <div className="wm-kicker">
              <span className="wm-live-dot" />
              MODULE 03 · MATCH INTELLIGENCE
            </div>

            <div className="wm-title-row">
              <div>
                <h1>
                  Configure your
                  <span> fixture slate.</span>
                </h1>
                <p>
                  Build the round first. The engine evaluates the completed slate only after
                  every fixture has a valid home / away pairing.
                </p>
              </div>

              <div className="wm-engine-chip" aria-label="Neon Engine status">
                <span className="wm-engine-chip__icon">
                  <Zap size={15} />
                </span>
                <span>
                  <small>NEON ENGINE</small>
                  <strong>READY · v2.4</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="wm-progress-panel">
            <div className="wm-progress-panel__top">
              <div>
                <span className="wm-overline">ROUND BUILD</span>
                <strong>
                  {String(completeCount).padStart(2, '0')}
                  <em>/</em>
                  {String(NUM_SLOTS).padStart(2, '0')}
                </strong>
              </div>

              <span className={isComplete ? 'wm-progress-state is-ready' : 'wm-progress-state'}>
                {isComplete ? 'ALL FIXTURES READY' : `${NUM_SLOTS - completeCount} TO COMPLETE`}
              </span>
            </div>

            <div className="wm-progress-track">
              <span style={{ width: `${progress * 100}%` }} />
              {Array.from({ length: NUM_SLOTS - 1 }).map((_, index) => (
                <i
                  key={index}
                  style={{ left: `${((index + 1) / NUM_SLOTS) * 100}%` }}
                />
              ))}
            </div>

            <div className="wm-progress-panel__bottom">
              <span>{selectedFieldCount} / 16 team selections</span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
          </div>
        </header>

        <section className="wm-command-bar">
          <div className="wm-command-bar__identity">
            <div className="wm-command-mark">
              <Sparkles size={17} />
            </div>
            <div>
              <span>FIXTURE SELECTION</span>
              <strong>Season 25 · Matchday 12</strong>
            </div>
          </div>

          <div className="wm-command-bar__legend">
            <span><i className="wm-legend-dot wm-legend-dot--empty" /> Awaiting input</span>
            <span><i className="wm-legend-dot wm-legend-dot--ready" /> Ready</span>
            <span className={activePulse ? 'wm-pulse-text is-active' : 'wm-pulse-text'}>
              LIVE STATE
            </span>
          </div>
        </section>

        <section className="wm-grid" aria-label="Fixture selection">
          {slots.map((slot, index) => (
            <MatchCard
              key={slot.id}
              slot={slot}
              index={index}
              allSelectedIds={allSelectedIds}
              onChange={(field, team) => updateSlot(slot.id, field, team)}
              onClear={() => clearRow(slot.id)}
            />
          ))}
        </section>

        <section className="wm-insight-strip" aria-label="Engine inputs">
          {helperItems.map(({ icon: Icon, eyebrow, title, text }) => (
            <div key={title} className="wm-insight">
              <div className="wm-insight__icon">
                <Icon size={16} />
              </div>
              <div>
                <span>{eyebrow} · SIGNAL INPUT</span>
                <strong>{title}</strong>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </section>

        <footer className="wm-action-bar">
          <div className="wm-action-bar__copy">
            <span className={isComplete ? 'wm-action-status is-ready' : 'wm-action-status'}>
              <i />
              {isComplete ? 'Engine gate unlocked' : 'Engine gate locked'}
            </span>
            <p>
              {isComplete
                ? 'All 8 fixtures are complete. Review the slate, then run the intelligence engine.'
                : 'Complete every fixture with two different teams to unlock analysis.'}
            </p>
          </div>

          <div className="wm-action-bar__buttons">
            <button
              type="button"
              className="wm-secondary-button"
              disabled={selectedFieldCount === 0 || running}
              onClick={clearAll}
            >
              <Eraser size={15} />
              Clear slate
            </button>

            <button
              type="button"
              className={`wm-primary-button ${isComplete && !running ? 'is-ready' : ''}`}
              disabled={!isComplete || running}
              onClick={runEngine}
            >
              {running ? (
                <>
                  <Loader2 size={16} className="wm-spin" />
                  Processing signal
                </>
              ) : (
                <>
                  <Cpu size={16} />
                  Run intelligence
                </>
              )}
              <span className="wm-primary-button__arrow">→</span>
            </button>
          </div>
        </footer>
      </main>

      {toast && (
        <div className="wm-toast" role="status" aria-live="polite">
          {running ? <Loader2 size={15} className="wm-spin" /> : <CheckCircle2 size={15} />}
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
