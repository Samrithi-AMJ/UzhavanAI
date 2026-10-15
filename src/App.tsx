import { useState } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import AuthPage from './pages/AuthPage';
import Layout, { type Page } from './components/Layout';
import Dashboard from './pages/Dashboard';
import ChatbotPage from './pages/ChatbotPage';
import WeatherPage from './pages/WeatherPage';
import CropAdvisorPage from './pages/CropAdvisorPage';
import ImageSearchPage from './pages/ImageSearchPage';
import FarmPage from './pages/FarmPage';
import { Loader2, Sprout } from 'lucide-react';

function AppContent() {
  const { session, loading } = useAuth();
  const [page, setPage] = useState<Page>('dashboard');

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600">
            <Sprout className="h-7 w-7 text-white" />
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
        </div>
      </div>
    );
  }

  if (!session) return <AuthPage />;

  return (
    <Layout current={page} onNavigate={setPage}>
      {page === 'dashboard' && <Dashboard onNavigate={setPage} />}
      {page === 'farm' && <FarmPage />}
      {page === 'chatbot' && <ChatbotPage />}
      {page === 'weather' && <WeatherPage />}
      {page === 'crops' && <CropAdvisorPage />}
      {page === 'image' && <ImageSearchPage />}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
