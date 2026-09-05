<div align="center">

# PeoplePay360 (Staffora) — Enterprise HR & Payroll Operations Platform

**An enterprise-grade Human Resource, Workforce Management, and Deterministic Payroll Operations Platform built on the modern MERN stack with native Indian Statutory Compliance (EPFO, PT, TDS) and INR (₹) Financial Ledgers.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-18.x-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/vite-5.x-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/tailwind-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208-47A248.svg)](https://www.mongodb.com/)
[![Test Suite](https://img.shields.io/badge/Tests-16%20Passed%20(100%25)-39D98A.svg)](#automated-testing)

[Features](#key-features) • [System Architecture](#system-architecture) • [Tech Stack](#technology-stack) • [Quick Start](#quick-start) • [RBAC Matrix](#demo-personas--rbac-matrix) • [API Endpoints](#api-endpoints) • [Security](#security-architecture) • [Testing](#automated-testing)

</div>

---

## 🌟 Overview

**PeoplePay360 (Staffora)** is a full-stack, modular HR and Payroll management suite designed for organizations that demand precision, speed, and strict regulatory auditability. It unifies workforce operations (attendance punch clock, 7-day shift patterns, leave entitlement accounting) with an enterprise 7-stage payroll computation engine and a safe mathematical AST formula parser.

Built with native support for **Indian Statutory Compliance** (EPFO, Professional Tax, TDS with standard slab withholding) and **INR (`₹`) currency accounting**, PeoplePay360 guarantees zero mathematical drift and provides full traceability from contractual wages down to downloadable certified PDF payslips and Excel-compatible CSV ledgers.

---

## 🚀 Key Features

### 1. 👥 Workforce Directory & Interactive Kanban Board
- **Dual View Modes**: Switch instantly between structured tabular grids and visual **Kanban boards** grouped by department or status.
- **HTML5 Drag-and-Drop**: Reassign employee statuses or departments with real-time optimistic UI updates and MongoDB persistence.
- **360° Employee Command Hub**: 5-tab slide-over inspection drawer for Employee Profiles, Active Contracts, Shift Logs, Leave Quotas, and Historical Payslips.

### 2. 📝 Contract Versioning & Period Resolution Engine
- **Compensation Audit Trail**: Retains complete contract history across promotions, salary revisions, and structure shifts.
- **Deterministic Period Resolution**: Accurately resolves the single active contract applicable to any given payroll period, avoiding overlapping compensation conflicts.
- **Interactive Simulator**: Built-in simulator to test contract applicability against arbitrary date ranges.

### 3. ⏰ 7-Day Shift Patterns & Attendance Governance
- **Granular Shift Configurator**: Define day-by-day active work days (Monday–Sunday), shift start/end times, and unpaid break deductions.
- **Auto Weekly Hours Calculation**: Dynamically computes weekly expected working hours (e.g., standard 40h/week, 35h part-time, weekend shifts).
- **1-Click Biometric Punch Clock**: Employee self-service clock-in and clock-out with real-time shift duration counters and exception flagging (Late, Missing Out, Overtime).

### 4. 🏖️ Statutory Leave Entitlements & Time Off Accounting
- **Visual Balance Trackers**: Real-time progress visualizers showing Allocated vs Used vs Remaining balances across leave types (Casual, Sick, Paid, Maternity).
- **Multi-Level Approval Workflows**: 1-click Approve and Refuse actions with mandatory audit feedback remarks.
- **Statutory Annual Allocations**: Automatic initialization of annual leave packages for all employees upon registration.

### 5. 🧮 Salary Structures & Safe MathJS AST Rule Engine
- **3 Calculation Types**:
  - **Fixed Amount**: Static allowances or deductions.
  - **Percentage of Base**: Dynamic percentages calculated against preceding rule codes (e.g., `50% of BASIC` for HRA, `12% of BASIC` for EPF).
  - **Arithmetic Formula**: Custom algebraic expressions evaluated using a sandboxed `mathjs` AST parser (e.g., `(CONTRACT_WAGE / 30) * WORKED_DAYS`).
- **Sequential Execution Hierarchy**: Rules execute strictly in configured sequence (`Basic` $\to$ `Allowances` $\to$ `Gross` $\to$ `Deductions` $\to$ `Net`).

### 6. ⚡ 2-Step Payrun Wizard & 7-Stage Computation Engine
- **Wizard Workflow**:
  - *Step 1*: Define pay period dates and target Salary Structure.
  - *Step 2*: Live scan of all eligible employees with active matching contracts $\to$ Select all/individual $\to$ Initialize batch.
- **7-Stage Deterministic Pipeline**:
  $$\text{Eligible Staff} \longrightarrow \text{Active Contracts} \longrightarrow \text{Working Hours} \longrightarrow \text{Time Off Deductions} \longrightarrow \text{Salary Rules AST} \longrightarrow \text{Net \& Taxes} \longrightarrow \text{Payslips Ready}$$
- **Controlled Lifecycle**: `Draft` $\to$ `Computed` $\to$ `Validated` $\to$ `Paid` $\to$ `Payslips Distributed`.

### 7. 📄 Digital Payslip Vault & Certified PDF Generator
- **Itemized Breakdown**: Full disclosure of Basic Pay, Allowances, Statutory Deductions (EPFO, PT, TDS), and Net Take-Home in INR (`₹`).
- **Vector PDF Generator**: Generates certified, high-resolution PDF payslips using `pdfkit` with clear headers, organizational stamps, and verification blocks.
- **Bulk & Single Email Distribution**: Integrates with SMTP via `nodemailer` to dispatch payslips directly to employees.

### 8. 📊 Executive Analytics & Workforce Intelligence
- **High-Impact Bento KPIs**: Annual Net Payroll Disbursal, Total Headcount, Settled Payrun Batches, and Average Compensation.
- **Interactive Trajectory Visualizer**: Monthly Net Payroll trends with interactive tooltips and department cost breakdowns.
- **Excel-Compatible CSV Ledger Export**: Export audited payrun ledgers with **UTF-8 BOM (`\uFEFF`)** formatting to ensure seamless rendering in Microsoft Excel without character corruption.
- **Executive Financial Audit Memo**: Printable, confidential ledger snapshot modal for auditors and C-suite leadership.

---

## 🏗️ System Architecture

```
                                 ┌─────────────────────────────────┐
                                 │      PeoplePay360 Client        │
                                 │   (React 18 + Vite + Tailwind)  │
                                 └────────────────┬────────────────┘
                                                  │ REST API (Bearer JWT)
                                                  ▼
                                 ┌─────────────────────────────────┐
                                 │     Express.js API Gateway      │
                                 │   (CORS, Joi Validation, RBAC)  │
                                 └────────────────┬────────────────┘
                                                  │
                 ┌────────────────────────────────┼────────────────────────────────┐
                 ▼                                ▼                                ▼
      ┌──────────────────────┐        ┌───────────────────────┐        ┌──────────────────────┐
      │  Workforce & Shift   │        │   Salary AST Engine   │        │  7-Stage Payrun      │
      │  Management Services │        │   (MathJS Sandbox)    │        │  Batch Processor     │
      └──────────┬───────────┘        └───────────┬───────────┘        └──────────┬───────────┘
                 │                                │                               │
                 └────────────────────────────────┼───────────────────────────────┘
                                                  ▼
                                 ┌─────────────────────────────────┐
                                 │      MongoDB Database           │
                                 │   (Mongoose Schemas & Indexes)  │
                                 └─────────────────────────────────┘
```

---

## 💻 Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 18, Vite 5, Tailwind CSS, React Router v6, Axios, Lucide React, Google Fonts (*Outfit*, *Plus Jakarta Sans*, *JetBrains Mono*) |
| **Backend Framework** | Node.js (v18+), Express.js 4.x |
| **Database & ODM** | MongoDB Atlas / Local, Mongoose 8.x |
| **Authentication & RBAC** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs` (10 Salt Rounds), Role-Based Access Control Middleware |
| **Formula & Math Engine** | `mathjs` AST Expression Compiler (Isolated Variable Scopes) |
| **Validation & Security** | `joi` Schema Validation, Parameter Sanitization, Centralized Error Handling |
| **Document Generation** | `pdfkit` Vector PDF Generator |
| **Email Transport** | `nodemailer` SMTP Client |
| **Testing Suite** | Jest 29, Supertest, `mongodb-memory-server` |

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) `>= 18.0.0`
- [MongoDB](https://www.mongodb.com/) running locally on `mongodb://127.0.0.1:27017` or a MongoDB Atlas connection URI

### 1. Clone the Repository
```bash
git clone https://github.com/hitesh-kumar123/Urban-Furniture-Accounting.git
cd Urban-Furniture-Accounting
```

### 2. Install Dependencies
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 3. Configure Environment Variables

**Backend (`server/.env`)**:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/peoplepay360
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
APP_URL=http://localhost:5000
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=payroll@peoplepay360.com
```

**Frontend (`client/.env`)**:
```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Seed Database
Populate realistic Indian corporate data (6 full-profile employees across Engineering, Product, Design, HR, 8 wage contracts, shift schedules, leave types, approved allocations, attendance logs, and completed July/August payruns):
```bash
cd server
npm run seed
```

### 5. Run the Application

**Terminal 1 (Backend API)**:
```bash
cd server
npm run dev
# Server running at http://localhost:5000
```

**Terminal 2 (Frontend Client)**:
```bash
cd client
npm run dev
# Client running at http://localhost:3000
```

---

## 👥 Demo Personas & RBAC Matrix

The system includes pre-configured personas for testing all 5 role permission tiers. You can use the Quick Demo Login buttons on the login or landing page:

| Role | Demo Email | Password | Permissions & Capabilities |
| :--- | :--- | :--- | :--- |
| **🛡️ Admin** | `admin@peoplepay360.com` | `Password@123` | **Superuser**: Full unrestricted access across all workforce, payroll, and system configuration modules. |
| **📋 HR Manager** | `hrmanager@peoplepay360.com` | `Password@123` | **Workforce Operations**: Manage Employee profiles, Contracts, Shift Schedules, Leave Approvals, Attendance Audits, Executive Reports. |
| **💼 HR Payroll Manager** | `payrollmgr@peoplepay360.com` | `Password@123` | **Payroll Authority**: Payrun Wizard, Salary Rules, Structure Configuration, Batch Validation & Payment Disbursal, Bulk Payslips Release. |
| **⚙️ HR Payroll User** | `payrolluser@peoplepay360.com` | `Password@123` | **Payroll Operator**: Payrun Drafts, Salary Computation, Attendance review. |
| **👤 Employee** | `alex.turner@peoplepay360.com` | `Password@123` | **Self-Service**: Punch Clock In/Out, View Active Contract & Wage, Leave Applications, View & Download Personal PDF Payslips. |

---

## 📡 API Endpoints

All endpoints are prefixed with `/api` and require a valid Bearer JWT token (except `/auth/login` and `/auth/register`):

| Module | Method | Endpoint | Description | Access Tier |
| :--- | :---: | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/login` | Authenticate user & issue JWT | Public |
| **Auth** | `GET` | `/api/auth/me` | Fetch active user profile | Authenticated |
| **Employees** | `GET` | `/api/employees` | List all employees (filterable) | Authenticated |
| **Employees** | `POST` | `/api/employees` | Create a new employee record | HR / Admin |
| **Contracts** | `GET` | `/api/contracts` | List contracts (filtered for employee) | Authenticated |
| **Contracts** | `GET` | `/api/contracts/applicable` | Resolve active contract for period | Authenticated |
| **Schedules** | `GET` | `/api/schedules` | List 7-day working schedules | HR / Payroll / Admin |
| **Attendance** | `GET` | `/api/attendance` | List attendance records | Authenticated |
| **Attendance** | `POST` | `/api/attendance` | Clock In / Record attendance | Authenticated |
| **Attendance** | `PUT` | `/api/attendance/:id` | Clock Out / Manual correction | Authenticated |
| **Time Off** | `GET` | `/api/time-off/balance` | Get employee leave entitlement balances | Authenticated |
| **Time Off** | `POST` | `/api/time-off/requests` | Submit a leave request | Authenticated |
| **Time Off** | `POST` | `/api/time-off/requests/:id/approve` | Approve a leave request | HR / Payroll / Admin |
| **Salary Structures** | `GET` | `/api/salary-structures` | List salary structures | HR / Payroll / Admin |
| **Salary Rules** | `GET` | `/api/salary-rules` | List all sequential salary rules | HR / Payroll / Admin |
| **Payruns** | `GET` | `/api/payruns` | List payrun batches | HR / Payroll / Admin |
| **Payruns** | `POST` | `/api/payruns` | Create a payrun batch (Step 1 & 2) | Payroll / Admin |
| **Payruns** | `POST` | `/api/payruns/:id/compute` | Execute 7-stage computation engine | Payroll / Admin |
| **Payruns** | `POST` | `/api/payruns/:id/validate` | Validate and lock payroll batch | Payroll Manager / Admin |
| **Payruns** | `POST` | `/api/payruns/:id/mark-paid` | Execute payout disbursement | Payroll Manager / Admin |
| **Payslips** | `GET` | `/api/payslips` | List payslips | Authenticated |
| **Payslips** | `GET` | `/api/payslips/:id/pdf` | Stream certified vector PDF payslip | Owner / HR / Payroll |
| **Dashboard** | `GET` | `/api/dashboard/payroll` | Fetch executive financial KPIs | HR / Payroll / Admin |

---

## 🔒 Security Architecture

PeoplePay360 implements defense-in-depth security principles across the entire application:

- **Password Security**: Passwords hashed using `bcryptjs` with 10 salt rounds. Password hashes have `select: false` on Mongoose schemas to prevent accidental database leakage.
- **Granular RBAC Enforcement**: Role-based access control enforced via `roleMiddleware.js` at every route, ensuring least privilege access across all 5 user tiers.
- **IDOR Prevention**: Payslip, contract, and attendance lookups enforce employee identity ownership, preventing unauthorized horizontal access to other staff records.
- **Sandboxed AST Formula Evaluation**: Dynamic mathematical expressions run through `mathjs` AST evaluator with strict variable scoping, completely eliminating `eval()` remote code execution (RCE) vectors.
- **Input Validation & Sanitization**: Joi schemas strictly validate and sanitize all `POST` and `PUT` request bodies, preventing NoSQL injection and parameter pollution.
- **Error Masking**: Centralized global error handling suppresses internal server traces and database connection details from client responses.

---

## 🧪 Automated Testing

PeoplePay360 includes a comprehensive test suite covering RBAC authorization, contract resolution, shift calculations, leave balance accounting, the salary AST engine, and end-to-end payrun lifecycles:

```bash
cd server
npm test
```

```text
PASS tests/e2e_demo_flow.test.js
PASS tests/auth_rbac.test.js
PASS tests/payrun_workflow.test.js
PASS tests/salary_engine.test.js
PASS tests/leave_balance.test.js
PASS tests/dashboard.test.js
PASS tests/contract_schedule.test.js

Test Suites: 7 passed, 7 total
Tests:       16 passed, 16 total
Snapshots:   0 total
Time:        9.359 s
Ran all test suites.
```

---

## 📄 License

Distributed under the **MIT License**.
