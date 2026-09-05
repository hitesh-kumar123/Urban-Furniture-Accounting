import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { useToast } from '../context/ToastContext';

export const LoginPage = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('Employee');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Email format regex
  const isValidEmail = (val) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  // Password Security Criteria
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  const isPasswordSecure = hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;

  const passedCriteriaCount = [hasMinLength, hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar].filter(Boolean).length;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    
    if (!cleanEmail) {
      showToast('Please enter your email address', 'error');
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      showToast('Please enter a valid email format (e.g. name@company.com)', 'error');
      return;
    }

    if (!password) {
      showToast('Please enter your password', 'error');
      return;
    }

    setLoading(true);
    const result = await login(cleanEmail.toLowerCase(), password);
    setLoading(false);
    if (result.success) {
      navigate('/');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      showToast('Please enter your full name', 'error');
      return;
    }

    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      showToast('Please provide a valid corporate email address', 'error');
      return;
    }

    if (!isPasswordSecure) {
      showToast('Password must fulfill all security criteria (Uppercase, Lowercase, Number, Special Character, 8+ chars)', 'error');
      return;
    }

    setLoading(true);
    const result = await register({
      name: cleanName,
      email: cleanEmail.toLowerCase(),
      password,
      role
    });
    setLoading(false);
    if (result.success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0D] flex flex-col justify-center items-center p-4 selection:bg-[#FF6B3D] selection:text-[#0B0B0D]">
      <div className="max-w-md w-full bg-[#111114] border border-white/10 rounded-xl p-6 sm:p-8 flex flex-col gap-6 shadow-2xl backdrop-blur-xl">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-1.5">
          <Link to="/landing" className="flex flex-col items-center gap-2 group">
            <div className="w-10 h-10 rounded-lg bg-[#FF6B3D] flex items-center justify-center text-[#0B0B0D] font-black text-xl group-hover:scale-105 transition-transform shadow-lg">
              S
            </div>
            <span className="text-xl font-bold text-[#F5F2EA] tracking-wider uppercase font-display">
              Staffora
            </span>
          </Link>
          <p className="text-xs text-[#6F6C69] font-mono">
            {isRegister ? 'Create Secure System Account' : 'Enterprise Authentication Gateway'}
          </p>
        </div>

        {/* Tab Toggle: Sign In vs Register */}
        <div className="flex bg-[#17171B] p-1 rounded-lg border border-white/5">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setPassword('');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              !isRegister ? 'bg-[#111114] text-[#F5F2EA] shadow-sm' : 'text-[#6F6C69] hover:text-[#A6A3A0]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setPassword('');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              isRegister ? 'bg-[#111114] text-[#F5F2EA] shadow-sm' : 'text-[#6F6C69] hover:text-[#A6A3A0]'
            }`}
          >
            Register Account
          </button>
        </div>

        {!isRegister ? (
          /* Sign In Form */
          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
            <div>
              <label className="staffora-label">Corporate Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="staffora-input font-mono text-xs pl-8"
                  placeholder="admin@peoplepay360.com"
                  autoComplete="email"
                />
                <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-sm text-[#6F6C69] pointer-events-none">
                  mail
                </span>
              </div>
              {email && !isValidEmail(email) && (
                <p className="text-[10px] text-[#FF5C5C] mt-1 font-mono">
                  ⚠ Please enter a valid email format
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="staffora-label">Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[10px] text-[#FF8A65] hover:text-[#FF6B3D] font-mono mb-1"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="staffora-input font-mono text-xs pl-8 pr-8"
                  placeholder="Enter your password..."
                  autoComplete="current-password"
                />
                <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-sm text-[#6F6C69] pointer-events-none">
                  lock
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-[#6F6C69] hover:text-[#F5F2EA] transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full mt-2 font-semibold"
            >
              Sign In to Platform
            </Button>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4">
            <div>
              <label className="staffora-label">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="staffora-input text-xs"
                placeholder="e.g. Rajesh Sharma"
              />
            </div>

            <div>
              <label className="staffora-label">Official Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="staffora-input font-mono text-xs"
                placeholder="rajesh@company.com"
                autoComplete="email"
              />
              {email && !isValidEmail(email) && (
                <p className="text-[10px] text-[#FF5C5C] mt-1 font-mono">
                  ⚠ Must be a valid corporate email format
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="staffora-label">Create Secure Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[10px] text-[#FF8A65] hover:text-[#FF6B3D] font-mono mb-1"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="staffora-input font-mono text-xs pr-8"
                  placeholder="Min 8 chars with Upper, Lower, Number & Symbol"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-[#6F6C69] hover:text-[#F5F2EA] transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>

              {/* Password Strength Checklist & Bar */}
              {password && (
                <div className="mt-2.5 p-2.5 bg-[#17171B] border border-white/5 rounded space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-[#6F6C69]">Security Strength:</span>
                    <span className={`font-bold ${
                      passedCriteriaCount === 5
                        ? 'text-[#39D98A]'
                        : passedCriteriaCount >= 3
                        ? 'text-[#F5B942]'
                        : 'text-[#FF5C5C]'
                    }`}>
                      {passedCriteriaCount === 5 ? 'Strong' : passedCriteriaCount >= 3 ? 'Medium' : 'Weak'}
                    </span>
                  </div>

                  {/* Visual Bar */}
                  <div className="w-full h-1 bg-[#0B0B0D] rounded-full overflow-hidden flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`flex-1 h-full transition-colors ${
                          i <= passedCriteriaCount
                            ? passedCriteriaCount === 5
                              ? 'bg-[#39D98A]'
                              : passedCriteriaCount >= 3
                              ? 'bg-[#F5B942]'
                              : 'bg-[#FF5C5C]'
                            : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Criteria Checklist */}
                  <div className="grid grid-cols-2 gap-1 text-[10px] font-mono pt-1">
                    <span className={`flex items-center gap-1 ${hasMinLength ? 'text-[#39D98A]' : 'text-[#6F6C69]'}`}>
                      <span className="material-symbols-outlined text-[12px]">{hasMinLength ? 'check' : 'close'}</span>
                      8+ Characters
                    </span>
                    <span className={`flex items-center gap-1 ${hasUpperCase ? 'text-[#39D98A]' : 'text-[#6F6C69]'}`}>
                      <span className="material-symbols-outlined text-[12px]">{hasUpperCase ? 'check' : 'close'}</span>
                      Uppercase (A-Z)
                    </span>
                    <span className={`flex items-center gap-1 ${hasLowerCase ? 'text-[#39D98A]' : 'text-[#6F6C69]'}`}>
                      <span className="material-symbols-outlined text-[12px]">{hasLowerCase ? 'check' : 'close'}</span>
                      Lowercase (a-z)
                    </span>
                    <span className={`flex items-center gap-1 ${hasNumber ? 'text-[#39D98A]' : 'text-[#6F6C69]'}`}>
                      <span className="material-symbols-outlined text-[12px]">{hasNumber ? 'check' : 'close'}</span>
                      Number (0-9)
                    </span>
                    <span className={`col-span-2 flex items-center gap-1 ${hasSpecialChar ? 'text-[#39D98A]' : 'text-[#6F6C69]'}`}>
                      <span className="material-symbols-outlined text-[12px]">{hasSpecialChar ? 'check' : 'close'}</span>
                      Special Symbol (!@#$%^&*)
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="staffora-label">System Role Access</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="staffora-input text-xs font-mono"
              >
                <option value="Employee">Employee (Self-Service Hub)</option>
                <option value="HR Manager">HR Manager (Ops &amp; Employees)</option>
                <option value="HR Payroll User">HR Payroll User (Compute Payruns)</option>
                <option value="HR Payroll Manager">HR Payroll Manager (Lock &amp; Disburse)</option>
                <option value="Admin">Admin (Full System Access)</option>
              </select>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full mt-2 font-semibold"
            >
              Create Account &amp; Log In
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
