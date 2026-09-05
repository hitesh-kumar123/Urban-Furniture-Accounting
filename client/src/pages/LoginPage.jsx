import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
    <div className="min-h-screen bg-[#0B0B0D] flex flex-col justify-center items-center p-4">
      <div className="max-w-sm w-full bg-[#111114] border border-white/10 rounded-lg p-6 flex flex-col gap-5 shadow-2xl">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-1.5">
          <Link to="/landing" className="flex flex-col items-center gap-1.5 group">
            <div className="w-9 h-9 rounded bg-[#FF6B3D] flex items-center justify-center text-[#0B0B0D] font-black text-lg group-hover:scale-105 transition-transform">
              S
            </div>
            <span className="text-lg font-bold text-[#F5F2EA] tracking-wider uppercase font-display">
              Staffora
            </span>
          </Link>
          <p className="text-xs text-[#6F6C69] font-mono">
            Midnight Workforce OS
          </p>
        </div>

        {/* Quick Demo Role Selector */}
        <div className="bg-[#17171B] p-2.5 rounded border border-white/5 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#6F6C69] font-semibold">
              Fast Demo Persona:
            </span>
            <span className="text-[9px] font-mono text-[#FF8A65]">1-Click Login</span>
          </div>
          <div className="grid grid-cols-1 gap-1">
            {DEMO_USERS.map((demo) => (
              <button
                key={demo.role}
                type="button"
                onClick={() => handleQuickLogin(demo)}
                className="w-full text-left px-2.5 py-1 rounded bg-[#111114] hover:bg-[#1E1E24] hover:text-[#FF8A65] text-[#A6A3A0] text-xs font-medium flex items-center justify-between transition-colors border border-white/5"
              >
                <span className="truncate">{demo.label}</span>
                <span className="material-symbols-outlined text-xs text-[#6F6C69]">
                  arrow_forward
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div>
            <label className="staffora-label">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="staffora-input font-mono text-xs"
              placeholder="name@company.com"
            />
          </div>

          <div>
            <label className="staffora-label">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="staffora-input font-mono text-xs"
              placeholder="••••••••"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full mt-1 font-semibold"
          >
            Authenticate Session
          </Button>

          <div className="text-center pt-2 border-t border-white/5">
            <Link
              to="/landing"
              className="text-xs text-[#6F6C69] hover:text-[#A6A3A0] font-mono flex items-center justify-center gap-1"
            >
              <span>← Back to Platform Landing</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
