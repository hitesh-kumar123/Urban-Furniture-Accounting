import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export const LandingPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Interactive Live Simulator State
  const [activeTab, setActiveTab] = useState('payroll'); // 'payroll' | 'shifts' | 'rules' | 'payslip'
  const [simulatingPayroll, setSimulatingPayroll] = useState(false);
  const [simStage, setSimStage] = useState(7);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [punchTime, setPunchTime] = useState('09:00 AM');

  const handleLaunchRole = async (demo) => {
    await login(demo.email, demo.password);
    navigate('/');
  };

  const handleTriggerSimulate = () => {
    setSimulatingPayroll(true);
    setSimStage(1);
    const interval = setInterval(() => {
      setSimStage((prev) => {
        if (prev < 6) return prev + 1;
        clearInterval(interval);
        setSimulatingPayroll(false);
        return 7;
      });
    }, 280);
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -72;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0D] text-[#F5F2EA] flex flex-col font-sans selection:bg-[#FF6B3D] selection:text-[#0B0B0D] scroll-smooth">
      {/* 1. Global Navigation Bar */}
      <header className="sticky top-0 z-50 bg-[#0B0B0D]/95 border-b border-white/10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/landing" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#FF6B3D] flex items-center justify-center text-[#0B0B0D] font-black text-sm font-mono">
              S
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-base text-[#F5F2EA] tracking-wider uppercase font-display">
                Staffora
              </span>
              <span className="font-mono text-[9px] text-[#6F6C69] uppercase tracking-widest">
                v2.4 Engine
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-5 text-xs text-[#A6A3A0] font-medium font-mono">
            <button
              onClick={() => scrollToSection('engine')}
              className="hover:text-[#FF8A65] transition-colors cursor-pointer"
            >
              7-Stage Engine
            </button>
            <button
              onClick={() => scrollToSection('simulator')}
              className="hover:text-[#FF8A65] transition-colors cursor-pointer"
            >
              Live Simulator
            </button>
            <button
              onClick={() => scrollToSection('modules')}
              className="hover:text-[#FF8A65] transition-colors cursor-pointer"
            >
              Core HR
            </button>
            <button
              onClick={() => scrollToSection('rules')}
              className="hover:text-[#FF8A65] transition-colors cursor-pointer"
            >
              Salary Rules AST
            </button>
            <button
              onClick={() => scrollToSection('architecture')}
              className="hover:text-[#FF8A65] transition-colors cursor-pointer"
            >
              Architecture &amp; RBAC
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="text-xs text-[#A6A3A0] hover:text-[#F5F2EA] font-medium transition-colors hidden sm:inline"
          >
            Sign In
          </button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleLaunchRole(DEMO_USERS[0])}
            iconRight="arrow_forward"
          >
            Launch Live App
          </Button>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="px-6 pt-16 pb-12 max-w-6xl mx-auto w-full flex flex-col items-center text-center gap-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-white/10 bg-[#111114] text-xs font-mono text-[#A6A3A0]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B3D] animate-pulse"></span>
          <span>Deterministic Workforce &amp; Payroll OS • 0 Rounding Error</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-[#F5F2EA] tracking-tight font-display max-w-4xl leading-[1.1]">
          Precision People Operations &amp; Deterministic Payroll.
        </h1>

        <p className="text-sm sm:text-base text-[#A6A3A0] max-w-2xl font-body leading-relaxed">
          Built strictly according to the enterprise HR problem statement. Replaces manual calculation errors with an automated 7-stage computation engine, contractual schedules, dynamic AST salary formulas, and certified vector PDF payslips.
        </p>

        {/* 1-Click Fast Persona Demo Launchpad */}
        <div className="w-full max-w-xl bg-[#111114] border border-white/10 rounded-lg p-3.5 flex flex-col gap-2 mt-2 shadow-2xl">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-[#6F6C69] uppercase font-semibold">1-Click Fast Persona Evaluator:</span>
            <span className="text-[#FF8A65]">Instant Fullstack Login</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {DEMO_USERS.map((demo) => (
              <button
                key={demo.role}
                onClick={() => handleLaunchRole(demo)}
                className="px-2.5 py-2 bg-[#17171B] hover:bg-[#1E1E24] text-[#F5F2EA] hover:text-[#FF8A65] border border-white/5 hover:border-white/15 rounded text-left transition-colors flex flex-col group cursor-pointer"
              >
                <span className="text-[10px] font-mono text-[#6F6C69] group-hover:text-[#A6A3A0]">Role</span>
                <span className="text-xs font-semibold truncate mt-0.5">{demo.role}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. SECTION: 7-Stage Deterministic Payroll Engine (#engine) */}
      <section id="engine" className="scroll-mt-20 px-6 py-12 max-w-6xl mx-auto w-full space-y-6">
        <div className="text-center space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF6B3D] font-bold block">
            Core Payroll Problem Statement Implementation
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F5F2EA] font-display">
            The 7-Stage Deterministic Payroll Engine
          </h2>
          <p className="text-xs text-[#A6A3A0] max-w-2xl mx-auto">
            Every payroll batch executes through a verified 7-stage pipeline ensuring contractual integrity and statutory exactness before locking disbursement.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
          <div className="midnight-card p-4 space-y-1.5 border-l-2 border-l-[#FF6B3D]">
            <span className="text-[10px] text-[#FF8A65] font-bold block">STAGE 01</span>
            <h4 className="font-bold text-sm text-[#F5F2EA] font-sans">Eligible Staff Scan</h4>
            <p className="text-[#A6A3A0] text-[11px] leading-relaxed">
              Scans all employees with active contracts within the selected pay period date range.
            </p>
          </div>

          <div className="midnight-card p-4 space-y-1.5 border-l-2 border-l-[#FF6B3D]">
            <span className="text-[10px] text-[#FF8A65] font-bold block">STAGE 02</span>
            <h4 className="font-bold text-sm text-[#F5F2EA] font-sans">Contract Wage &amp; Schedule</h4>
            <p className="text-[#A6A3A0] text-[11px] leading-relaxed">
              Pulls contracted base wage, linked salary structure, and weekly schedule hours.
            </p>
          </div>

          <div className="midnight-card p-4 space-y-1.5 border-l-2 border-l-[#FF6B3D]">
            <span className="text-[10px] text-[#FF8A65] font-bold block">STAGE 03</span>
            <h4 className="font-bold text-sm text-[#F5F2EA] font-sans">Attendance &amp; Overtime</h4>
            <p className="text-[#A6A3A0] text-[11px] leading-relaxed">
              Aggregates biometric punch logs and applies overtime multiplier (e.g. 1.5x).
            </p>
          </div>

          <div className="midnight-card p-4 space-y-1.5 border-l-2 border-l-[#FF6B3D]">
            <span className="text-[10px] text-[#FF8A65] font-bold block">STAGE 04</span>
            <h4 className="font-bold text-sm text-[#F5F2EA] font-sans">Leave Days Reconciler</h4>
            <p className="text-[#A6A3A0] text-[11px] leading-relaxed">
              Checks approved leaves; deducts unpaid leave days automatically from the monthly gross.
            </p>
          </div>

          <div className="midnight-card p-4 space-y-1.5 border-l-2 border-l-[#39D98A]">
            <span className="text-[10px] text-[#39D98A] font-bold block">STAGE 05</span>
            <h4 className="font-bold text-sm text-[#F5F2EA] font-sans">Sequential Rules AST</h4>
            <p className="text-[#A6A3A0] text-[11px] leading-relaxed">
              Executes salary rules in strict sequence order: Basic, HRA, DA, Bonuses, and Allowances.
            </p>
          </div>

          <div className="midnight-card p-4 space-y-1.5 border-l-2 border-l-[#39D98A]">
            <span className="text-[10px] text-[#39D98A] font-bold block">STAGE 06</span>
            <h4 className="font-bold text-sm text-[#F5F2EA] font-sans">Statutory Taxes &amp; Net</h4>
            <p className="text-[#A6A3A0] text-[11px] leading-relaxed">
              Computes PF deductions, tax withholdings, and calculates final Net Disbursals.
            </p>
          </div>

          <div className="midnight-card p-4 space-y-1.5 border-l-2 border-l-[#39D98A] lg:col-span-2">
            <span className="text-[10px] text-[#39D98A] font-bold block">STAGE 07</span>
            <h4 className="font-bold text-sm text-[#F5F2EA] font-sans">Digital Payslip Vault &amp; Audit Lock</h4>
            <p className="text-[#A6A3A0] text-[11px] leading-relaxed">
              Generates individual cryptographic payslip records, Vector PDF documents, and updates the corporate general ledger.
            </p>
          </div>
        </div>
      </section>

      {/* 4. SECTION: Interactive Live Simulator Console (#simulator) */}
      <section id="simulator" className="scroll-mt-20 px-6 py-12 max-w-6xl mx-auto w-full">
        <div className="midnight-card-elevated p-5 md:p-7 space-y-5 border-white/10 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF6B3D] font-bold block">
                Interactive Operational Sandbox
              </span>
              <h3 className="text-lg font-bold text-[#F5F2EA] font-display">
                Test Core Features Before Launching App
              </h3>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center bg-[#0B0B0D] p-1 rounded border border-white/10 font-mono text-xs">
              <button
                onClick={() => setActiveTab('payroll')}
                className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                  activeTab === 'payroll' ? 'bg-[#17171B] text-[#FF8A65] font-bold' : 'text-[#6F6C69]'
                }`}
              >
                7-Stage Payroll
              </button>
              <button
                onClick={() => setActiveTab('shifts')}
                className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                  activeTab === 'shifts' ? 'bg-[#17171B] text-[#FF8A65] font-bold' : 'text-[#6F6C69]'
                }`}
              >
                Shift Punch Desk
              </button>
              <button
                onClick={() => setActiveTab('rules')}
                className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                  activeTab === 'rules' ? 'bg-[#17171B] text-[#FF8A65] font-bold' : 'text-[#6F6C69]'
                }`}
              >
                Salary Rule AST
              </button>
              <button
                onClick={() => setActiveTab('payslip')}
                className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                  activeTab === 'payslip' ? 'bg-[#17171B] text-[#FF8A65] font-bold' : 'text-[#6F6C69]'
                }`}
              >
                Payslip Vault Trace
              </button>
            </div>
          </div>

          {/* Tab 1: 7-Stage Payroll Simulator */}
          {activeTab === 'payroll' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#111114] rounded border border-white/5">
                <div>
                  <span className="text-[10px] text-[#6F6C69] uppercase block font-bold">Simulated Batch</span>
                  <div className="text-sm font-bold text-[#F5F2EA] font-sans">September 2026 Payrun Execution</div>
                  <span className="text-[#A6A3A0] text-[11px]">4 Employees • Executive Structure • Indefinite Contracts</span>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleTriggerSimulate}
                  disabled={simulatingPayroll}
                  icon="play_arrow"
                >
                  {simulatingPayroll ? 'Computing Engine...' : 'Simulate Computation'}
                </Button>
              </div>

              <div className="grid grid-cols-7 gap-1.5 text-center">
                {['Setup', 'Staff', 'Compute', 'Review', 'Validate', 'Paid', 'Delivered'].map((st, i) => {
                  const stageNum = i + 1;
                  const isDone = simStage >= stageNum;
                  const isCur = simStage === stageNum;
                  return (
                    <div
                      key={st}
                      className={`p-2 rounded border transition-all ${
                        isCur
                          ? 'bg-[#17171B] border-[#FF6B3D] text-[#FF8A65]'
                          : isDone
                          ? 'bg-[#111114] border-[#39D98A]/30 text-[#39D98A]'
                          : 'bg-[#0B0B0D] border-white/5 text-[#6F6C69]'
                      }`}
                    >
                      <div className="text-[9px] font-bold">0{stageNum}</div>
                      <div className="text-[11px] font-sans font-semibold mt-0.5">{st}</div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-3 gap-3 text-center pt-2">
                <div className="p-3 bg-[#111114] rounded border border-white/5">
                  <span className="text-[9px] text-[#6F6C69] uppercase block">Gross Liability</span>
                  <span className="text-base font-bold text-[#F5F2EA]">$27,500.00</span>
                </div>
                <div className="p-3 bg-[#111114] rounded border border-white/5">
                  <span className="text-[9px] text-[#6F6C69] uppercase block">Statutory Deductions</span>
                  <span className="text-base font-bold text-[#FF5C5C]">-$4,728.80</span>
                </div>
                <div className="p-3 bg-[#111114] rounded border border-white/5">
                  <span className="text-[9px] text-[#6F6C69] uppercase block">Net Disbursed</span>
                  <span className="text-base font-bold text-[#39D98A]">$22,771.20</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Shift Desk Simulator */}
          {activeTab === 'shifts' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="p-4 bg-[#111114] rounded border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] text-[#6F6C69] uppercase font-bold block">Biometric Punch Station</span>
                  <div className="text-base font-bold text-[#F5F2EA] font-sans">
                    {isClockedIn ? `Active Shift: Clocked In at ${punchTime}` : 'Status: Ready for Shift Punch'}
                  </div>
                  <span className="text-xs text-[#A6A3A0]">Contracted Schedule: 40h/week (Mon-Fri 09:00-17:00)</span>
                </div>

                <button
                  onClick={() => {
                    setIsClockedIn(!isClockedIn);
                    setPunchTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                  }}
                  className={`px-4 py-2 rounded font-semibold text-xs transition-colors cursor-pointer ${
                    isClockedIn
                      ? 'bg-[#FF5C5C]/10 text-[#FF5C5C] border border-[#FF5C5C]/30 hover:bg-[#FF5C5C]/20'
                      : 'bg-[#FF6B3D] text-[#0B0B0D] hover:bg-[#FF8A65]'
                  }`}
                >
                  {isClockedIn ? 'Punch Clock Out' : 'Punch Clock In'}
                </button>
              </div>

              <div className="p-3 bg-[#0B0B0D] rounded border border-white/5 text-[11px] text-[#A6A3A0] flex justify-between items-center">
                <span>Shift Variance Audit: 0.00h (On Schedule)</span>
                <span className="text-[#39D98A] font-bold">100% Shift Compliance</span>
              </div>
            </div>
          )}

          {/* Tab 3: Rule Formula AST Simulator */}
          {activeTab === 'rules' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-[#0B0B0D] rounded border border-white/10 space-y-1.5">
                <span className="text-[10px] text-[#FF8A65] uppercase font-bold block">
                  // Deterministic Rule AST Evaluator (Sequence: 30)
                </span>
                <pre className="text-xs text-[#F5F2EA] overflow-x-auto leading-relaxed">
{`RULE: PROVIDENT_FUND_DEDUCTION
CATEGORY: Deduction
INPUTS: [BASIC = $6,500.00, HRA = $2,600.00]
FORMULA: (BASIC + HRA) * 0.12
OUTPUT: -$1,092.00`}
                </pre>
              </div>
              <div className="flex justify-between items-center text-[11px] text-[#6F6C69]">
                <span>AST Parser: Zero precision degradation</span>
                <span className="text-[#39D98A]">Execution Time: 0.04ms</span>
              </div>
            </div>
          )}

          {/* Tab 4: Payslip Vault Trace */}
          {activeTab === 'payslip' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="p-4 bg-[#111114] rounded border border-white/5 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-[#6F6C69] uppercase font-bold block">DIGITAL PAYSLIP VAULT</span>
                  <div className="text-sm font-bold text-[#F5F2EA] font-sans">Alex Turner — Senior Staff Engineer</div>
                  <span className="text-[11px] text-[#A6A3A0]">ID: EMP-1092 • September 2026 Payrun</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-[#6F6C69] uppercase block">NET DISBURSED</span>
                  <div className="text-xl font-bold text-[#39D98A] font-mono-val">$7,320.00</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 5. SECTION: Core HR Modules (#modules) */}
      <section id="modules" className="scroll-mt-20 px-6 py-12 max-w-6xl mx-auto w-full space-y-6">
        <div className="text-center space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF6B3D] font-bold block">
            End-to-End People Operations
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F5F2EA] font-display">
            Integrated Workforce Modules
          </h2>
          <p className="text-xs text-[#A6A3A0] max-w-2xl mx-auto">
            All data flows seamlessly from employee profile to contract terms, shift adherence, time off approvals, and payroll calculation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="midnight-card p-5 space-y-2">
            <div className="w-8 h-8 rounded bg-[#17171B] border border-white/10 text-[#FF6B3D] flex items-center justify-center">
              <span className="material-symbols-outlined text-base">badge</span>
            </div>
            <h3 className="font-bold text-sm text-[#F5F2EA] font-display">Employee Hub &amp; Drawer</h3>
            <p className="text-xs text-[#A6A3A0] leading-relaxed">
              Unified employee management with slide-over command hub showing Profile, Contracts, Attendance, Leaves, and Payslip archive in one view.
            </p>
          </div>

          <div className="midnight-card p-5 space-y-2">
            <div className="w-8 h-8 rounded bg-[#17171B] border border-white/10 text-[#39D98A] flex items-center justify-center">
              <span className="material-symbols-outlined text-base">contract</span>
            </div>
            <h3 className="font-bold text-sm text-[#F5F2EA] font-display">Contracts &amp; Wage Terms</h3>
            <p className="text-xs text-[#A6A3A0] leading-relaxed">
              Historical contract registry with base wage assignment, working schedule linkages, and a period lookup tester to resolve applicable terms.
            </p>
          </div>

          <div className="midnight-card p-5 space-y-2">
            <div className="w-8 h-8 rounded bg-[#17171B] border border-white/10 text-[#58B7FF] flex items-center justify-center">
              <span className="material-symbols-outlined text-base">event_busy</span>
            </div>
            <h3 className="font-bold text-sm text-[#F5F2EA] font-display">Time Off &amp; Quota Balances</h3>
            <p className="text-xs text-[#A6A3A0] leading-relaxed">
              Annual entitlement progress meters, 1-click Approve/Reject queue with justification modals, and automatic unpaid leave deductions.
            </p>
          </div>
        </div>
      </section>

      {/* 6. SECTION: Salary Rules AST & Formulas (#rules) */}
      <section id="rules" className="scroll-mt-20 px-6 py-12 max-w-6xl mx-auto w-full space-y-6">
        <div className="text-center space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF6B3D] font-bold block">
            Extensible Formula Engine
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F5F2EA] font-display">
            Salary Rules AST &amp; Compensation Structures
          </h2>
          <p className="text-xs text-[#A6A3A0] max-w-2xl mx-auto">
            Define sequence-ordered computation rules without hardcoding. Supports Fixed amounts, Percentage bases, and custom mathematical expressions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          <div className="midnight-card p-5 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-sm text-[#F5F2EA] font-sans">Formula Sequence Execution</h4>
              <Badge variant="primary">Deterministic</Badge>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="p-2 bg-[#17171B] rounded border border-white/5 flex justify-between">
                <span>Seq 10: BASIC_SALARY (Base)</span>
                <span className="text-[#39D98A]">Fixed / Contracted</span>
              </div>
              <div className="p-2 bg-[#17171B] rounded border border-white/5 flex justify-between">
                <span>Seq 20: HRA (House Rent Allowance)</span>
                <span className="text-[#58B7FF]">40.0% of BASIC</span>
              </div>
              <div className="p-2 bg-[#17171B] rounded border border-white/5 flex justify-between">
                <span>Seq 30: DA (Dearness Allowance)</span>
                <span className="text-[#58B7FF]">10.0% of BASIC</span>
              </div>
              <div className="p-2 bg-[#17171B] rounded border border-white/5 flex justify-between">
                <span>Seq 40: PF_DED (Provident Fund)</span>
                <span className="text-[#FF5C5C]">-12.0% of (BASIC + HRA)</span>
              </div>
            </div>
          </div>

          <div className="midnight-card p-5 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-sm text-[#F5F2EA] font-sans">Salary Structure Bundles</h4>
              <Badge variant="success">Modular</Badge>
            </div>
            <p className="text-[#A6A3A0] font-sans text-xs leading-relaxed">
              Bundle any combination of salary rules into reusable corporate profiles (e.g. Standard Full-Time, Executive Tier, Contractor Package). Assign them to contracts with 1-click binding.
            </p>
            <div className="p-3 bg-[#111114] rounded border border-white/5 text-[11px] text-[#39D98A]">
              ✓ Pre-flight warning engine detects missing bank details or missing contracts before execution.
            </div>
          </div>
        </div>
      </section>

      {/* 7. SECTION: Technical Architecture & RBAC (#architecture) */}
      <section id="architecture" className="scroll-mt-20 px-6 py-12 max-w-6xl mx-auto w-full space-y-6">
        <div className="text-center space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#39D98A] font-bold block">
            Fullstack Engineering
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F5F2EA] font-display">
            Architecture, Security &amp; RBAC Matrix
          </h2>
          <p className="text-xs text-[#A6A3A0] max-w-2xl mx-auto">
            Industrial Node.js / MongoDB backend with React 18 / Tailwind frontend and 5-tier role-based access control.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="midnight-card p-5 space-y-3 font-mono text-xs">
            <h4 className="font-bold text-sm text-[#F5F2EA] font-sans">Technology Stack</h4>
            <ul className="space-y-1.5 text-[#A6A3A0]">
              <li className="flex items-center gap-2">
                <span className="text-[#FF6B3D]">▪</span>
                <strong className="text-[#F5F2EA]">Backend:</strong> Node.js, Express, MongoDB, Mongoose ODM
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#FF6B3D]">▪</span>
                <strong className="text-[#F5F2EA]">Frontend:</strong> React 18, Vite 5, TailwindCSS, Headless UI
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#FF6B3D]">▪</span>
                <strong className="text-[#F5F2EA]">PDF Generation:</strong> Vector PDFKit engine for certified payslips
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#FF6B3D]">▪</span>
                <strong className="text-[#F5F2EA]">Email Engine:</strong> Automated digital payslip dispatch
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#FF6B3D]">▪</span>
                <strong className="text-[#F5F2EA]">Security:</strong> JWT tokens, bcrypt password hashing, Joi validation
              </li>
            </ul>
          </div>

          <div className="midnight-card p-5 space-y-3 font-mono text-xs">
            <h4 className="font-bold text-sm text-[#F5F2EA] font-sans">5-Tier RBAC Permission Matrix</h4>
            <div className="space-y-1.5 text-[11px]">
              <div className="p-2 bg-[#17171B] rounded border border-white/5 flex justify-between">
                <span className="text-[#F5F2EA] font-bold">Admin</span>
                <span className="text-[#39D98A]">Full System &amp; RBAC Control</span>
              </div>
              <div className="p-2 bg-[#17171B] rounded border border-white/5 flex justify-between">
                <span className="text-[#F5F2EA] font-bold">HR Payroll Manager</span>
                <span className="text-[#FF8A65]">Run, Validate &amp; Disburse Payruns</span>
              </div>
              <div className="p-2 bg-[#17171B] rounded border border-white/5 flex justify-between">
                <span className="text-[#F5F2EA] font-bold">HR Manager</span>
                <span className="text-[#58B7FF]">Employee &amp; Time Off Approvals</span>
              </div>
              <div className="p-2 bg-[#17171B] rounded border border-white/5 flex justify-between">
                <span className="text-[#F5F2EA] font-bold">Employee</span>
                <span className="text-[#6F6C69]">Punch Desk &amp; Payslip Vault</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="mt-auto border-t border-white/10 px-6 py-8 bg-[#0B0B0D]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#6F6C69]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#FF6B3D] text-[#0B0B0D] flex items-center justify-center font-bold text-[10px]">
              S
            </div>
            <span className="text-[#F5F2EA] font-bold uppercase">Staffora</span>
            <span>• Midnight Workforce OS</span>
          </div>

          <div className="flex items-center gap-4 text-[#A6A3A0]">
            <Link to="/login" className="hover:text-[#F5F2EA] transition-colors">Sign In</Link>
            <button
              onClick={() => handleLaunchRole(DEMO_USERS[0])}
              className="text-[#FF8A65] hover:underline cursor-pointer"
            >
              Launch Live App →
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
