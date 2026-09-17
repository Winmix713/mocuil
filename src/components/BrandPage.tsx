import { Target, TrendingUp, Ruler, Play } from 'lucide-react';
import { CornerFrame } from '@/components/ui/CornerFrame';
import { ModuleHeader } from '@/components/ui/ModuleHeader';
import { RevealText } from '@/components/ui/RevealText';
import { HeatGrid } from '@/components/ui/HeatGrid';

export function BrandPage() {
  return (
    <div className="page-transition min-h-screen pt-16 pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 py-8 flex flex-col gap-6 sm:gap-8">

        {/* ===== 01 BRAND PREMISE ===== */}
        <CornerFrame className="border border-white/[0.12]" corners="all">
          <ModuleHeader number="01" title="Brand premise" meta="System v2 · Live" />
          <div className="grid lg:grid-cols-12">
            <div className="lg:col-span-8 px-5 sm:px-8 py-10 sm:py-14 lg:border-r border-white/[0.08]">
              <p className="text-xs uppercase tracking-[0.3em] mb-6 font-mono text-lime">Category · Match intelligence engine</p>
              <RevealText as="h1" className="text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.02]">
                Read the game before it happens.
              </RevealText>
              <p className="mt-6 text-sm sm:text-base font-light text-neutral-400 max-w-xl leading-relaxed">
                WINMIX STUDIO is a tactical intelligence brand for football analysts, syndicate traders, and data-driven fans. The identity behaves like the product: precise, live, and signal-first.
              </p>
            </div>
            <div className="lg:col-span-4 grid grid-rows-3">
              {[
                { label: 'Audience', value: 'Analysts · quant traders · tactical obsessives' },
                { label: 'Tone', value: 'Broadcast-control-room calm, zero hype' },
                { label: 'Theme', value: '"Pattern locked" — signal over noise' },
              ].map((item, i) => (
                <div key={i} className="px-5 sm:px-8 py-5 flex flex-col gap-1 border-t lg:border-t-0 border-white/[0.08]">
                  <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 font-semibold">{item.label}</p>
                  <p className="text-sm font-medium">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </CornerFrame>

        {/* ===== 02 CORE IDENTITY ===== */}
        <CornerFrame className="border border-white/[0.12]">
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
                  <div key={i} className="flex items-start gap-3">
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

        {/* ===== 03 LOGO & MARK SYSTEM ===== */}
        <CornerFrame className="border border-white/[0.12]" corners="all">
          <ModuleHeader number="03" title="Logo & mark system" meta="4 VARIANTS" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4">
            {/* Primary wordmark */}
            <div className="border-b sm:border-r border-white/[0.08] px-5 py-8 flex flex-col gap-6">
              <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 font-semibold">Primary wordmark</p>
              <div className="flex-1 grid place-items-center py-8">
                <p className="text-3xl font-semibold tracking-tight leading-none">WIN<span className="text-lime">MIX</span></p>
              </div>
              <p className="text-xs text-neutral-600 font-mono">dark surfaces · default</p>
            </div>
            {/* Stacked lockup */}
            <div className="border-b lg:border-r border-white/[0.08] px-5 py-8 flex flex-col gap-6">
              <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 font-semibold">Stacked lockup</p>
              <div className="flex-1 grid place-items-center py-8">
                <div className="text-center">
                  <p className="text-2xl font-semibold tracking-tight leading-none">WIN<span className="text-lime">MIX</span></p>
                  <p className="mt-1.5 text-xs uppercase tracking-[0.4em] text-neutral-400 font-mono">Studio</p>
                </div>
              </div>
              <p className="text-xs text-neutral-600 font-mono">narrow formats · vertical</p>
            </div>
            {/* Monogram */}
            <div className="border-b sm:border-r border-white/[0.08] px-5 py-8 flex flex-col gap-6">
              <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 font-semibold">Monogram · icon-only</p>
              <div className="flex-1 grid place-items-center py-8">
                <div className="rounded-2xl" style={{ padding: '1px', background: 'linear-gradient(160deg, rgba(163,230,53,0.6), rgba(255,255,255,0.08) 50%, rgba(163,230,53,0.15))' }}>
                  <div className="w-16 h-16 rounded-2xl grid place-items-center" style={{ background: 'rgba(10,12,10,0.95)' }}>
                    <span className="text-xl font-semibold tracking-tight text-lime">WX</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-neutral-600 font-mono">avatars · favicons · badges</p>
            </div>
            {/* Clear space */}
            <div className="border-b border-white/[0.08] px-5 py-8 flex flex-col gap-6">
              <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 font-semibold">Clear space rule</p>
              <div className="flex-1 grid place-items-center py-8">
                <div className="relative px-8 py-6" style={{ border: '1px dashed rgba(163,230,53,0.35)' }}>
                  <span className="absolute -top-1 -left-1 w-2 h-2 bg-lime" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-lime" />
                  <span className="absolute -bottom-1 -left-1 w-2 h-2 bg-lime" />
                  <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-lime" />
                  <p className="text-xl font-semibold tracking-tight leading-none">WIN<span className="text-lime">MIX</span></p>
                </div>
              </div>
              <p className="text-xs text-neutral-600 font-mono">margin = height of "X" on all sides</p>
            </div>
          </div>
          {/* Color pairings */}
          <div className="grid grid-cols-2">
            <div className="px-5 py-6 flex items-center justify-center gap-3 border-r border-white/[0.08]">
              <p className="text-lg font-semibold tracking-tight">WIN<span className="text-lime">MIX</span></p>
              <span className="text-xs text-neutral-600 hidden sm:block font-mono">on ink #050607</span>
            </div>
            <div className="px-5 py-6 flex items-center justify-center gap-3 bg-white">
              <p className="text-lg font-semibold tracking-tight text-black">WIN<span style={{ color: '#4d7c0f' }}>MIX</span></p>
              <span className="text-xs text-neutral-500 hidden sm:block font-mono">inverse · lime deepens to 700</span>
            </div>
          </div>
        </CornerFrame>

        {/* ===== 04 TYPOGRAPHY + 05 COLOR ===== */}
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Typography */}
          <CornerFrame className="border border-white/[0.12]" corners="all">
            <ModuleHeader number="04" title="Typography" meta="Inter / JetBrains Mono" />
            <div className="divide-y divide-white/[0.08]">
              <div className="px-5 sm:px-8 py-6">
                <p className="text-xs text-neutral-600 mb-2 font-mono">Display · Inter Semibold · tight</p>
                <p className="text-4xl sm:text-5xl font-semibold tracking-tight leading-none">PATTERN LOCKED</p>
              </div>
              <div className="px-5 sm:px-8 py-6">
                <p className="text-xs text-neutral-600 mb-2 font-mono">Heading · Inter Medium</p>
                <p className="text-2xl font-medium tracking-tight">Tactical match intelligence</p>
              </div>
              <div className="px-5 sm:px-8 py-6">
                <p className="text-xs text-neutral-600 mb-2 font-mono">Body · Inter Light · neutral-400</p>
                <p className="text-sm font-light text-neutral-400 leading-relaxed max-w-md">Every fixture, every signal, one engine reading the pitch. Body copy stays quiet and generously leaded so numbers can shout.</p>
              </div>
              <div className="px-5 sm:px-8 py-6 flex flex-wrap items-center gap-x-8 gap-y-4">
                <div>
                  <p className="text-xs text-neutral-600 mb-2 font-mono">Label · caps · 0.3em track</p>
                  <p className="text-xs uppercase tracking-[0.3em] font-mono text-lime">Sequence 002 · thesis</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-600 mb-2 font-mono">Data · Mono Medium</p>
                  <p className="text-2xl font-medium tracking-tight font-mono">94.2<span className="text-lime">%</span> · 00:00:04</p>
                </div>
              </div>
            </div>
          </CornerFrame>

          {/* Color */}
          <CornerFrame className="border border-white/[0.12]" corners="all">
            <ModuleHeader number="05" title="Color system" meta="5 CORE / 2 PAIRINGS" />
            <div className="grid grid-cols-2 sm:grid-cols-5 border-b border-white/[0.08]">
              {[
                { name: 'Signal Lime', hex: '#A3E635', note: 'accent only', bg: '#a3e635', dark: true },
                { name: 'Pitch Green', hex: '#84CC16', note: 'gradients', bg: '#84cc16', dark: true },
                { name: 'Broadcast Ink', hex: '#050607', note: 'canvas', bg: '#050607', dark: false },
                { name: 'Studio Grey', hex: '#404040', note: 'structure', bg: '#404040', dark: false },
                { name: 'Chalk White', hex: '#FAFAFA', note: 'inverse', bg: '#fafafa', dark: true },
              ].map((color, i) => (
                <div
                  key={i}
                  className="h-32 sm:h-36 flex flex-col justify-end p-3 border-r border-b sm:border-b-0 border-white/[0.08] last:border-r-0"
                  style={{ background: color.bg }}
                >
                  <p className={`text-xs font-semibold ${color.dark ? 'text-black' : 'text-white'}`}>{color.name}</p>
                  <p className={`text-xs font-mono ${color.dark ? 'text-black/70' : 'text-neutral-400'}`}>{color.hex} · {color.note}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2">
              <div className="p-5 sm:p-6 flex flex-col gap-2 border-r border-white/[0.08]" style={{ background: '#050607' }}>
                <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 font-semibold">Pairing A · default</p>
                <p className="text-lg font-medium tracking-tight">Ink + White + <span className="text-lime">Lime</span></p>
                <p className="text-xs text-neutral-600 font-mono">AA-large ✓ · dashboards, film, social</p>
              </div>
              <div className="p-5 sm:p-6 flex flex-col gap-2" style={{ background: '#a3e635' }}>
                <p className="text-xs uppercase tracking-[0.14em] font-semibold text-black/60">Pairing B · alert</p>
                <p className="text-lg font-medium tracking-tight text-black">Lime + Ink text</p>
                <p className="text-xs text-black/60 font-mono">AAA ✓ · buttons, locked-signal states</p>
              </div>
            </div>
          </CornerFrame>
        </div>

        {/* ===== 06 VISUAL LANGUAGE ===== */}
        <CornerFrame className="border border-white/[0.12]" corners="all">
          <ModuleHeader number="06" title="Visual language" meta="MOTIFS / 04" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4">
            {/* Image treatment */}
            <div className="border-b lg:border-b-0 sm:border-r border-white/[0.08] flex flex-col">
              <div className="relative h-40 overflow-hidden">
                <div
                  className="w-full h-full"
                  style={{
                    background: 'url("https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/fa51902b-c2a4-4c33-a96e-a8f1ef67edc6_1600w.jpg") center/cover',
                    filter: 'saturate(0.4) brightness(0.6) hue-rotate(35deg)',
                  }}
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent, rgba(5,6,7,0.85))' }} />
                <span className="absolute top-2 left-2 w-4 h-4" style={{ borderTop: '1.5px solid #a3e635', borderLeft: '1.5px solid #a3e635' }} />
                <span className="absolute bottom-2 right-2 w-4 h-4" style={{ borderBottom: '1.5px solid #a3e635', borderRight: '1.5px solid #a3e635' }} />
              </div>
              <div className="p-5 flex flex-col gap-1.5">
                <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 font-semibold">Image treatment</p>
                <p className="text-sm font-light text-neutral-400 leading-relaxed">Desaturate, darken, shift toward lime. Photography reads as night broadcast footage.</p>
              </div>
            </div>
            {/* Heat grid */}
            <div className="border-b lg:border-b-0 lg:border-r border-white/[0.08] flex flex-col">
              <div className="h-40 grid place-items-center px-5">
                <HeatGrid cols={8} rows={4} />
              </div>
              <div className="p-5 flex flex-col gap-1.5 border-t border-white/[0.08]">
                <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 font-semibold">Heat grid motif</p>
                <p className="text-sm font-light text-neutral-400 leading-relaxed">Rounded cells at four lime intensities. The signature pattern for form, density, and confidence.</p>
              </div>
            </div>
            {/* Frame + brackets */}
            <div className="border-b sm:border-b-0 sm:border-r border-white/[0.08] flex flex-col">
              <div className="h-40 grid place-items-center px-5">
                <div className="relative w-40 h-24 border border-white/15 grid place-items-center">
                  <span className="absolute -top-px -left-px w-4 h-4" style={{ borderTop: '2px solid #a3e635', borderLeft: '2px solid #a3e635' }} />
                  <span className="absolute -top-px -right-px w-4 h-4" style={{ borderTop: '2px solid #a3e635', borderRight: '2px solid #a3e635' }} />
                  <span className="absolute -bottom-px -left-px w-4 h-4" style={{ borderBottom: '2px solid #a3e635', borderLeft: '2px solid #a3e635' }} />
                  <span className="absolute -bottom-px -right-px w-4 h-4" style={{ borderBottom: '2px solid #a3e635', borderRight: '2px solid #a3e635' }} />
                  <p className="text-xs text-neutral-500 tracking-widest font-mono">● REC</p>
                </div>
              </div>
              <div className="p-5 flex flex-col gap-1.5 border-t border-white/[0.08]">
                <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 font-semibold">Viewfinder frame</p>
                <p className="text-sm font-light text-neutral-400 leading-relaxed">Hairline borders plus lime L-brackets frame every key composition, echoing a recording HUD.</p>
              </div>
            </div>
            {/* Motion */}
            <div className="flex flex-col">
              <div className="h-40 flex flex-col justify-center gap-3 px-6">
                <div className="h-px relative bg-white/10">
                  <div className="absolute inset-y-0 left-0 w-full" style={{ background: '#a3e635', boxShadow: '0 0 12px rgba(163,230,53,0.5)', transform: 'scaleX(0)', transformOrigin: 'left', animation: 'barGrow 1.2s ease-out 0.5s forwards' }} />
                </div>
                <p className="text-xs text-neutral-500 tracking-widest font-mono">00:00:12 <span className="text-lime">▸</span> masked rise · 24fps</p>
                <div className="h-px relative bg-white/10">
                  <div className="absolute inset-y-0 left-0 w-2/3" style={{ background: 'rgba(163,230,53,0.5)', transform: 'scaleX(0)', transformOrigin: 'left', animation: 'barGrow 1.2s ease-out 0.7s forwards' }} />
                </div>
              </div>
              <div className="p-5 flex flex-col gap-1.5 border-t border-white/[0.08]">
                <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 font-semibold">Motion cues</p>
                <p className="text-sm font-light text-neutral-400 leading-relaxed">Words rise from masks, bars scale from the left, counters tick. Nothing bounces; everything resolves.</p>
              </div>
            </div>
          </div>
        </CornerFrame>

        {/* ===== 07 APPLICATIONS ===== */}
        <CornerFrame className="border border-white/[0.12]" corners="all">
          <ModuleHeader number="07" title="Applications" meta="IN-SITU / 03" />
          <div className="grid md:grid-cols-3 gap-5 sm:gap-6 p-5 sm:p-8">
            {/* Engine panel */}
            <div className="gradient-border">
              <div className="glass-card rounded-2xl h-full p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 font-semibold">Engine panel</p>
                  <span className="text-xs font-mono text-lime">● LIVE</span>
                </div>
                <p className="text-3xl font-semibold tracking-tight font-mono">94.2<span className="text-lime">%</span></p>
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

            {/* Social tile */}
            <div className="relative rounded-2xl overflow-hidden aspect-square md:aspect-auto border border-white/10">
              <div
                className="absolute inset-0"
                style={{
                  background: 'url("https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/d14dc069-558a-4c51-8aad-5cc237f9b61d_1600w.jpg") center/cover',
                  filter: 'grayscale(1) brightness(0.4)',
                }}
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(5,6,7,0.6), rgba(5,6,7,0.9))' }} />
              <div className="relative h-full min-h-56 p-5 flex flex-col">
                <p className="text-xs uppercase tracking-[0.3em] font-mono text-lime">Matchday 27</p>
                <h3 className="mt-auto text-2xl sm:text-3xl font-semibold tracking-tight leading-tight">Signal over noise.</h3>
                <p className="mt-2 text-xs text-neutral-400 font-mono">WIN<span className="text-lime">MIX</span> · 00:00:24</p>
              </div>
              <span className="absolute top-3 left-3 w-4 h-4" style={{ borderTop: '1.5px solid #a3e635', borderLeft: '1.5px solid #a3e635' }} />
              <span className="absolute bottom-3 right-3 w-4 h-4" style={{ borderBottom: '1.5px solid #a3e635', borderRight: '1.5px solid #a3e635' }} />
            </div>

            {/* Badge / CTA */}
            <div className="rounded-2xl flex flex-col items-center justify-center gap-4 p-6 text-center border border-white/10" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="rounded-2xl" style={{ padding: '1px', background: 'linear-gradient(160deg, rgba(163,230,53,0.6), rgba(255,255,255,0.08) 50%, rgba(163,230,53,0.15))' }}>
                <div className="w-12 h-12 rounded-2xl grid place-items-center" style={{ background: 'rgba(10,12,10,0.95)' }}>
                  <Target size={24} strokeWidth={1.5} className="text-lime" />
                </div>
              </div>
              <p className="inline-flex items-center gap-2 rounded-full px-4 h-8 text-xs font-semibold uppercase tracking-[0.12em] text-lime" style={{ border: '1px solid rgba(163,230,53,0.35)', background: 'rgba(163,230,53,0.08)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse-dot" style={{ boxShadow: '0 0 8px rgba(163,230,53,0.8)' }} />
                Version 2 · Live engine
              </p>
              <p className="text-sm font-light text-neutral-400 max-w-48">Certified badge and button pairing for launch surfaces.</p>
              <span className="inline-flex items-center gap-2 rounded-full px-5 h-10 text-xs font-semibold uppercase tracking-[0.1em] text-black" style={{ background: 'linear-gradient(180deg, #bef264, #a3e635)', boxShadow: '0 8px 30px rgba(163,230,53,0.25)' }}>
                <Play size={14} strokeWidth={1.5} fill="currentColor" />
                Open studio
              </span>
            </div>
          </div>
        </CornerFrame>

        {/* Footer */}
        <CornerFrame className="border border-white/[0.12]">
          <div className="px-5 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-neutral-600 tracking-widest uppercase font-mono">WINMIX STUDIO · Brand system board · v2.0</p>
            <p className="text-xs tracking-widest uppercase font-mono text-lime">Pattern locked · 07 / 07 modules</p>
          </div>
        </CornerFrame>
      </div>
    </div>
  );
}
