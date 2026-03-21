import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CreatePage from './pages/CreatePage';
import CagnottePage from './pages/CagnottePage';
import AdminPage from './pages/AdminPage';
import { useCagnotteStore } from './store/useCagnotteStore';
import { USE_SUPABASE } from './services/dataService';

function Spinner() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin" />
      <p className="text-white/40 text-sm">Chargement{USE_SUPABASE ? ' depuis Supabase' : ''}…</p>
    </div>
  );
}

function AppRoutes() {
  const { cagnotte, loading, error } = useCagnotteStore();

  if (loading) return <Spinner />;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass rounded-2xl p-8 max-w-sm w-full text-center">
          <p className="text-4xl mb-3">⚠️</p>
          <p className="text-white font-semibold mb-2">Erreur de connexion</p>
          <p className="text-white/50 text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary px-6 py-2.5 rounded-xl text-white text-sm font-semibold"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={cagnotte ? <Navigate to="/cagnotte" replace /> : <CreatePage />}
      />
      <Route
        path="/cagnotte"
        element={cagnotte ? <CagnottePage /> : <Navigate to="/" replace />}
      />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
