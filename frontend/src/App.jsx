import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import DashboardPage from './pages/DashboardPage';
import AnalysisPage from './pages/AnalysisPage';
import MarketPage from './pages/MarketPage';
import { usePolling } from './hooks/usePolling';
import { api } from './utils/api';

function App() {
  const { data: marketStatus } = usePolling(api.getMarketStatus, 60000);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-navy-950 flex flex-col">
        <Navbar marketStatus={marketStatus} />
        <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/analysis" element={<AnalysisPage />} />
            <Route path="/analysis/:ticker" element={<AnalysisPage />} />
            <Route path="/market" element={<MarketPage />} />
            <Route path="*" element={
              <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                  <h2 className="text-6xl font-bold text-text-muted/30 font-[family-name:var(--font-mono)]">404</h2>
                  <p className="text-text-secondary mt-3 text-lg">Page not found</p>
                </div>
              </div>
            } />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
