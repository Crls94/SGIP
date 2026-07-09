import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { Sidebar } from './components/ui/Sidebar';
import { TopBar } from './components/ui/TopBar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Productos from './pages/Productos';
import Movimientos from './pages/Movimientos';
import Pedidos from './pages/Pedidos';
import Alertas from './pages/Alertas';
import Inteligencia from './pages/Inteligencia';
import Reportes from './pages/Reportes';
import Usuarios from './pages/Usuarios';
import Proveedores from './pages/Proveedores';
import Notificaciones from './pages/Notificaciones';
import './styles/global.css';

const pageTitles = {
  '/dashboard': 'Metro Ica - Dashboard',
  '/productos': 'Inventario - Productos',
  '/movimientos': 'Control de Stock',
  '/pedidos': 'Pedidos',
  '/alertas': 'Alertas de Stock',
  '/inteligencia': 'IA Predictiva - Pronostico',
  '/reportes': 'Reportes',
  '/usuarios': 'Gestion de Usuarios',
  '/proveedores': 'Proveedores',
  '/notificaciones': 'Notificaciones',
};

const homeByRole = {
  ADMINISTRADOR: '/dashboard',
  GERENTE: '/dashboard',
  OPERARIO: '/pedidos',
};

function AppLayout({ children }) {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'SGIP';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopBar title={title} onMenuClick={() => setSidebarOpen((open) => !open)} />
      <main className="main-content">{children}</main>
    </div>
  );
}

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.rol)) return <Navigate to={homeByRole[user.rol] || '/login'} />;
  return <AppLayout>{children}</AppLayout>;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) {
    const destino = homeByRole[user.rol] || '/pedidos';
    return <Navigate to={destino} />;
  }
  return children;
}

function LoadingScreen() {
  return (
    <div className="login-container">
      <div style={{ textAlign: 'center' }}>
        <div className="spinner spinner-dark" style={{ width: 40, height: 40, margin: '0 auto' }} />
        <p className="caption mt-16">Cargando...</p>
      </div>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = storedTheme || (prefersDark ? 'dark' : 'light');
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute roles={['ADMINISTRADOR', 'GERENTE']}><Dashboard /></ProtectedRoute>} />
            <Route path="/productos" element={<ProtectedRoute roles={['ADMINISTRADOR', 'OPERARIO', 'GERENTE']}><Productos /></ProtectedRoute>} />
            <Route path="/movimientos" element={<ProtectedRoute roles={['ADMINISTRADOR', 'OPERARIO']}><Movimientos /></ProtectedRoute>} />
            <Route path="/pedidos" element={<ProtectedRoute roles={['ADMINISTRADOR', 'OPERARIO']}><Pedidos /></ProtectedRoute>} />
            <Route path="/alertas" element={<ProtectedRoute roles={['ADMINISTRADOR', 'OPERARIO', 'GERENTE']}><Alertas /></ProtectedRoute>} />
            <Route path="/inteligencia" element={<ProtectedRoute roles={['ADMINISTRADOR', 'GERENTE']}><Inteligencia /></ProtectedRoute>} />
            <Route path="/reportes" element={<ProtectedRoute roles={['ADMINISTRADOR', 'GERENTE']}><Reportes /></ProtectedRoute>} />
            <Route path="/usuarios" element={<ProtectedRoute roles={['ADMINISTRADOR']}><Usuarios /></ProtectedRoute>} />
            <Route path="/proveedores" element={<ProtectedRoute roles={['ADMINISTRADOR', 'OPERARIO', 'GERENTE']}><Proveedores /></ProtectedRoute>} />
            <Route path="/notificaciones" element={<ProtectedRoute roles={['ADMINISTRADOR', 'OPERARIO', 'GERENTE']}><Notificaciones /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
