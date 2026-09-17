import { ArrowLeft, Target, TrendingUp, Activity, Zap, AlertTriangle, Trophy } from 'lucide-react';
import { Counter } from '@/components/ui/Counter';
import { HeatGrid } from '@/components/ui/HeatGrid';
import { CornerFrame } from '@/components/ui/CornerFrame';
import { TeamCrest } from '@/components/ui/TeamCrest';
import { RevealText } from '@/components/ui/RevealText';
import { SectionLabel } from '@/components/ui/ModuleHeader';
import type { MatchPrediction, Page } from '@/types';

type InsightsPageProps = {
  predictions: MatchPrediction[];
  onNavigate: (page: Page) => void;
};

export function InsightsPage({ predictions, onNavigate }: InsightsPageProps) {
  if (predictions.length === 0) {
    return (
      <div className="page-transition min-h-screen pt-16 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-14 h-14 rounded-2xl grid place-items-center mx-auto mb-6" style={{ border: '1px solid rgba(163,230,53,0.3)', background: 'rgba(163,230,53,0.06)' }}>
            <AlertTriangle size={28} strokeWidth={1.5} className="text-lime" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight mb-3">No analysis yet</h2>
          <p className="text-sm text-neutral-400 font-light mb-6">
            Head to the match engine, configure your fixtures, and run the engine to see predictions.
          </p>
          <button
            onClick={() => onNavigate('dashboard')}
            className="inline-flex items-center gap-2 rounded-full px-5 h-10 text-xs font-semibold uppercase tracking-[0.1em] text-black transition-transform duration-200 hover:scale-105"
            style={{ background: 'linear-gradient(180deg, #bef264, #a3e635)', boxShadow: '0 8px 30px rgba(163,230,53,0.25)' }}
          >
            <ArrowLeft size={15} strokeWidth={2} />
            Go to Match Engine
          </button>
        </div>
      </div>
    );
  }

  const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
  const topPrediction = [...predictions].sort((a, b) => b.confidence - a.confidence)[0];
  const strongestSignal = topPrediction.signals[0];
  const homeWins = predictions.filter((p) => p.prediction.includes(p.home.short)).length;
  const awayWins = predictions.filter((p) => p.prediction.includes(p.away.short)).length;
  const draws = predictions.filter((p) => p.prediction === 'Draw').length;

  return (
    <div className="page-transition min-h-screen pt-16 pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <SectionLabel className="mb-3">Sequence 004 · analysis complete</SectionLabel>
            <RevealText as="h1" className="text-3xl sm:text-5xl font-semibold tracking-tight leading-tight">
              {`Pattern locked. ${predictions.length} fixtures read.`}
            </RevealText>
          </div>
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 px-4 h-10 rounded-lg text-sm font-medium text-neutral-300 border border-white/10 hover:text-white hover:border-white/25 transition-all shrink-0"
          >
            <ArrowLeft size={15} strokeWidth={1.5} />
            Back to Selection
          </button>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <div className="gradient-border animate-fade-in-up" style={{ opacity: 0 }}>
            <div className="glass-card rounded-2xl h-full px-4 py-5 flex flex-col gap-2">
              <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 font-semibold">Avg confidence</p>
              <p className="text-3xl sm:text-4xl font-semibold tracking-tight font-mono text-lime">
                <Counter to={avgConfidence} decimals={1} suffix="%" />
              </p>
              <div className="h-1 rounded-full overflow-hidden bg-white/[0.07]">
                <div className="h-full rounded-full" style={{ width: `${avgConfidence}%`, background: 'linear-gradient(90deg, #84cc16, #a3e635)', transform: 'scaleX(0)', transformOrigin: 'left', animation: 'barGrow 1.2s ease-out 0.3s forwards' }} />
              </div>
            </div>
          </div>

          <div className="gradient-border animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.1s' }}>
            <div className="glass-card rounded-2xl h-full px-4 py-5 flex flex-col gap-2">
              <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 font-semibold">Strongest signal</p>
              <p className="text-sm font-medium leading-tight mt-1">{strongestSignal.label}</p>
              <p className="text-xs text-neutral-500 font-mono mt-auto">confidence {strongestSignal.confidence.toFixed(2)}</p>
            </div>
          </div>

          <div className="gradient-border animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.2s' }}>
            <div className="glass-card rounded-2xl h-full px-4 py-5 flex flex-col gap-2">
              <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 font-semibold">Home wins</p>
              <p className="text-3xl sm:text-4xl font-semibold tracking-tight font-mono">{homeWins}</p>
              <p className="text-xs text-neutral-500 font-mono mt-auto">{awayWins} away · {draws} draws</p>
            </div>
          </div>

          <div className="gradient-border animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.3s' }}>
            <div className="glass-card rounded-2xl h-full px-4 py-5 flex flex-col gap-2">
              <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 font-semibold">Fixtures analyzed</p>
              <p className="text-3xl sm:text-4xl font-semibold tracking-tight font-mono">{predictions.length}</p>
              <p className="text-xs text-neutral-500 font-mono mt-auto">last sync · 00:00:04 ago</p>
            </div>
          </div>
        </div>

        {/* Match predictions */}
        <div className="flex flex-col gap-4">
          {predictions.map((pred, i) => (
            <div
              key={pred.slotId}
              className="border border-white/[0.1] rounded-2xl overflow-hidden animate-fade-in-up hover:border-white/20 transition-colors"
              style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}
            >
              {/* Match header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]" style={{ background: 'rgba(163,230,53,0.02)' }}>
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg grid place-items-center text-xs font-mono font-semibold text-lime bg-lime/10 border border-lime/30">
                    {String(pred.slotId + 1).padStart(2, '0')}
                  </span>
                  <div className="flex items-center gap-2">
                    <TeamCrest team={pred.home} size="sm" />
                    <span className="text-sm font-medium hidden sm:inline">{pred.home.name}</span>
                    <span className="text-xs font-mono text-neutral-600 mx-1">vs</span>
                    <TeamCrest team={pred.away} size="sm" />
                    <span className="text-sm font-medium hidden sm:inline">{pred.away.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-neutral-500 hidden sm:block">{pred.home.league}</span>
                  <span className="text-xs font-mono text-lime">● ANALYZED</span>
                </div>
              </div>

              <div className="grid lg:grid-cols-12">
                {/* Prediction score */}
                <div className="lg:col-span-4 px-5 py-5 flex flex-col gap-3 lg:border-r border-white/[0.08]">
                  <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 font-semibold">Prediction</p>
                  <div className="flex items-center gap-2">
                    <Trophy size={18} strokeWidth={1.5} className="text-lime" />
                    <span className="text-2xl font-semibold tracking-tight">{pred.prediction}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500 font-mono">Predicted score:</span>
                    <span className="text-sm font-mono font-medium text-lime">{pred.predictedScore}</span>
                  </div>
                  <div className="flex flex-col gap-1.5 mt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-500 font-mono">confidence</span>
                      <span className="font-mono text-lime font-medium">{pred.confidence.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden bg-white/[0.07]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pred.confidence}%`,
                          background: 'linear-gradient(90deg, #84cc16, #a3e635)',
                          transform: 'scaleX(0)',
                          transformOrigin: 'left',
                          animation: 'barGrow 1s ease-out 0.3s forwards',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Signals */}
                <div className="lg:col-span-5 px-5 py-5 flex flex-col gap-2 lg:border-r border-white/[0.08] border-t lg:border-t-0">
                  <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 font-semibold mb-1">Signals detected</p>
                  {pred.signals.map((signal, si) => {
                    const isPrimary = signal.type === 'primary';
                    const icon = si === 0 ? Target : si === 1 ? TrendingUp : Activity;
                    const Icon = icon;
                    return (
                      <div
                        key={si}
                        className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 animate-slide-in-left`}
                        style={{
                          borderColor: isPrimary ? 'rgba(163,230,53,0.35)' : 'rgba(255,255,255,0.1)',
                          background: isPrimary ? 'rgba(163,230,53,0.06)' : 'rgba(255,255,255,0.03)',
                          animationDelay: `${si * 0.1}s`,
                          opacity: 0,
                        }}
                      >
                        <Icon size={14} strokeWidth={1.5} className={isPrimary ? 'text-lime' : 'text-neutral-400'} />
                        <span className={`text-xs font-medium ${isPrimary ? '' : 'text-neutral-300'}`}>{signal.label}</span>
                        <span className={`ml-auto text-xs font-mono ${isPrimary ? 'text-lime' : 'text-neutral-500'}`}>
                          {signal.confidence.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Heat grid */}
                <div className="lg:col-span-3 px-5 py-5 flex flex-col gap-2 border-t lg:border-t-0 border-white/[0.08]">
                  <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 font-semibold mb-1">Form heat · last 5R</p>
                  <div className="flex-1 grid place-items-center py-2">
                    <HeatGrid values={pred.heatGrid} cols={8} rows={5} cellClass="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                  <p className="text-xs text-neutral-600 font-mono text-center">density pattern</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-8">
          <CornerFrame className="border border-white/[0.12]" corners="all">
            <div className="px-5 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Zap size={20} strokeWidth={1.5} className="text-lime" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Pattern locked · {predictions.length} / {predictions.length} fixtures analyzed</span>
                  <span className="text-xs text-neutral-500 font-mono">engine v2 · stream stable</span>
                </div>
              </div>
              <button
                onClick={() => onNavigate('dashboard')}
                className="flex items-center gap-2 rounded-full px-5 h-10 text-xs font-semibold uppercase tracking-[0.1em] text-black transition-transform duration-200 hover:scale-105 shrink-0"
                style={{ background: 'linear-gradient(180deg, #bef264, #a3e635)', boxShadow: '0 8px 30px rgba(163,230,53,0.25)' }}
              >
                <ArrowLeft size={15} strokeWidth={2} />
                New Analysis
              </button>
            </div>
          </CornerFrame>
        </div>
      </div>
    </div>
  );
}
