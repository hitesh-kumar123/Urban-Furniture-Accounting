# Staffora — Integrated HR & Payroll Operations Platform

> **An enterprise-grade, fullstack Human Resource and Payroll Operations Platform built for the Hackathon with the MERN stack (Node.js, Express.js, MongoDB, Mongoose, React 18, Vite, and Tailwind CSS).**

Designed to deliver an award-winning operational experience matching **Google Stitch (`projects/12804878109448258259`)**, Staffora unifies master employee records, contract versioning, shift scheduling, real-time punch attendance, statutory leave entitlement accounting, a 7-stage deterministic payroll computation engine, vector PDF payslip generation, and an executive intelligence dashboard.

---

## 🚀 Live Demo & Quick Start (2-Minute Setup)

### Prerequisites
- **Node.js** (v18+)
- **MongoDB** running locally on `mongodb://127.0.0.1:27017/peoplepay360` (or configured via `server/.env`)

### 1. Install Dependencies
```bash
# In server directory
cd server && npm install

# In client directory
cd ../client && npm install
```

### 2. Seed the Demo Database
Populates employees, active & historical contracts, 7-day shift patterns, leave policies, statutory salary rules, payruns, and demo accounts for all 5 RBAC roles:
```bash
cd server
node src/seed/seeder.js
```

### 3. Run the Servers
Open two terminal windows:

**Terminal 1 (Backend API)**:
```bash
cd server
npm run dev
# Running on http://localhost:5000 (API at http://localhost:5000/api)
```

**Terminal 2 (Frontend Client)**:
```bash
cd client
npm run dev
# Running on http://localhost:3000 (or http://localhost:5173)
```

---

## 👥 1-Click Fast Demo Personas (RBAC Matrix)

On the login page, click any **⚡ Quick Demo Login** pill to switch roles instantly:

| Role | Demo Email | Password | Access Level & Key Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@peoplepay360.com` | `Password@123` | **Full System Access** across all modules, configuration, and security settings. |
| **HR Manager** | `hrmanager@peoplepay360.com` | `Password@123` | **Employee Hub**, Contracts, Shift Schedules, Leave Approvals, Attendance Audits. |
| **HR Payroll Manager** | `payrollmgr@peoplepay360.com` | `Password@123` | **Full Payroll Engine**, 2-Step Payrun Wizard, Salary Rules, Validation & Payouts. |
| **HR Payroll User** | `payrolluser@peoplepay360.com` | `Password@123` | Payrun Drafts, Computation Pre-flights, Attendance corrections. |
| **Employee** | `alex.turner@peoplepay360.com` | `Password@123` | **Self-Service**: Punch Clock In/Out, Leave Requests, View & Download Payslip PDFs. |

---

## 🌟 Key Architecture & Highlights

```
                    ┌─────────────────────────┐
                    │  Employee Directory Hub │
                    └────────────┬────────────┘
                                 │
           ┌─────────────────────┼─────────────────────┐
           ▼                     ▼                     ▼
┌─────────────────────┐┌───────────────────┐┌────────────────────┐
│ Historical Contract ││ Working Schedules ││ Attendance Punches│
│  Period Resolution  ││ Auto Weekly Hours ││  & Time-Off Grants│
└──────────┬──────────┘└─────────┬─────────┘└─────────┬──────────┘
           │                     │                    │
           └─────────────────────┼────────────────────┘
                                 ▼
                     ┌───────────────────────┐
                     │ Salary Structure &    │
                     │ Sequential Math Rules │
                     └───────────┬───────────┘
                                 ▼
                     ┌───────────────────────┐
                     │  2-Step Payrun Wizard │
                     │  Scope → Eligible Scan│
                     └───────────┬───────────┘
                                 ▼
                     ┌───────────────────────┐
                     │ 7-Stage Compute Engine│
                     │ Warnings → Validation │
                     └───────────┬───────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
     ┌───────────────────────┐       ┌───────────────────────┐
     │ Vector PDF Payslips   │       │ Executive Analytics   │
     │  & Bulk Email Delivery│       │  & CSV Ledger Export  │
     └───────────────────────┘       └───────────────────────┘
