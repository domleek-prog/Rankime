import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './components/AuthPage';
import MainApp from './components/MainApp';
import AppBackground from './components/AppBackground';

function AppInner() {
  const { user } = useAuth();

  if (user === undefined) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-white/30 text-sm animate-pulse">Loading…</div>
      </div>
    );
  }

  return user ? <MainApp /> : <AuthPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppBackground />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <AppInner />
      </div>
    </AuthProvider>
  );
}
