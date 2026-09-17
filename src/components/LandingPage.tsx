import { useEffect, useState } from 'react';
import { Target, TrendingUp, Ruler, Play, ArrowRight, Activity, Zap } from 'lucide-react';
import { Counter } from '@/components/ui/Counter';
import { RevealText } from '@/components/ui/RevealText';
import { HeatGrid } from '@/components/ui/HeatGrid';
import { CornerFrame } from '@/components/ui/CornerFrame';
import { ModuleHeader, SectionLabel } from '@/components/ui/ModuleHeader';
import type { Page } from '@/types';

type LandingPageProps = {
  onNavigate: (page: Page) => void;
};

export function LandingPage({ onNavigate }: LandingPageProps) {
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIntroDone(true), 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="page-transition">
      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
        {/* Background image treatment */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'url("https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/fa51902b-c2a4-4c33-a96e-a8f1ef67edc6_3840w.jpg") center/cover no-repeat',
            filter: 'saturate(0.4) brightness(0.45) hue-rotate(35deg)',
          }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(5,6,7,0.6), rgba(5,6,7,0.85) 50%, rgba(5,6,7,0.95))' }} />

        {/* Frame system */}
        <div className="absolute inset-3 sm:inset-5 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px bg-white/[0.14]" style={{ transform: 'scaleX(0)', animation: 'barGrow 1.1s ease-out 0.2s forwards', transformOrigin: 'left' }} />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-white/[0.14]" style={{ transform: 'scaleX(0)', animation: 'barGrow 1.1s ease-out 0.3s forwards', transformOrigin: 'right' }} />
          <div className="absolute top-0 bottom-0 left-0 w-px bg-white/[0.14]" style={{ transform: 'scaleY(0)', animation: 'barGrow 1.1s ease-out 0.4s forwards', transformOrigin: 'top' }} />
          <div className="absolute top-0 bottom-0 right-0 w-px bg-white/[0.14]" style={{ transform: 'scaleY(0)', animation: 'barGrow 1.1s ease-out 0.5s forwards', transformOrigin: 'bottom' }} />
          <span className="absolute -top-px -left-px w-5 h-5 animate-scale-in" style={{ borderTop: '2px solid #a3e635', borderLeft: '2px solid #a3e635', animationDelay: '0.8s' }} />
          <span className="absolute -top-px -right-px w-5 h-5 animate-scale-in" style={{ borderTop: '2px solid #a3e635', borderRight: '2px solid #a3e635', animationDelay: '0.9s' }} />
          <span className="absolute -bottom-px -left-px w-5 h-5 animate-scale-in" style={{ borderBottom: '2px solid #a3e635', borderLeft: '2px solid #a3e635', animationDelay: '1s' }} />
          <span className="absolute -bottom-px -right-px w-5 h-5 animate-scale-in" style={{ borderBottom: '2px solid #a3e635', borderRight: '2px solid #a3e635', animationDelay: '1.1s' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center gap-6 max-w-3xl">
          <p className="flex items-center gap-2.5 text-xs uppercase tracking-[0.3em] text-neutral-500 font-mono animate-fade-in" style={{ animationDelay: '1.1s', opacity: 0 }}>
            <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse-dot" style={{ boxShadow: '0 0 10px rgba(163,230,53,0.8)' }} />
            Engine sequence · 001
          </p>

          <h1 className="text-6xl sm:text-8xl md:text-9xl font-semibold tracking-tight leading-none">
            <span className="text-reveal-mask" style={{ animationDelay: '1.25s' }}>
              <span className="text-reveal-inner" style={{ animationDelay: '1.25s' }}>WIN</span>
            </span>
            <span className="text-reveal-mask" style={{ animationDelay: '1.39s' }}>
              <span className="text-reveal-inner" style={{ animationDelay: '1.39s', color: '#a3e635' }}>MIX</span>
            </span>
          </h1>

          {/* Boot lines */}
          <div className="flex flex-col items-start gap-1.5 mt-2 text-xs text-neutral-500 font-mono" style={{ opacity: 0, animation: 'fadeIn 0.5s ease-out 2.1s forwards' }}>
            <p className="animate-slide-in-left" style={{ animationDelay: '2.1s', opacity: 0 }}>
              &gt; loading fixture graph ......... <span className="text-lime">OK</span>
            </p>
            <p className="animate-slide-in-left" style={{ animationDelay: '2.3s', opacity: 0 }}>
              &gt; syncing league tables ........ <span className="text-lime">OK</span>
            </p>
            <p className="animate-slide-in-left" style={{ animationDelay: '2.5s', opacity: 0 }}>
              &gt; pattern engine warm-up ....... <span className="text-lime">READY</span>
            </p>
          </div>
        </div>

        {/* Scroll hint */}
        {introDone && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-in" style={{ animationDelay: '0.5s', opacity: 0 }}>
            <span className="text-xs text-neutral-600 font-mono uppercase tracking-widest">Scroll to explore</span>
            <div className="w-px h-8 bg-gradient-to-b from-lime/50 to-transparent animate-float" />
          </div>
        )}

        {/* HUD labels */}
        <div className="absolute left-6 sm:left-10 top-6 sm:top-9 text-xs text-neutral-600 font-mono tracking-widest uppercase hidden sm:block">WINMIX · TITLE FILM</div>
        <div className="absolute right-6 sm:right-10 top-6 sm:top-9 text-xs font-mono tracking-widest uppercase text-lime hidden sm:block">● REC</div>
      </section>

      {/* ===== THESIS SECTION ===== */}
      <section className="relative py-20 sm:py-28 px-4 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <CornerFrame className="border border-white/[0.12]">
            <ModuleHeader number="01" title="Brand premise" meta="System v2 · Live" />
            <div className="grid lg:grid-cols-12">
              <div className="lg:col-span-8 px-5 sm:px-8 py-10 sm:py-14 lg:border-r border-white/[0.08]">
                <SectionLabel className="mb-6">Category · Match intelligence engine</SectionLabel>
                <RevealText as="h2" className="text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.02]">
                  Read the game before it happens.
                </RevealText>
                <p className="mt-6 text-sm sm:text-base font-light text-neutral-400 max-w-xl leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.5s', opacity: 0 }}>
                  WINMIX STUDIO is a tactical intelligence brand for football analysts, syndicate traders, and data-driven fans. The identity behaves like the product: precise, live, and signal-first.
                </p>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="mt-8 inline-flex items-center gap-2 rounded-full px-5 h-10 text-xs font-semibold uppercase tracking-[0.1em] text-black transition-transform duration-200 hover:scale-105 animate-fade-in-up"
                  style={{
                    background: 'linear-gradient(180deg, #bef264, #a3e635)',
                    boxShadow: '0 8px 30px rgba(163,230,53,0.25)',
                    animationDelay: '0.8s',
                    opacity: 0,
                  }}
                >
                  <Play size={15} strokeWidth={2} fill="currentColor" />
                  Open Studio
                </button>
              </div>
              <div className="lg:col-span-4 grid grid-rows-3">
                {[
                  { label: 'Audience', value: 'Analysts · quant traders · tactical obsessives' },
                  { label: 'Tone', value: 'Broadcast-control-room calm, zero hype' },
                  { label: 'Theme', value: '"Pattern locked" — signal over noise' },
                ].map((item, i) => (
                  <div key={i} className="px-5 sm:px-8 py-5 flex flex-col gap-1 border-t lg:border-t-0 border-white/[0.08] animate-fade-in-up" style={{ animationDelay: `${0.3 + i * 0.15}s`, opacity: 0 }}>
                    <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 font-semibold">{item.label}</p>
                    <p className="text-sm font-medium">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </CornerFrame>
        </div>
      </section>

      {/* ===== KPI SECTION ===== */}
      <section className="relative py-12 sm:py-16 px-4 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-8">
            <SectionLabel>Sequence 002 · the numbers behind it</SectionLabel>
            <p className="text-xs text-neutral-600 font-mono hidden sm:block">last sync · 00:00:04 ago · stream stable</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: 'Fixtures indexed', to: 12480, decimals: 0, suffix: '', barWidth: '100%' },
              { label: 'Leagues covered', to: 27, decimals: 0, suffix: '', barWidth: '72%' },
              { label: 'Pattern match', to: 94.2, decimals: 1, suffix: '%', barWidth: '94%', lime: true },
              { label: 'Forecast hit rate', to: 87.6, decimals: 1, suffix: '%', barWidth: '88%', lime: true },
            ].map((kpi, i) => (
              <div key={i} className="gradient-border animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s`, opacity: 0 }}>
                <div className="glass-card rounded-2xl h-full px-4 py-5 flex flex-col gap-2">
                  <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 font-semibold">{kpi.label}</p>
                  <p className={`text-3xl sm:text-4xl font-semibold tracking-tight font-mono ${kpi.lime ? 'text-lime' : ''}`}>
                    <Counter to={kpi.to} decimals={kpi.decimals} suffix={kpi.suffix} />
                  </p>
                  <div className="h-1 rounded-full overflow-hidden bg-white/[0.07]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: kpi.barWidth,
                        background: 'linear-gradient(90deg, #84cc16, #a3e635)',
                        transform: 'scaleX(0)',
                        transformOrigin: 'left',
                        animation: 'barGrow 1.2s ease-out 0.5s forwards',
                        animationDelay: `${0.5 + i * 0.1}s`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PATTERN LOCK SECTION ===== */}
      <section className="relative py-20 sm:py-28 px-4 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <CornerFrame className="border border-white/[0.12]" corners="all">
            <ModuleHeader number="02" title="Core identity" meta="PRINCIPLE / 001" />
            <div className="grid md:grid-cols-2">
              <div className="px-5 sm:px-8 py-10 sm:py-12 md:border-r border-white/[0.08]">
                <RevealText as="h2" className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
                  Every surface is a live instrument, never a poster.
                </RevealText>
              </div>
              <div className="px-5 sm:px-8 py-8 sm:py-12 flex flex-col gap-4 border-t md:border-t-0 border-white/[0.08]">
                {[
                  { icon: Target, title: 'Signal-first.', desc: 'Lime marks the finding; everything else stays neutral so the signal reads instantly.' },
                  { icon: TrendingUp, title: 'Evidence in the frame.', desc: 'Timecodes, counters, and confidence scores are part of the visual voice.' },
                  { icon: Ruler, title: 'Framed precision.', desc: 'Thin guide borders and corner brackets contain every composition, like a viewfinder.' },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-start gap-3 animate-fade-in-up" style={{ animationDelay: `${0.3 + i * 0.15}s`, opacity: 0 }}>
                      <Icon size={18} strokeWidth={1.5} className="text-lime mt-0.5 shrink-0" />
                      <p className="text-sm text-neutral-400 font-light leading-relaxed">
                        <span className="text-white font-medium">{item.title}</span> {item.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </CornerFrame>
        </div>
      </section>

      {/* ===== SIGNAL DEMO ===== */}
      <section className="relative py-12 sm:py-16 px-4 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-8">
            <SectionLabel>Sequence 003 · signal</SectionLabel>
            <p className="text-xs text-neutral-600 font-mono hidden sm:block">MOTIFS / 04</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Engine panel */}
            <div className="gradient-border animate-fade-in-up" style={{ opacity: 0, animationDelay: '0s' }}>
              <div className="glass-card rounded-2xl h-full p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 font-semibold">Engine panel</p>
                  <span className="text-xs font-mono text-lime">● LIVE</span>
                </div>
                <p className="text-3xl font-semibold tracking-tight font-mono">
                  94.2<span className="text-lime">%</span>
                </p>
                <p className="text-xs text-neutral-500 -mt-2">pattern match confidence</p>
                <div className="h-1 rounded-full overflow-hidden bg-white/[0.07]">
                  <div className="h-full rounded-full" style={{ width: '94%', background: 'linear-gradient(90deg, #84cc16, #a3e635)', transform: 'scaleX(0)', transformOrigin: 'left', animation: 'barGrow 1.2s ease-out 0.5s forwards' }} />
                </div>
                <div className="flex items-center gap-2.5 rounded-xl border border-lime/35 px-3 py-2 mt-auto" style={{ background: 'rgba(163,230,53,0.06)' }}>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-lime" style={{ boxShadow: '0 0 8px rgba(163,230,53,0.8)' }} />
                  <span className="text-xs font-medium">Home streak echo · 5R form</span>
                  <span className="ml-auto text-xs font-mono text-lime">0.94</span>
                </div>
              </div>
            </div>

            {/* Heat grid */}
            <div className="border border-white/[0.1] rounded-2xl p-5 flex flex-col gap-4 animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.1s' }}>
              <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 font-semibold">Heat grid motif</p>
              <div className="flex-1 grid place-items-center py-4">
                <HeatGrid cols={8} rows={4} />
              </div>
              <p className="text-sm font-light text-neutral-400 leading-relaxed">Rounded cells at four lime intensities. The signature pattern for form, density, and confidence.</p>
            </div>

            {/* Viewfinder */}
            <div className="border border-white/[0.1] rounded-2xl p-5 flex flex-col gap-4 animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.2s' }}>
              <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 font-semibold">Viewfinder frame</p>
              <div className="flex-1 grid place-items-center py-4">
                <div className="relative w-40 h-24 border border-white/15 grid place-items-center">
                  <span className="absolute -top-px -left-px w-4 h-4" style={{ borderTop: '2px solid #a3e635', borderLeft: '2px solid #a3e635' }} />
                  <span className="absolute -top-px -right-px w-4 h-4" style={{ borderTop: '2px solid #a3e635', borderRight: '2px solid #a3e635' }} />
                  <span className="absolute -bottom-px -left-px w-4 h-4" style={{ borderBottom: '2px solid #a3e635', borderLeft: '2px solid #a3e635' }} />
                  <span className="absolute -bottom-px -right-px w-4 h-4" style={{ borderBottom: '2px solid #a3e635', borderRight: '2px solid #a3e635' }} />
                  <p className="text-xs text-neutral-500 tracking-widest font-mono">● REC</p>
                </div>
              </div>
              <p className="text-sm font-light text-neutral-400 leading-relaxed">Hairline borders plus lime L-brackets frame every key composition, echoing a recording HUD.</p>
            </div>

            {/* Motion */}
            <div className="border border-white/[0.1] rounded-2xl p-5 flex flex-col gap-4 animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.3s' }}>
              <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 font-semibold">Motion cues</p>
              <div className="flex-1 flex flex-col justify-center gap-3 py-4">
                <div className="h-px relative bg-white/10">
                  <div className="absolute inset-y-0 left-0 w-full" style={{ background: '#a3e635', boxShadow: '0 0 12px rgba(163,230,53,0.5)', transform: 'scaleX(0)', transformOrigin: 'left', animation: 'barGrow 1.2s ease-out 0.5s forwards' }} />
                </div>
                <p className="text-xs text-neutral-500 tracking-widest font-mono">00:00:12 <span className="text-lime">▸</span> masked rise · 24fps</p>
                <div className="h-px relative bg-white/10">
                  <div className="absolute inset-y-0 left-0 w-2/3" style={{ background: 'rgba(163,230,53,0.5)', transform: 'scaleX(0)', transformOrigin: 'left', animation: 'barGrow 1.2s ease-out 0.7s forwards' }} />
                </div>
              </div>
              <p className="text-sm font-light text-neutral-400 leading-relaxed">Words rise from masks, bars scale from the left, counters tick. Nothing bounces; everything resolves.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="relative py-20 sm:py-28 px-4 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <CornerFrame className="border border-white/[0.12]" corners="all">
            <div className="px-5 sm:px-8 py-12 sm:py-16 flex flex-col items-center text-center gap-6">
              <div className="w-14 h-14 rounded-2xl grid place-items-center animate-scale-in" style={{ border: '1px solid rgba(163,230,53,0.45)', background: 'rgba(163,230,53,0.08)', boxShadow: '0 0 40px rgba(163,230,53,0.15)' }}>
                <Target size={28} strokeWidth={1.5} className="text-lime" />
              </div>
              <RevealText as="h2" className="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-tight leading-none">
                PATTERN LOCKED
              </RevealText>
              <p className="inline-flex items-center gap-2 rounded-full px-4 h-8 text-xs font-semibold uppercase tracking-[0.12em] text-lime" style={{ border: '1px solid rgba(163,230,53,0.35)', background: 'rgba(163,230,53,0.08)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse-dot" style={{ boxShadow: '0 0 8px rgba(163,230,53,0.8)' }} />
                Version 2 · Live engine
              </p>
              <p className="text-sm font-light text-neutral-400 max-w-sm">Read the game before kickoff. The tactical layer arrives now.</p>
              <button
                onClick={() => onNavigate('dashboard')}
                className="inline-flex items-center gap-2 rounded-full px-5 h-10 text-xs font-semibold uppercase tracking-[0.1em] text-black transition-transform duration-200 hover:scale-105"
                style={{ background: 'linear-gradient(180deg, #bef264, #a3e635)', boxShadow: '0 8px 30px rgba(163,230,53,0.25)' }}
              >
                <Activity size={15} strokeWidth={2} />
                Enter Match Engine
                <ArrowRight size={15} strokeWidth={2} />
              </button>
            </div>
          </CornerFrame>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="relative px-4 sm:px-8 pb-8">
        <div className="mx-auto max-w-7xl">
          <CornerFrame className="border border-white/[0.12]">
            <div className="px-5 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="text-xs text-neutral-600 tracking-widest uppercase font-mono">WINMIX STUDIO · Brand system board · v2.0</p>
              <p className="text-xs tracking-widest uppercase font-mono text-lime flex items-center gap-2">
                <Zap size={12} strokeWidth={1.5} />
                Pattern locked · 07 / 07 modules
              </p>
            </div>
          </CornerFrame>
        </div>
      </footer>
    </div>
  );
}