```

---

## 📱 Feature Overview & Workspaces

### 1. Executive Intelligence Dashboard (`/`) — *Stitch Screen `78616b09144f42d9ba3c16bc5bab63ac`*
- **5 High-Impact Bento KPIs**: Real-time Net Disbursal, Payslips Generated, Average Salary, Approved Leaves, and Attendance Rate.
- **Interactive Trajectory Chart**: Switch between **Net Salary Cost Curve ($)** and **Headcount Growth** with live hover tooltips.
- **Department Cost Breakdown**: Animated gradient progress meters representing compensation share across departments.
- **Operational Governance Alerts**: Highlights pending approvals and draft payrun states.
- **Export Executive Pack**: 1-click printable executive financial memorandum.

### 2. Talent & Employee Hub (`/employees`) — *Stitch Screen `b2e0edb9c46c4ccbaec6f55b2599717d`*
- **Dual View Modes**: Matrix Grid and Table View.
- **Slide-Over Central Hub Drawer**: 5 deep inspection tabs (*Profile Details*, *Active Contracts*, *Punch Logs*, *Time Off Balances*, and *Historical Payslips*).
- **Employee Modals**: Add/Edit staff with auto-linked user accounts.

### 3. Contract Versioning Registry (`/contracts`)
- **Historical Contract Tracking**: Full compensation audit trail.
- **Period-Specific Resolution**: Ensures payroll applies only the active contract for that date range without concurrent overlap.
- **Applicable Contract Lookup Tester**: Interactive period tester modal.

### 4. Working Schedules & Shifts (`/schedules`)
- **7-Day Shift Pattern Configurator**: Working day toggles, start/end times, and break minutes.
- **Auto Weekly Hours Recalculation**: Computes total hours dynamically (e.g. 35h / 40h work weeks).

### 5. Time & Attendance Governance (`/attendance`)
- **Employee Shift Desk**: 1-click **Clock In** and **Clock Out** with live duration counters.
- **Exception Auditing**: Tracks Late arrivals, Missing check-outs, and Overtime.
- **HR Manual Correction Modal**: Allows authorized HR staff to adjust records with mandatory audit remarks.

### 6. Time Off & Leave Central (`/time-off`) — *Stitch Screen `c37e1a8c9e1c4832aaf4e40adf57bb8c`*
- **Annual Entitlement Visualizer**: Progress bars displaying Allocated vs Used vs Remaining days.
- **Pending Approval Action Stream**: 1-click **Approve** (green) and **Reject** (red with required reason prompt).
- **Statutory Leave Allocations**: Grant annual entitlement days per calendar year.

### 7. Payrun Creation Wizard & 7-Stage Engine (`/payruns`, `/payruns/:id`) — *Stitch Screen `0cbfab8853b440a58462c87c1607fda9`*
- **2-Step Setup Wizard**:
  - *Step 1*: Define Name, Salary Structure, and Period Dates.
  - *Step 2*: Live scan of eligible employees with active contracts matching the structure $\to$ Select all/individual $\to$ Initialize batch.
- **7-Stage Deterministic Pipeline Stepper**:
  `Eligible Staff` $\to$ `Active Contracts` $\to$ `Overtime Hours` $\to$ `Approved Leaves` $\to$ `Salary Rules` $\to$ `Net & Tax` $\to$ `Payslips Ready`
- **Pre-Flight Computation Audit**: Automatic warnings for missing bank info, duplicate payslips, or unassigned structures.
- **Workflow Actions**: **Compute Payrun**, **Validate Batch**, **Mark as Paid**, **Distribute Digital Payslips**.

### 8. Digital Payslip Vault (`/payslips`)
- **Itemized Rule Inspector**: Itemized breakdown of Basic Wage, HRA, DA, PF, Tax, and Unpaid Leave deductions.
- **Vector PDF Downloads**: Direct generation and download of certified PDF payslips powered by `pdfkit`.

### 9. Salary Structures & Sequential Rules Engine (`/salary-structures`, `/salary-rules`)
- **Flexible Calculation Types**:
  - **Fixed Amount**: Static dollar amounts (e.g. `$200` Transport).
  - **Percentage of Base**: Dynamic percentages calculated against other rules (e.g. `40% of BASIC`, `12% of BASIC`).
  - **Math Formula**: Dynamic arithmetic formulas (e.g. `BASIC * 0.12 + 100`).
- **Sequential Priority Execution**: Respects dependency order (Basic $\to$ Allowances $\to$ Gross $\to$ Deductions $\to$ Net).

### 10. Global Spotlight Command Palette (`⌘K` / `Ctrl+K`)
- Press **`Cmd+K`** or click the header search bar from anywhere to search pages, employees, payruns, and trigger quick actions.

---

## 🧪 Automated Testing & Verification

All 7 test suites execute against in-memory MongoDB instances with **100% pass rate**:

```bash
cd server
npm test
```

```
PASS tests/contract_schedule.test.js
PASS tests/dashboard.test.js
PASS tests/leave_balance.test.js
PASS tests/salary_engine.test.js
PASS tests/payrun_workflow.test.js
PASS tests/auth_rbac.test.js
PASS tests/e2e_demo_flow.test.js

