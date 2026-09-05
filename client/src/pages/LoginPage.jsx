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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative">
      <div className="max-w-md w-full staffora-card p-8 z-10 flex flex-col gap-6 shadow-sm border border-slate-200">
        {/* Logo & Title */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <span className="material-symbols-outlined text-2xl">hub</span>
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">
              Staffora
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Enterprise Human Resource &amp; Payroll Platform
          </p>
        </div>

        {/* Quick Demo Personas 1-Click Login */}
        <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-lg flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              Fast Demo Login
            </span>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded font-semibold">
              Select Role
            </span>
          </div>
          <div className="grid grid-cols-1 gap-1">
            {DEMO_USERS.map((demo) => (
              <button
                key={demo.role}
                type="button"
                onClick={() => handleQuickLogin(demo)}
                className="w-full text-left px-3 py-1.5 rounded-md bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-medium flex items-center justify-between transition-colors border border-slate-200 group"
              >
                <span>{demo.label}</span>
                <span className="material-symbols-outlined text-xs text-slate-400 group-hover:text-indigo-600">
                  arrow_forward
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="staffora-label">
              Email Address
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                mail
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="staffora-input pl-10 text-xs"
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="staffora-label">
              Password
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                lock
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="staffora-input pl-10 text-xs"
                placeholder="••••••••"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full mt-2"
          >
            Sign In to Staffora
          </Button>
        </form>
      </div>
    </div>
  );
};
