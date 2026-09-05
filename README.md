# PeoplePay360 — Integrated HR & Payroll Operations Platform

An enterprise-grade, fullstack **Human Resource and Payroll Operations Platform** built with the **MERN** stack (Node.js, Express.js, MongoDB, Mongoose, React 18, Vite, and Tailwind CSS).

The user interface is faithfully implemented from **Google Stitch Project `projects/12804878109448258259`**, featuring modern visual aesthetics, design tokens, responsive bento grids, real-time pipeline execution steppers, slide-over management hubs, and instant demo persona switching.

---

## 1. System Architecture & Flow

```
Employee Directory & Central Hub
   ↓
Contract (Historical / Active) + Working Schedule (Auto Weekly Hours)
   ↓
Attendance (Punch Clock In/Out, Worked Hours) + Time Off (Allocations & Balances)
   ↓
Salary Structure + Dynamic Salary Rules (Fixed, Percentage, Math Formula)
   ↓
Payrun Engine (2-Step Creation: Structure & Period → Eligible Employee Filtering)
   ↓
7-Stage Pipeline Compute → Pre-Flight Warnings → Validation → Mark Paid → PDF Payslips & Email
   ↓
Executive Dashboard Analytics & Exportable Audit Ledgers
```

---

## 2. Technology Stack

### Frontend (`client/`)
- **Framework**: React 18 (SPA) with Vite 5
- **Routing**: React Router v6 with Role-Based Access Control (`ProtectedRoute`)
- **Styling**: Tailwind CSS configured with exact Google Stitch design tokens:
  - `primary`: `#2a14b4`
  - `primary-container`: `#4338ca`
  - `secondary`: `#712ae2`
  - `background`: `#faf8ff`
  - `surface-container-lowest`: `#ffffff`
  - `on-surface`: `#131b2e`
- **Typography & Icons**: Inter, Plus Jakarta Sans & Google Material Symbols Outlined
- **HTTP Client**: Axios with JWT request & response interceptors
- **Interactive Features**: 1-click persona switcher, SVG salary charts, 7-stage payrun pipeline stepper, itemized rule calculation inspector, slide-over employee hub.

### Backend (`server/`)
- **Runtime & Server**: Node.js & Express.js
- **Database & ODM**: MongoDB with Mongoose 8.x
- **Authentication & RBAC**: JWT (`jsonwebtoken`) & `bcryptjs`
- **Schema Validation**: `joi` Schema Validation Middleware
- **Formula Evaluation Engine**: `mathjs`
- **Document Generation**: `pdfkit` (Professional Vector Payslip PDFs)
- **Email Delivery**: `nodemailer` (SMTP / Ethereal test accounts)
- **Testing**: `jest`, `supertest`, `mongodb-memory-server`

---

## 3. Directory Structure

```
PeoplePay360/
├── package.json                  # Unified root scripts
├── client/                       # React 18 + Vite Frontend (Google Stitch UI)
│   ├── index.html
│   ├── tailwind.config.js        # Stitch color & typography tokens
│   ├── src/
│   │   ├── api/                  # REST API client connectors
│   │   ├── components/
│   │   │   ├── common/           # Badge, Button, Modal, StatCard, LoadingSpinner
│   │   │   └── layout/           # Sidebar (Stitch navigation), Header, Layout
│   │   ├── context/              # AuthContext (1-Click Personas), ToastContext
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardPage.jsx # Stitch Screen 78616b09144f42d9ba3c16bc5bab63ac
│   │   │   ├── EmployeesPage.jsx # Stitch Screen b2e0edb9c46c4ccbaec6f55b2599717d
│   │   │   ├── ContractsPage.jsx
│   │   │   ├── SchedulesPage.jsx
│   │   │   ├── AttendancePage.jsx
│   │   │   ├── TimeOffPage.jsx   # Stitch Screen c37e1a8c9e1c4832aaf4e40adf57bb8c
│   │   │   ├── PayrunsPage.jsx
│   │   │   ├── PayrunDetailPage.jsx # Stitch Screen 0cbfab8853b440a58462c87c1607fda9
│   │   │   ├── PayslipsPage.jsx
│   │   │   ├── SalaryStructuresPage.jsx
│   │   │   ├── SalaryRulesPage.jsx
│   │   │   ├── ReportsPage.jsx
│   │   │   └── SettingsPage.jsx
│   │   ├── App.jsx               # Routes & RBAC guards
│   │   ├── main.jsx
│   │   └── index.css
│
└── server/                       # MERN Backend REST API
    ├── package.json
    ├── src/
    │   ├── config/               # db.js, env.js, mailer.js
    │   ├── controllers/          # auth, employee, contract, schedule, attendance, timeOff, salary, payrun, payslip, dashboard
    │   ├── middleware/           # auth, rbac, validation, errorHandler
    │   ├── models/               # User, Employee, Contract, WorkingSchedule, Attendance, TimeOffType, LeaveAllocation, TimeOffRequest, SalaryStructure, SalaryRule, Payrun, Payslip
    │   ├── routes/               # Modular Express routers
    │   ├── services/             # salaryEngine.js, contractService.js, leaveService.js, payrunService.js, pdfService.js, emailService.js, dashboardService.js
    │   └── seed/seed.js          # Demo dataset & 5 role persona accounts
    └── tests/                    # 7 Comprehensive Jest integration test suites (16 tests)
```

