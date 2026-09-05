import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
    <div className="min-h-screen bg-[#F7F5F1] text-[#1C1B19] flex flex-col font-body selection:bg-[#0F5C4A] selection:text-white scroll-smooth">
      {/* 1. Global Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[#E7E2D9] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/landing" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#0F5C4A] flex items-center justify-center text-white font-bold text-sm font-mono">
              S
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-heading font-bold text-lg text-[#1C1B19]">
                Staffora
              </span>
              <span className="font-mono text-[10px] text-[#6B665C]">
                v2.4
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-5 text-xs text-[#6B665C] font-medium">
            <button
              onClick={() => scrollToSection('engine')}
              className="hover:text-[#0F5C4A] transition-colors cursor-pointer"
            >
              7-Stage Engine
            </button>
            <button
              onClick={() => scrollToSection('simulator')}
              className="hover:text-[#0F5C4A] transition-colors cursor-pointer"
            >
              Live Simulator
            </button>
            <button
              onClick={() => scrollToSection('modules')}
              className="hover:text-[#0F5C4A] transition-colors cursor-pointer"
            >
              Core HR
            </button>
            <button
              onClick={() => scrollToSection('rules')}
              className="hover:text-[#0F5C4A] transition-colors cursor-pointer"
            >
              Salary Rules AST
            </button>
            <button
              onClick={() => scrollToSection('architecture')}
              className="hover:text-[#0F5C4A] transition-colors cursor-pointer"
            >
              Architecture &amp; RBAC
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="text-xs text-[#6B665C] hover:text-[#1C1B19] font-medium transition-colors hidden sm:inline"
          >
            Sign in
          </button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/login')}
            iconRight="arrow_forward"
          >
            Access Platform
          </Button>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="px-6 pt-16 pb-12 max-w-5xl mx-auto w-full flex flex-col items-center text-center gap-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#E7E2D9] bg-white text-xs font-mono text-[#6B665C] shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#0F5C4A]"></span>
          <span>Deterministic Workforce &amp; Payroll Engine • Zero Rounding Error</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-heading font-medium text-[#1C1B19] tracking-tight max-w-4xl leading-[1.15]">
          Precision People Operations &amp; Deterministic Payroll
        </h1>

        <p className="text-sm sm:text-base text-[#6B665C] max-w-2xl font-body leading-relaxed">
          Replaces manual calculation errors with an automated 7-stage computation engine, contractual schedules, dynamic AST salary formulas, and certified vector PDF payslips.
        </p>

        {/* Primary Call to Action */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/login')}
            className="px-6 py-2.5 font-medium text-sm shadow-sm"
          >
            Open Payroll Workspace
          </Button>
          <button
            onClick={() => navigate('/login')}
            className="px-5 py-2.5 rounded-md bg-white hover:bg-[#FAF9F6] text-[#1C1B19] border border-[#E7E2D9] text-xs font-medium transition-colors shadow-sm"
          >
            Register Organization Account
          </button>
        </div>
      </section>

      {/* 3. SECTION: 7-Stage Deterministic Payroll Engine (#engine) */}
      <section id="engine" className="scroll-mt-20 px-6 py-12 max-w-5xl mx-auto w-full space-y-6">
        <div className="text-center space-y-1.5">
          <span className="text-xs font-mono text-[#0F5C4A] font-semibold block">
            Core Payroll Engine Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-heading font-medium text-[#1C1B19]">
            The 7-Stage Deterministic Payroll Engine
          </h2>
          <p className="text-xs text-[#6B665C] max-w-2xl mx-auto">
            Every payroll batch executes through a verified 7-stage pipeline ensuring contractual integrity and statutory exactness before locking disbursement.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-white rounded-lg p-4 space-y-1.5 border border-[#E7E2D9] border-l-4 border-l-[#0F5C4A]">
            <span className="text-[10px] text-[#0F5C4A] font-mono font-bold block">Stage 01</span>
            <h4 className="font-semibold text-sm text-[#1C1B19]">Eligible Staff Scan</h4>
            <p className="text-[#6B665C] text-xs leading-relaxed">
              Scans all employees with active contracts within the selected pay period date range.
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 space-y-1.5 border border-[#E7E2D9] border-l-4 border-l-[#0F5C4A]">
            <span className="text-[10px] text-[#0F5C4A] font-mono font-bold block">Stage 02</span>
            <h4 className="font-semibold text-sm text-[#1C1B19]">Contract Wage &amp; Schedule</h4>
            <p className="text-[#6B665C] text-xs leading-relaxed">
              Pulls contracted base wage, linked salary structure, and weekly schedule hours.
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 space-y-1.5 border border-[#E7E2D9] border-l-4 border-l-[#0F5C4A]">
            <span className="text-[10px] text-[#0F5C4A] font-mono font-bold block">Stage 03</span>
            <h4 className="font-semibold text-sm text-[#1C1B19]">Attendance &amp; Overtime</h4>
            <p className="text-[#6B665C] text-xs leading-relaxed">
              Aggregates biometric punch logs and applies overtime multiplier (e.g. 1.5x).
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 space-y-1.5 border border-[#E7E2D9] border-l-4 border-l-[#0F5C4A]">
            <span className="text-[10px] text-[#0F5C4A] font-mono font-bold block">Stage 04</span>
            <h4 className="font-semibold text-sm text-[#1C1B19]">Leave Days Reconciler</h4>
            <p className="text-[#6B665C] text-xs leading-relaxed">
              Checks approved leaves; deducts unpaid leave days automatically from the monthly gross.
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 space-y-1.5 border border-[#E7E2D9] border-l-4 border-l-[#0F5C4A]">
            <span className="text-[10px] text-[#0F5C4A] font-mono font-bold block">Stage 05</span>
            <h4 className="font-semibold text-sm text-[#1C1B19]">Sequential Rules AST</h4>
            <p className="text-[#6B665C] text-xs leading-relaxed">
              Executes salary rules in strict sequence order: Basic, HRA, DA, Bonuses, and Allowances.
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 space-y-1.5 border border-[#E7E2D9] border-l-4 border-l-[#0F5C4A]">
            <span className="text-[10px] text-[#0F5C4A] font-mono font-bold block">Stage 06</span>
            <h4 className="font-semibold text-sm text-[#1C1B19]">Statutory Taxes &amp; Net</h4>
            <p className="text-[#6B665C] text-xs leading-relaxed">
              Computes PF deductions, tax withholdings, and calculates final Net Disbursals.
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 space-y-1.5 border border-[#E7E2D9] border-l-4 border-l-[#0F5C4A] lg:col-span-2">
            <span className="text-[10px] text-[#0F5C4A] font-mono font-bold block">Stage 07</span>
            <h4 className="font-semibold text-sm text-[#1C1B19]">Digital Payslip Vault &amp; Audit Lock</h4>
            <p className="text-[#6B665C] text-xs leading-relaxed">
              Generates individual cryptographic payslip records, Vector PDF documents, and updates the corporate general ledger.
            </p>
          </div>
        </div>
      </section>

      {/* 4. SECTION: Interactive Live Simulator Console (#simulator) */}
      <section id="simulator" className="scroll-mt-20 px-6 py-12 max-w-5xl mx-auto w-full">
        <div className="bg-white rounded-xl border border-[#E7E2D9] p-5 md:p-7 space-y-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E7E2D9]">
            <div>
              <span className="text-xs font-mono text-[#0F5C4A] font-semibold block">
                Interactive Operational Sandbox
              </span>
              <h3 className="text-lg font-heading font-medium text-[#1C1B19]">
                Test Core Features in Real Time
              </h3>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center bg-[#FAF9F6] p-1 rounded-md border border-[#E7E2D9] text-xs">
              <button
                onClick={() => setActiveTab('payroll')}
                className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                  activeTab === 'payroll' ? 'bg-[#0F5C4A] text-white font-medium shadow-sm' : 'text-[#6B665C] hover:text-[#1C1B19]'
                }`}
              >
                7-Stage Payroll
              </button>
              <button
                onClick={() => setActiveTab('shifts')}
                className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                  activeTab === 'shifts' ? 'bg-[#0F5C4A] text-white font-medium shadow-sm' : 'text-[#6B665C] hover:text-[#1C1B19]'
                }`}
              >
                Shift Punch Desk
              </button>
              <button
                onClick={() => setActiveTab('rules')}
                className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                  activeTab === 'rules' ? 'bg-[#0F5C4A] text-white font-medium shadow-sm' : 'text-[#6B665C] hover:text-[#1C1B19]'
                }`}
              >
                Salary Rule AST
              </button>
              <button
                onClick={() => setActiveTab('payslip')}
                className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                  activeTab === 'payslip' ? 'bg-[#0F5C4A] text-white font-medium shadow-sm' : 'text-[#6B665C] hover:text-[#1C1B19]'
                }`}
              >
                Payslip Vault Trace
              </button>
            </div>
          </div>

          {/* Tab 1: 7-Stage Payroll Simulator */}
          {activeTab === 'payroll' && (
            <div className="space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#FAF9F6] rounded-lg border border-[#E7E2D9]">
                <div>
                  <span className="text-[10px] text-[#6B665C] uppercase block font-mono font-medium">Simulated Batch</span>
                  <div className="text-sm font-semibold text-[#1C1B19]">September 2026 Payrun Execution</div>
                  <span className="text-[#6B665C] text-xs">4 Employees • Executive Structure • Indefinite Contracts</span>
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
                          ? 'bg-[#E8F4F1] border-[#0F5C4A] text-[#0F5C4A] font-semibold'
                          : isDone
                          ? 'bg-white border-[#0F5C4A]/30 text-[#0F5C4A]'
                          : 'bg-[#FAF9F6] border-[#E7E2D9] text-[#918C82]'
                      }`}
                    >
                      <div className="text-[10px] font-mono font-bold">0{stageNum}</div>
                      <div className="text-xs mt-0.5">{st}</div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-3 gap-3 text-center pt-2">
                <div className="p-3 bg-white rounded-lg border border-[#E7E2D9]">
                  <span className="text-[10px] text-[#6B665C] uppercase font-mono block">Gross Liability</span>
                  <span className="text-base font-bold text-[#1C1B19] font-mono">₹2,75,000.00</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#E7E2D9]">
                  <span className="text-[10px] text-[#6B665C] uppercase font-mono block">Statutory Deductions</span>
                  <span className="text-base font-bold text-[#B5482E] font-mono">-₹47,288.00</span>
                </div>
                <div className="p-3 bg-[#FAF4E8] rounded-lg border border-[#8A6D3B]/30">
                  <span className="text-[10px] text-[#8A6D3B] uppercase font-mono block font-semibold">Net Disbursed</span>
                  <span className="text-base font-bold text-[#8A6D3B] font-mono">₹2,27,712.00</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Shift Desk Simulator */}
          {activeTab === 'shifts' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-[#FAF9F6] rounded-lg border border-[#E7E2D9] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] text-[#6B665C] uppercase font-mono font-medium block">Biometric Punch Station</span>
                  <div className="text-base font-semibold text-[#1C1B19]">
                    {isClockedIn ? `Active Shift: Clocked In at ${punchTime}` : 'Status: Ready for Shift Punch'}
                  </div>
                  <span className="text-xs text-[#6B665C]">Contracted Schedule: 40h/week (Mon-Fri 09:00-17:00)</span>
                </div>

                <button
                  onClick={() => {
                    setIsClockedIn(!isClockedIn);
                    setPunchTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                  }}
                  className={`px-4 py-2 rounded-md font-medium text-xs transition-colors cursor-pointer ${
                    isClockedIn
                      ? 'bg-[#FDF1EE] text-[#B5482E] border border-[#B5482E]/30 hover:bg-[#B5482E]/10'
                      : 'bg-[#0F5C4A] text-white hover:bg-[#0F5C4A]/90'
                  }`}
                >
                  {isClockedIn ? 'Punch Clock Out' : 'Punch Clock In'}
                </button>
              </div>

              <div className="p-3 bg-white rounded-lg border border-[#E7E2D9] text-xs text-[#6B665C] flex justify-between items-center">
                <span>Shift Variance Audit: 0.00h (On Schedule)</span>
                <span className="text-[#0F5C4A] font-semibold">100% Shift Compliance</span>
              </div>
            </div>
          )}

          {/* Tab 3: Rule Formula AST Simulator */}
          {activeTab === 'rules' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-[#FAF9F6] rounded-lg border border-[#E7E2D9] space-y-1.5">
                <span className="text-[10px] text-[#0F5C4A] font-bold block">
                  Deterministic Rule AST Evaluator (Sequence: 30)
                </span>
                <pre className="text-xs text-[#1C1B19] overflow-x-auto leading-relaxed">
{`RULE: PROVIDENT_FUND_DEDUCTION
CATEGORY: Deduction
INPUTS: [BASIC = ₹65,000.00, HRA = ₹26,000.00]
FORMULA: (BASIC + HRA) * 0.12
OUTPUT: -₹10,920.00`}
                </pre>
              </div>
              <div className="flex justify-between items-center text-xs text-[#6B665C]">
                <span>AST Parser: Zero precision degradation</span>
                <span className="text-[#0F5C4A] font-medium">Execution Time: 0.04ms</span>
              </div>
            </div>
          )}

          {/* Tab 4: Payslip Vault Trace */}
          {activeTab === 'payslip' && (
            <div className="space-y-3 text-xs">
              <div className="p-4 bg-[#FAF9F6] rounded-lg border border-[#E7E2D9] flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-[#6B665C] uppercase font-mono font-medium block">Digital Payslip Vault</span>
                  <div className="text-sm font-semibold text-[#1C1B19]">Alex Turner — Senior Staff Engineer</div>
                  <span className="text-xs text-[#6B665C]">ID: EMP-1092 • September 2026 Payrun</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#6B665C] uppercase font-mono block">Net Disbursed</span>
                  <div className="text-xl font-bold text-[#8A6D3B] font-mono">₹73,200.00</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 5. SECTION: Core HR Modules (#modules) */}
      <section id="modules" className="scroll-mt-20 px-6 py-12 max-w-5xl mx-auto w-full space-y-6">
        <div className="text-center space-y-1.5">
          <span className="text-xs font-mono text-[#0F5C4A] font-semibold block">
            End-to-End People Operations
          </span>
          <h2 className="text-2xl sm:text-3xl font-heading font-medium text-[#1C1B19]">
            Integrated Workforce Modules
          </h2>
          <p className="text-xs text-[#6B665C] max-w-2xl mx-auto">
            All data flows seamlessly from employee profile to contract terms, shift adherence, time off approvals, and payroll calculation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-[#E7E2D9] p-5 space-y-2 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-[#E8F4F1] text-[#0F5C4A] flex items-center justify-center">
              <span className="material-symbols-outlined text-base">badge</span>
            </div>
            <h3 className="font-semibold text-sm text-[#1C1B19]">Employee Hub &amp; Drawer</h3>
            <p className="text-xs text-[#6B665C] leading-relaxed">
              Unified employee management with slide-over command hub showing Profile, Contracts, Attendance, Leaves, and Payslip archive in one view.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-[#E7E2D9] p-5 space-y-2 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-[#E8F4F1] text-[#0F5C4A] flex items-center justify-center">
              <span className="material-symbols-outlined text-base">contract</span>
            </div>
            <h3 className="font-semibold text-sm text-[#1C1B19]">Contracts &amp; Wage Terms</h3>
            <p className="text-xs text-[#6B665C] leading-relaxed">
              Historical contract registry with base wage assignment, working schedule linkages, and a period lookup tester to resolve applicable terms.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-[#E7E2D9] p-5 space-y-2 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-[#E8F4F1] text-[#0F5C4A] flex items-center justify-center">
              <span className="material-symbols-outlined text-base">event_busy</span>
            </div>
            <h3 className="font-semibold text-sm text-[#1C1B19]">Time Off &amp; Quota Balances</h3>
            <p className="text-xs text-[#6B665C] leading-relaxed">
              Annual entitlement progress meters, 1-click Approve/Reject queue with justification modals, and automatic unpaid leave deductions.
            </p>
          </div>
        </div>
      </section>

      {/* 6. SECTION: Salary Rules AST & Formulas (#rules) */}
      <section id="rules" className="scroll-mt-20 px-6 py-12 max-w-5xl mx-auto w-full space-y-6">
        <div className="text-center space-y-1.5">
          <span className="text-xs font-mono text-[#0F5C4A] font-semibold block">
            Extensible Formula Engine
          </span>
          <h2 className="text-2xl sm:text-3xl font-heading font-medium text-[#1C1B19]">
            Salary Rules AST &amp; Compensation Structures
          </h2>
          <p className="text-xs text-[#6B665C] max-w-2xl mx-auto">
            Define sequence-ordered computation rules without hardcoding. Supports Fixed amounts, Percentage bases, and custom mathematical expressions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-white rounded-xl border border-[#E7E2D9] p-5 space-y-3 shadow-sm">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-sm text-[#1C1B19]">Formula Sequence Execution</h4>
              <Badge variant="primary">Deterministic</Badge>
            </div>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="p-2 bg-[#FAF9F6] rounded border border-[#E7E2D9] flex justify-between">
                <span>Seq 10: BASIC_SALARY (Base)</span>
                <span className="text-[#0F5C4A] font-medium">Fixed / Contracted</span>
              </div>
              <div className="p-2 bg-[#FAF9F6] rounded border border-[#E7E2D9] flex justify-between">
                <span>Seq 20: HRA (House Rent Allowance)</span>
                <span className="text-[#6B665C]">40.0% of BASIC</span>
              </div>
              <div className="p-2 bg-[#FAF9F6] rounded border border-[#E7E2D9] flex justify-between">
                <span>Seq 30: DA (Dearness Allowance)</span>
                <span className="text-[#6B665C]">10.0% of BASIC</span>
              </div>
              <div className="p-2 bg-[#FAF9F6] rounded border border-[#E7E2D9] flex justify-between">
                <span>Seq 40: PF_DED (Provident Fund)</span>
                <span className="text-[#B5482E]">-12.0% of (BASIC + HRA)</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E7E2D9] p-5 space-y-3 shadow-sm">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-sm text-[#1C1B19]">Salary Structure Bundles</h4>
              <Badge variant="success">Modular</Badge>
            </div>
            <p className="text-[#6B665C] text-xs leading-relaxed">
              Bundle any combination of salary rules into reusable corporate profiles (e.g. Standard Full-Time, Executive Tier, Contractor Package). Assign them to contracts with 1-click binding.
            </p>
            <div className="p-3 bg-[#E8F4F1] rounded-lg border border-[#0F5C4A]/20 text-xs text-[#0F5C4A]">
              ✓ Pre-flight warning engine detects missing bank details or missing contracts before execution.
            </div>
          </div>
        </div>
      </section>

      {/* 7. SECTION: Technical Architecture & RBAC (#architecture) */}
      <section id="architecture" className="scroll-mt-20 px-6 py-12 max-w-5xl mx-auto w-full space-y-6">
        <div className="text-center space-y-1.5">
          <span className="text-xs font-mono text-[#0F5C4A] font-semibold block">
            Fullstack Engineering
          </span>
          <h2 className="text-2xl sm:text-3xl font-heading font-medium text-[#1C1B19]">
            Architecture, Security &amp; RBAC Matrix
          </h2>
          <p className="text-xs text-[#6B665C] max-w-2xl mx-auto">
            Industrial Node.js / MongoDB backend with React 18 / Tailwind frontend and 5-tier role-based access control.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-[#E7E2D9] p-5 space-y-3 text-xs shadow-sm">
            <h4 className="font-semibold text-sm text-[#1C1B19]">Technology Stack</h4>
            <ul className="space-y-2 text-[#6B665C]">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F5C4A]"></span>
                <strong className="text-[#1C1B19]">Backend:</strong> Node.js, Express, MongoDB, Mongoose ODM
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F5C4A]"></span>
                <strong className="text-[#1C1B19]">Frontend:</strong> React 18, Vite 5, Tailwind CSS
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F5C4A]"></span>
                <strong className="text-[#1C1B19]">PDF Generation:</strong> Vector PDFKit engine for certified payslips
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F5C4A]"></span>
                <strong className="text-[#1C1B19]">Email Engine:</strong> Automated digital payslip dispatch
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F5C4A]"></span>
                <strong className="text-[#1C1B19]">Security:</strong> JWT tokens, bcrypt password hashing, Joi validation
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-[#E7E2D9] p-5 space-y-3 text-xs shadow-sm">
            <h4 className="font-semibold text-sm text-[#1C1B19]">5-Tier RBAC Permission Matrix</h4>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="p-2 bg-[#FAF9F6] rounded border border-[#E7E2D9] flex justify-between">
                <span className="text-[#1C1B19] font-semibold">Admin</span>
                <span className="text-[#0F5C4A]">Full System &amp; RBAC Control</span>
              </div>
              <div className="p-2 bg-[#FAF9F6] rounded border border-[#E7E2D9] flex justify-between">
                <span className="text-[#1C1B19] font-semibold">HR Payroll Manager</span>
                <span className="text-[#0F5C4A]">Run, Validate &amp; Disburse Payruns</span>
              </div>
              <div className="p-2 bg-[#FAF9F6] rounded border border-[#E7E2D9] flex justify-between">
                <span className="text-[#1C1B19] font-semibold">HR Manager</span>
                <span className="text-[#6B665C]">Employee &amp; Time Off Approvals</span>
              </div>
              <div className="p-2 bg-[#FAF9F6] rounded border border-[#E7E2D9] flex justify-between">
                <span className="text-[#1C1B19] font-semibold">Employee</span>
                <span className="text-[#918C82]">Punch Desk &amp; Payslip Vault</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="mt-auto border-t border-[#E7E2D9] px-6 py-8 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B665C]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#0F5C4A] text-white flex items-center justify-center font-bold text-[10px] font-mono">
              S
            </div>
            <span className="text-[#1C1B19] font-semibold">Staffora</span>
            <span>• Enterprise HR &amp; Payroll Platform</span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-[#1C1B19] transition-colors">Sign in</Link>
            <button
              onClick={() => navigate('/login')}
              className="text-[#0F5C4A] font-medium hover:underline cursor-pointer"
            >
              Access Platform
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
