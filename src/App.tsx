import { useState, useEffect } from 'react';
import { NavBar } from '@/components/NavBar';
import { LandingPage } from '@/components/LandingPage';
import { DashboardPage } from '@/components/DashboardPage';
import { InsightsPage } from '@/components/InsightsPage';
import { BrandPage } from '@/components/BrandPage';
import type { Page, MatchPrediction } from '@/types';

function App() {
  const [page, setPage] = useState<Page>('landing');
  const [predictions, setPredictions] = useState<MatchPrediction[]>([]);

  const handleNavigate = (next: Page) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [page]);

  return (
    <div className="relative min-h-screen">
      {/* Background layers */}
      <div className="stadium-background" />
      <div className="ambient-glow" />
      <div className="diagonal-texture" />

      {/* Navigation */}
      <NavBar current={page} onNavigate={handleNavigate} />

      {/* Page content */}
      <main className="relative z-10">
        {page === 'landing' && <LandingPage onNavigate={handleNavigate} />}
        {page === 'dashboard' && (
          <DashboardPage onNavigate={handleNavigate} onPredictionsReady={setPredictions} />
        )}
        {page === 'insights' && <InsightsPage predictions={predictions} onNavigate={handleNavigate} />}
        {page === 'brand' && <BrandPage />}
      </main>
    </div>
  );
}

export default App;