---

## 4. Quick Start & Execution

### Prerequisites
- Node.js (v18+)
- MongoDB running locally on `mongodb://localhost:27017/peoplepay360` (or set `MONGODB_URI` in `server/.env`)

### Step 1: Install Dependencies
```bash
# In server directory
cd server && npm install

# In client directory
cd ../client && npm install
```

### Step 2: Seed the Demo Database
Populates employees, active contracts, working schedules, leave types, salary rules & structures, payruns, and demo users for all 5 RBAC roles:
```bash
# From root or server directory
npm run seed
# or
node server/src/seed/seed.js
```

### Step 3: Run the Backend API
```bash
# From server directory or root
node server/src/server.js
# Backend runs on http://localhost:5000/api
```

### Step 4: Run the Frontend App
```bash
# In another terminal in client directory
cd client
node ./node_modules/vite/bin/vite.js
# App is accessible at http://localhost:5173
```

---

## 5. Demo Persona Accounts & RBAC Matrix

You can click any **1-Click Quick Login** pill on the Login screen to switch between roles instantly:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@peoplepay360.com` | `Admin@12345` | Full system access across all modules, settings & users. |
| **HR Manager** | `hrmanager@peoplepay360.com` | `HR@12345` | Staff directory, contracts, leave approvals, attendance auditing. |
| **HR Payroll Manager**| `payrollmgr@peoplepay360.com`| `Payroll@12345`| Full Payroll Engine, Payrun creation, computation, validation, disbursal. |
| **HR Payroll User** | `payrolluser@peoplepay360.com` | `User@12345` | Payrun drafts & computation, manual attendance entry. |
| **Employee** | `employee@peoplepay360.com` | `Emp@12345` | Employee self-service: Punch clock in/out, leave requests, view & download payslips. |

---

## 6. Google Stitch Design Alignment

- **Screen `78616b09144f42d9ba3c16bc5bab63ac` (Executive Dashboard)**:
  - Top 5 KPI Bento metrics (Active Headcount, Monthly Net Payroll, Overtime Hours, Pending Approvals, Attendance Rate)
  - Action Alerts Banner for critical pending payruns & unassigned contracts
  - 6-Month Monthly Net Salary & Headcount Trend SVG Chart
  - Department Cost Breakdown bar meters
  - Attendance On-Time mini gauge

- **Screen `b2e0edb9c46c4ccbaec6f55b2599717d` (Employee Central & Slide-Over Hub)**:
  - Table and Matrix card views
  - Slide-over Employee Hub Drawer with comprehensive tabs: Profile Info, Active Contracts, Attendance Punch Records, Time Off Balances, and Historical Payslips
  - Add / Edit Employee modal with job positions and department selectors

- **Screen `0cbfab8853b440a58462c87c1607fda9` (Payrun Processing Engine)**:
  - 2-Step Payrun Creation Wizard (Structure & Period → Real-time Eligible Contracts Scanner)
  - 7-Stage Payroll Pipeline Stepper (Eligible Staff → Active Contracts → Overtime → Approved Leaves → Salary Rules → Net & Tax → Payslips Ready)
  - Pre-Flight Computation Audit warning alert box
  - Itemized Salary Rule Inspector modal & instant PDF vector payslip generation

- **Screen `c37e1a8c9e1c4832aaf4e40adf57bb8c` (Time Off & Leave Central)**:
  - Annual Entitlement Visualizer progress meters (Allocated vs Used vs Remaining)
  - Pending Approval Action Stream with 1-click Approve / Reject & reasons
  - Leave Request & Annual Allocation grant modals

---

## 7. Running Backend Tests

All 7 test suites (16 tests) execute in isolated in-memory MongoDB instances:
```bash
cd server
node ./node_modules/jest/bin/jest.js
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
```

---

## License
MIT License. Built for the PeoplePay360 HR & Payroll Hackathon.