Test Suites: 7 passed, 7 total
Tests:       16 passed, 16 total
Snapshots:   0 total
Time:        4.881 s
```

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend UI** | React 18, Vite 5, Tailwind CSS, React Router v6, Axios, Lucide React, Google Fonts (*Inter* & *Plus Jakarta Sans*), Material Symbols Outlined. |
| **Backend REST API** | Node.js, Express.js, Mongoose 8.x, JWT (`jsonwebtoken`), `bcryptjs`, `joi` Schema Validation, `mathjs`, `pdfkit` (PDF generator), `nodemailer`. |
| **Database** | MongoDB (Compass / Atlas / Local Community Server). |
| **Quality & Tests** | Jest, Supertest, `mongodb-memory-server`. |

---

## 📂 Project Structure

```
Staffora/
├── package.json                  # Unified root scripts
├── client/                       # React 18 + Vite Frontend
│   ├── index.html
│   ├── tailwind.config.js        # Google Stitch color tokens & typography
│   ├── src/
│   │   ├── api/                  # REST API client connectors
│   │   ├── components/
│   │   │   ├── common/           # Spotlight Modal, Notification Drawer, Badge, Button, Modal
│   │   │   └── layout/           # Header, Sidebar, Layout
│   │   ├── context/              # AuthContext (Demo Personas), ToastContext
│   │   └── pages/                # Dashboard, Employees, Contracts, Schedules, Attendance,
│   │                             # TimeOff, Payruns, PayrunDetail, Payslips, Structures, Rules, Reports, Settings
└── server/                       # Express + MongoDB Backend
    ├── src/
    │   ├── config/               # db.js, env.js, mailer.js
    │   ├── controllers/          # auth, employee, contract, schedule, attendance, timeOff, salary, payrun, payslip, dashboard
    │   ├── middleware/           # JWT auth, 5-role RBAC, Joi validation, Error handler
    │   ├── models/               # User, Employee, Contract, WorkingSchedule, Attendance, TimeOffType, LeaveAllocation, TimeOffRequest, SalaryStructure, SalaryRule, Payrun, Payslip
    │   ├── routes/               # Modular Express REST routers
    │   ├── services/             # salaryEngine.js, contractService.js, leaveService.js, payrunService.js, pdfService.js, emailService.js, dashboardService.js
    │   └── seed/                 # Full demo dataset seeder
    └── tests/                    # 7 Comprehensive Jest integration test suites
```

---

## 📄 License
MIT License. Built for the PeoplePay360 / Odoo HR & Payroll Hackathon.
