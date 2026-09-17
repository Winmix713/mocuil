import { useState } from 'react';
import { Menu, X, Activity, BarChart3, Palette, Home, type LucideIcon } from 'lucide-react';
import type { Page } from '@/types';

type NavBarProps = {
  current: Page;
  onNavigate: (page: Page) => void;
};

const NAV_ITEMS: { id: Page; label: string; icon: LucideIcon }[] = [
  { id: 'landing', label: 'Home', icon: Home },
  { id: 'dashboard', label: 'Match Engine', icon: Activity },
  { id: 'insights', label: 'Insights', icon: BarChart3 },
  { id: 'brand', label: 'Brand System', icon: Palette },
];

export function NavBar({ current, onNavigate }: NavBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (page: Page) => {
    onNavigate(page);
    setMobileOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.08]" style={{ background: 'rgba(5,6,7,0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <button onClick={() => handleNav('landing')} className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg grid place-items-center font-mono font-semibold text-sm text-lime" style={{ background: 'rgba(10,12,10,0.95)', border: '1px solid rgba(163,230,53,0.3)' }}>
              WX
            </div>
            <span className="text-lg font-semibold tracking-tight">
              WIN<span className="text-lime">MIX</span>
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = current === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`flex items-center gap-2 px-4 h-9 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'text-lime bg-lime/[0.08] border border-lime/30'
                      : 'text-neutral-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  <Icon size={15} strokeWidth={1.5} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Live indicator */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-lime">
            <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse-dot" style={{ boxShadow: '0 0 8px rgba(163,230,53,0.8)' }} />
            <span className="uppercase tracking-widest">Live</span>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg border border-white/[0.08] text-neutral-300 hover:text-white transition-colors"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/60 animate-fade-in" />
          <div className="absolute top-16 left-0 right-0 border-b border-white/[0.08] animate-slide-in" style={{ background: 'rgba(5,6,7,0.98)', backdropFilter: 'blur(20px)' }}>
            <nav className="flex flex-col p-4 gap-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = current === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={`flex items-center gap-3 px-4 h-12 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? 'text-lime bg-lime/[0.08] border border-lime/30'
                        : 'text-neutral-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                    }`}
                  >
                    <Icon size={18} strokeWidth={1.5} />
                    {item.label}
                  </button>
                );
              })}
              <div className="flex items-center gap-2 px-4 py-3 text-xs font-mono text-lime">
                <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse-dot" style={{ boxShadow: '0 0 8px rgba(163,230,53,0.8)' }} />
                <span className="uppercase tracking-widest">System v2 · Live</span>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
