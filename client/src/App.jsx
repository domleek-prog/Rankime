import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './components/AuthPage';
import MainApp from './components/MainApp';

function AppInner() {
  const { user } = useAuth();

  if (user === undefined) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#0f0f13]">
        <div className="text-gray-600 text-sm animate-pulse">Loading…</div>
      </div>
    );
  }

  return user ? <MainApp /> : <AuthPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
