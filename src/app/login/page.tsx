'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import './login.css';

export default function LoginPage() {
  const router = useRouter();
  const { session, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!authLoading && session) {
      router.replace('/');
    }
  }, [session, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (authError) throw authError;

      router.replace('/');
    } catch {
      setError('Email o contraseña incorrectos');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading screen while checking auth state
  if (authLoading) {
    return (
      <div className="login-loading-screen">
        <div className="login-loading-spinner-lg" />
        <p className="login-loading-text">Verificando sesión…</p>
      </div>
    );
  }

  // If already logged in, show nothing while redirecting
  if (session) {
    return (
      <div className="login-loading-screen">
        <div className="login-loading-spinner-lg" />
        <p className="login-loading-text">Redirigiendo…</p>
      </div>
    );
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">
        {/* ── Icon ── */}
        <div className="login-icon-wrap">
          <div className="login-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
        </div>

        {/* ── Brand ── */}
        <h1 className="login-title">RC-699 Digital</h1>
        <p className="login-subtitle">Panel Administrativo</p>

        <hr className="login-divider" />

        {/* ── Section header ── */}
        <h2 className="login-section-title">Iniciar Sesión</h2>
        <p className="login-section-subtitle">Ingresa tus credenciales</p>

        {/* ── Error ── */}
        {error && (
          <div className="login-error">
            <svg className="login-error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} autoComplete="off">
          {/* ── Email ── */}
          <label htmlFor="login-email" className="login-label">Email</label>
          <div className="login-input-group">
            <svg className="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <input
              id="login-email"
              className="login-input"
              type="email"
              placeholder="admin@empresa.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          {/* ── Password ── */}
          <label htmlFor="login-password" className="login-label">Contraseña</label>
          <div className="login-input-group">
            <svg className="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input
              id="login-password"
              className="login-input"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              disabled={isLoading}
              autoComplete="current-password"
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              className="login-toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                  <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {/* ── Submit ── */}
          <button
            id="login-submit"
            type="submit"
            className="login-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="login-spinner" />
            ) : (
              'Ingresar'
            )}
          </button>
        </form>

        <p className="login-footer">
          © {new Date().getFullYear()} HLGAS — Todos los derechos reservados
        </p>
      </div>
    </div>
  );
}
