import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Spinner } from '../components/ui/Spinner';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
    } catch (err) {
      toast(err.response?.data?.error || err.response?.data?.message || 'Credenciales invalidas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="login-container">
      <div className="login-card fade-in">
        <div className="login-brand">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <svg width="58" height="58" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
            <p className="login-metro">METRO<br />ICA</p>
          </div>
          <p className="login-subtitle">Sistema de Gestion Inteligente de Inventarios y Pedidos</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Usuario</label>
            <input className="form-input" type="email" value={form.email} onChange={update('email')} placeholder="Ingrese su usuario" required />
          </div>

          <div className="form-group">
            <label>Contrasena</label>
            <div className="password-row">
              <input className="form-input" type={showPassword ? 'text' : 'password'} value={form.password} onChange={update('password')} placeholder="Ingrese su contrasena" required />
              <button type="button" className="password-toggle" onClick={() => setShowPassword((v) => !v)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
              </button>
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', marginTop: 12, padding: '12px' }} disabled={loading}>
            {loading && <Spinner />}
            Iniciar sesion
          </button>

          <div className="login-extra-row">
            <label className="caption" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" /> Recordarme
            </label>
            <a href="#" className="caption">Olvido su contrasena?</a>
          </div>
        </form>
      </div>
    </div>
  );
}
