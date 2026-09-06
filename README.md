<div align="center">

# 🌟 Staffora (PeoplePay360) — Enterprise HR, Attendance & Payroll Platform

**An enterprise-grade Workforce Operations, Real-Time Multi-Punch Attendance, and Deterministic Payroll Operations Suite built on the modern MERN stack with native Indian Statutory Compliance (EPFO, PT, TDS) and INR (₹) Financial Ledgers.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-18.x-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/vite-5.x-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/tailwind-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208-47A248.svg)](https://www.mongodb.com/)
[![Test Suite](https://img.shields.io/badge/Tests-16%20Passed%20(100%25)-39D98A.svg)](#-automated-testing)

[Key Features](#-key-features) • [System Architecture](#-system-architecture) • [Tech Stack](#-technology-stack) • [Quick Start](#-quick-start) • [RBAC Matrix](#-demo-personas--rbac-matrix) • [API Endpoints](#-api-endpoints) • [Security](#-security-architecture) • [Testing](#-automated-testing)

</div>

---

## 🌟 Overview

**Staffora (PeoplePay360)** is a full-stack, modular HR and Payroll management suite designed for modern organizations that demand mathematical precision, operational speed, and strict regulatory compliance. It unifies complete workforce operations (employee lifecycle, multi-punch attendance desk, 7-day shift patterns, leave entitlement accounting) with an enterprise 7-stage payroll computation engine, a sandboxed mathematical AST formula parser, and certified PDF payslip generation.

Built with native support for **Indian Statutory Compliance** (EPFO, Professional Tax, TDS withholding slabs) and **INR (`₹`) currency accounting**, Staffora guarantees zero mathematical drift and provides complete transparency from contractual CTC down to downloadable print-ready PDF payslips and Excel-compatible CSV ledgers.

---

## 🚀 Key Features

### 1. 👥 Workforce Directory & Interactive Kanban Board
- **Dual View Modes**: Switch instantly between structured tabular grids and visual **Kanban boards** grouped by Department or Employment Status (`Active`, `Probation`, `Suspended`, `Terminated`).
- **HTML5 Drag-and-Drop**: Reassign employee statuses or departments with real-time optimistic UI updates and backend RBAC authorization.
- **360° Employee Drawer**: Multi-tab inspection modal covering Personal Details, Active Contracts, Shift Logs, Leave Quotas, and Historical Payslips.

### 2. ⏱️ Real-Time Multi-Punch Attendance & Break Tracking
- **Multi-Punch Session Array**: Supports multiple punches in a single day (`punches: [{ in, out, durationHours, type }]`) — employees can clock in, pause for breaks, and resume without overwriting earlier punch history.
- **Timezone-Normalized Local Indexing**: Normalizes attendance dates to local calendar boundaries, ensuring early morning (e.g. 05:00 AM IST) punches correctly align with the current date.
- **HR Manual Log & Adjustments**: Authorized HR/Admin personnel can log missing attendance records with mandatory audit remarks or adjust punch hours.

### 3. 📝 Contract Versioning & Salary CTC Structures
- **Compensation Audit Trail**: Retains complete contract history across promotions, salary revisions, and structure shifts.
- **Deterministic Period Resolution**: Accurately resolves the single active contract applicable to any given payroll period, avoiding overlapping compensation conflicts.
- **Interactive Period Tester**: Test contract applicability against custom arbitrary date ranges.

### 4. 🏖️ Statutory Leave Entitlements & Time Off Accounting
- **Visual Balance Trackers**: Real-time progress visualizers showing Allocated vs Used vs Remaining balances across leave types (Casual, Sick, Paid/Earned, Maternity).
- **Multi-Level Approval Workflows**: 1-click Approve and Refuse actions with automated balance deductions and audit trails.

### 5. 🧮 Salary Structures & Safe MathJS AST Rule Engine
- **3 Calculation Types**:
  - **Fixed Amount**: Static allowances or deductions.
  - **Percentage of Base**: Dynamic percentages calculated against preceding rule codes (e.g., `50% of BASIC` for HRA, `12% of BASIC` for EPF).
  - **Arithmetic Formula**: Custom algebraic expressions evaluated using a sandboxed `mathjs` AST parser (e.g., `(CONTRACT_WAGE / 30) * WORKED_DAYS`).
- **Sequential Execution Hierarchy**: Rules execute strictly in configured sequence (`Basic` $\to$ `Allowances` $\to$ `Gross` $\to$ `Deductions` $\to$ `Net`).

### 6. ⚡ Batch & Single-Employee (Off-Cycle) Payrun Engine
- **2-Step Payrun Wizard**:
  - *Step 1*: Define pay period dates and target Salary Structure.
  - *Step 2*: Live scan of eligible staff $\to$ Bulk select OR use **Single-Employee (Off-Cycle) mode** with live search and 1-click *"Only Select This"* filter.
- **7-Stage Deterministic Pipeline**:
  $$\text{Eligible Staff} \longrightarrow \text{Active Contracts} \longrightarrow \text{Working Hours} \longrightarrow \text{Time Off Deductions} \longrightarrow \text{Salary Rules AST} \longrightarrow \text{Net \& Taxes} \longrightarrow \text{Payslips Ready}$$
- **Controlled Lifecycle**: `Draft` $\to$ `Computed` $\to$ `Validated` $\to$ `Paid` $\to$ `Payslips Distributed`.

### 7. 📄 Digital Payslip Vault & Certified PDF Generator
- **Itemized Breakdown**: Full disclosure of Basic Pay, Allowances, Statutory Deductions (EPFO, PT, TDS), and Net Take-Home in INR (`₹`).
- **High-Resolution Vector PDF Generator**: Generates certified, print-ready PDF payslips with clear typography, organizational stamps, and verification blocks.
- **Bulk & Single Email Distribution**: Integrates with SMTP to dispatch payslips directly to employees.

### 8. 🛡️ System & Security Settings (Admin-Only Role Governance)
- **Corporate Parameters**: Organization legal identity, GSTIN, PAN, Pay Cycle, and base currency.
- **Live User Directory & Role Assignment**: Admin can seamlessly modify user access roles (`Employee` $\leftrightarrow$ `HR Manager` $\leftrightarrow$ `Admin`) with dual-layer backend protection (`403 Forbidden` for non-admins).
- **Granular RBAC Permissions Matrix**: Transparent 5-tier access control matrix across all platform modules.

---

## 🏗️ System Architecture

```
                                 ┌─────────────────────────────────┐
                                 │       Staffora Client UI        │
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
| **Frontend Framework** | React 18, Vite 5, Tailwind CSS, Custom Design System, React Router v6, Axios, Lucide Icons, Google Fonts (*Outfit*, *Plus Jakarta Sans*, *JetBrains Mono*) |
| **Backend Framework** | Node.js (v18+), Express.js 4.x |
| **Database & ODM** | MongoDB Atlas / Local, Mongoose 8.x |
| **Authentication & RBAC** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs` (10 Salt Rounds), Role-Based Access Control Middleware |
| **Formula & Math Engine** | `mathjs` AST Expression Compiler (Isolated Variable Scopes, zero `eval()`) |
| **Validation & Security** | `joi` Schema Validation, Parameter Sanitization, Centralized Error Handling |
| **Document Generation** | Client & Server Vector PDF Engine (`pdfkit` / `jspdf`) |
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
Populate realistic Indian corporate data (6 full-profile employees across Engineering, Product, Design, HR, 8 wage contracts, shift schedules, leave types, approved allocations, attendance logs, and completed payruns):
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
| **🛡️ Admin** | `admin@peoplepay360.com` | `Password@123` | **Superuser**: Full unrestricted access across all workforce, payroll, user management, and corporate settings. |
| **📋 HR Manager** | `hrmanager@peoplepay360.com` | `Password@123` | **Workforce Operations**: Manage Employee profiles, Contracts, Shift Schedules, Leave Approvals, Attendance Audits, Executive Reports. |
| **💼 HR Payroll Manager** | `payrollmgr@peoplepay360.com` | `Password@123` | **Payroll Authority**: Payrun Wizard, Salary Rules, Structure Configuration, Batch Validation & Payment Disbursal, Bulk Payslips Release. |
| **⚙️ HR Payroll User** | `payrolluser@peoplepay360.com` | `Password@123` | **Payroll Operator**: Payrun Drafts, Salary Computation, Attendance review. |
| **👤 Employee** | `alex.turner@peoplepay360.com` | `Password@123` | **Self-Service**: Multi-Punch In/Out Clock, View Active Contract & Wage, Apply Leaves, View & Download Personal PDF Payslips. |

---

## 📡 API Endpoints

All endpoints are prefixed with `/api` and require a valid Bearer JWT token (except `/auth/login` and `/auth/register`):

| Module | Method | Endpoint | Description | Access Tier |
| :--- | :---: | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/login` | Authenticate user & issue JWT | Public |
| **Auth** | `GET` | `/api/auth/me` | Fetch active user profile | Authenticated |
| **Auth** | `GET` | `/api/auth/users` | List registered user directory | Admin |
| **Auth** | `PATCH` | `/api/auth/users/:id/role` | Update user access role | Admin |
| **Employees** | `GET` | `/api/employees` | List all employees (filterable) | Authenticated |
| **Employees** | `POST` | `/api/employees` | Create a new employee record | HR / Admin |
| **Contracts** | `GET` | `/api/contracts` | List contracts (filtered for employee) | Authenticated |
| **Contracts** | `GET` | `/api/contracts/applicable` | Resolve active contract for period | Authenticated |
| **Attendance** | `POST` | `/api/attendance/punch` | Live clock in / break out / resume punch | Authenticated (Self) |
| **Attendance** | `GET` | `/api/attendance` | List attendance records | Authenticated |
| **Attendance** | `POST` | `/api/attendance` | Manual attendance log | HR / Admin |
| **Attendance** | `PUT` | `/api/attendance/:id` | Adjust attendance hours & status | HR / Admin |
| **Time Off** | `GET` | `/api/time-off/balance` | Get employee leave entitlement balances | Authenticated |
| **Time Off** | `POST` | `/api/time-off/requests` | Submit a leave request | Authenticated |
| **Time Off** | `POST` | `/api/time-off/requests/:id/approve` | Approve a leave request | HR / Payroll / Admin |
| **Salary Rules** | `GET` | `/api/salary-rules` | List all sequential salary rules | HR / Payroll / Admin |
| **Payruns** | `POST` | `/api/payruns` | Create a payrun batch (Step 1 & 2) | Payroll / Admin |
| **Payruns** | `POST` | `/api/payruns/:id/compute` | Execute 7-stage computation engine | Payroll / Admin |
| **Payruns** | `POST` | `/api/payruns/:id/validate` | Validate and lock payroll batch | Payroll Manager / Admin |
| **Payruns** | `POST` | `/api/payruns/:id/mark-paid` | Execute payout disbursement | Payroll Manager / Admin |
| **Payslips** | `GET` | `/api/payslips` | List payslips | Authenticated |
| **Payslips** | `GET` | `/api/payslips/:id/pdf` | Stream certified vector PDF payslip | Owner / HR / Payroll |
| **Dashboard** | `GET` | `/api/dashboard/payroll` | Fetch executive financial KPIs | HR / Payroll / Admin |

---

## 🔒 Security Architecture

Staffora implements defense-in-depth security principles across the entire application:

- **Password Security**: Passwords hashed using `bcryptjs` with 10 salt rounds. Password hashes have `select: false` on Mongoose schemas to prevent accidental database leakage.
- **Granular RBAC Enforcement**: Role-based access control enforced via `roleMiddleware.js` at every route, ensuring least privilege access across all 5 user tiers.
- **Horizontal Access Control (IDOR Prevention)**: Payslip, contract, and attendance lookups enforce employee identity ownership, preventing unauthorized access to other staff records.
- **Sandboxed AST Formula Evaluation**: Dynamic mathematical expressions run through `mathjs` AST evaluator with strict variable scoping, completely eliminating `eval()` remote code execution (RCE) vectors.
- **Strict User Role Governance**: User role updates (`PATCH /api/auth/users/:id/role`) are strictly restricted to `Admin` users with controller-level and route-level authorization barriers.
- **Input Validation & Sanitization**: Joi schemas strictly validate and sanitize all request bodies, preventing NoSQL injection and parameter pollution.
- **Error Masking**: Centralized global error handling suppresses internal server traces and database connection details from client responses.

---

## 🧪 Automated Testing

Staffora includes a comprehensive test suite covering RBAC authorization, contract resolution, shift calculations, leave balance accounting, the salary AST engine, and end-to-end payrun lifecycles:

```bash
cd server
npm test
```

```text
PASS tests/e2e_demo_flow.test.js
PASS tests/auth_rbac.test.js
PASS tests/payrun_workflow.test.js
PASS tests/leave_balance.test.js
PASS tests/salary_engine.test.js
PASS tests/contract_schedule.test.js
PASS tests/dashboard.test.js

Test Suites: 7 passed, 7 total
Tests:       16 passed, 16 total
Snapshots:   0 total
Time:        9.959 s
Ran all test suites.
```

---

## 📄 License

Distributed under the **MIT License**.
