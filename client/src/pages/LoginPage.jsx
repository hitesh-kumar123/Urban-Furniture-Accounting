import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { Button } from '../components/common/Button';

export const LoginPage = () => {
  const [email, setEmail] = useState('admin@peoplepay360.com');
  const [password, setPassword] = useState('Password@123');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      navigate('/');
    }
  };

  const handleQuickLogin = async (demo) => {
    setEmail(demo.email);
    setPassword(demo.password);
    setLoading(true);
    const result = await login(demo.email, demo.password);
    setLoading(false);
    if (result.success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-secondary-fixed opacity-40 blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-tertiary-fixed opacity-40 blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full bg-surface-container-lowest rounded-3xl shadow-xl border border-outline-variant/30 p-8 z-10 flex flex-col gap-6">
        {/* Logo & Title */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white shadow-lg shadow-primary/25 shrink-0">
              <span className="material-symbols-outlined text-2xl">hub</span>
            </div>
            <span className="font-headline-md text-headline-md font-bold text-primary tracking-tight">
              Staffora
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Integrated Human Resource &amp; Payroll Operations
          </p>
        </div>

        {/* Quick Demo Personas 1-Click Login */}
        <div className="bg-surface-container-low p-3.5 rounded-2xl flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-bold">
              ⚡ Quick Demo Login
            </span>
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
              Hackathon Ready
            </span>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {DEMO_USERS.map((demo) => (
              <button
                key={demo.role}
                type="button"
                onClick={() => handleQuickLogin(demo)}
                className="w-full text-left px-3 py-1.5 rounded-xl bg-surface-container-lowest hover:bg-primary hover:text-white text-on-surface text-xs font-semibold flex items-center justify-between transition-all duration-200 shadow-sm border border-outline-variant/20 group"
              >
                <span>{demo.label}</span>
                <span className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  arrow_forward
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
              Email Address
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
                mail
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low rounded-xl text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
                placeholder="name@peoplepay360.com"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
              Password
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
                lock
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low rounded-xl text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
                placeholder="••••••••"
              />
            </div>
          </div>

          <Button type="submit" loading={loading} className="w-full py-3 mt-2">
            Sign In to Staffora
          </Button>
        </form>

        <div className="text-center font-caption text-caption text-outline">
          Enterprise RBAC Enforced • AES-256 Encrypted Session
        </div>
      </div>
    </div>
  );
};
