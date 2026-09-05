# PeoplePay360 – HR & Payroll Operations Platform (Backend)

An enterprise-grade, integrated REST API backend for **Human Resource and Payroll Operations** built with the **MERN** stack (Node.js, Express.js, MongoDB, Mongoose) featuring complete dynamic payroll calculation, RBAC authorization, historical contract versioning, leave balance accounting, PDF payslip generation, Nodemailer dispatch, and live dashboard analytics.

---

## 1. System Architecture & Flow

```
Employee
   ↓
Contract (Historical / Active) + Working Schedule (Auto Weekly Hours)
   ↓
Attendance (Clock In/Out, Worked Hours) + Time Off (Allocations & Auto Balances)
   ↓
Salary Structure + Dynamic Salary Rules (Fixed, Percentage, Math Formula)
   ↓
Payrun (2-Step Creation: Structure & Period → Eligible Employee Filtering)
   ↓
Compute & Duplicate Protection → Validation → Mark Paid → PDF Generation / Email
   ↓
Live Database Aggregations / Dashboard Analytics
```

---

## 2. Technology Stack

- **Runtime**: Node.js
- **Web Framework**: Express.js
- **Database & ODM**: MongoDB / Mongoose 8.x
- **Authentication**: JWT (`jsonwebtoken`) & `bcryptjs`
- **Validation**: `joi` Schema Validation Middleware
- **Formula Evaluation Engine**: `mathjs`
- **Document Generation**: `pdfkit` (Professional Vector Payslip PDFs)
- **Email Delivery**: `nodemailer` (Ethereal test accounts / SMTP)
- **Testing**: `jest`, `supertest`, `mongodb-memory-server`

---

## 3. Directory Structure

```
server/
├── .env.example
├── .env
├── package.json
├── src/
│   ├── config/
│   │   ├── db.js                 # MongoDB connection & transaction management
│   │   ├── env.js                # Validated environment configuration
│   │   └── mailer.js             # Nodemailer transporter initialization
│   ├── models/
│   │   ├── User.js               # 5 RBAC roles, bcrypt hashing, JWT auth
│   │   ├── Employee.js           # Central HR profile & department metadata
│   │   ├── Contract.js           # Historical & active wage terms
│   │   ├── WorkingSchedule.js    # Shift schedules & auto weekly hour calculation
│   │   ├── Attendance.js         # Daily check in/out, worked hours, corrections
│   │   ├── TimeOffType.js        # Leave types (paid/unpaid, allocation rules)
│   │   ├── LeaveAllocation.js    # Leave grants & dynamic balance tracking
│   │   ├── TimeOffRequest.js     # Leave applications & approval workflows
│   │   ├── SalaryStructure.js    # Ordered salary rule collections
│   │   ├── SalaryRule.js         # Configurable formula/percentage/fixed calculation rules
│   │   ├── Payrun.js             # Payrun workflow (Draft → Computed → Validated → Paid)
│   │   └── Payslip.js            # Finalized payslip breakdown & duplicate prevention
│   ├── services/
│   │   ├── contractService.js    # Period-specific contract lookup (getApplicableContract)
│   │   ├── scheduleService.js    # Working schedule calculation engine
│   │   ├── leaveService.js       # Leave allocation consumption & atomic deductions
│   │   ├── salaryEngine.js       # Dynamic sequence-based salary calculation engine
│   │   ├── payrunService.js      # Payrun compute, validation, duplicate check
│   │   ├── pdfService.js         # PDFKit professional payslip generation
│   │   ├── emailService.js       # Bulk email delivery with PDF attachments
│   │   └── dashboardService.js   # Live MongoDB aggregation pipelines for analytics
│   ├── controllers/              # REST API controllers
│   ├── routes/                   # Route definitions with RBAC & validation
│   ├── middleware/               # Auth, RBAC, Error, and Joi validation middlewares
│   ├── validators/               # Joi validation schemas
│   ├── utils/                    # Standard response formatting & math evaluator
│   ├── seed/                     # Realistic seed script (npm run seed)
│   ├── app.js                    # Express application setup
│   └── server.js                 # Server entry point
└── tests/                        # Comprehensive unit & integration tests
    ├── auth_rbac.test.js
    ├── contract_schedule.test.js
    ├── leave_balance.test.js
    ├── salary_engine.test.js
    ├── payrun_workflow.test.js
    ├── dashboard.test.js
    └── e2e_demo_flow.test.js
```

---

## 4. User Roles & RBAC Matrix

The system implements 5 exact roles with route-level enforcement:

| Module / Action | Employee | HR Manager | HR Payroll User | HR Payroll Manager | Admin |
|---|:---:|:---:|:---:|:---:|:---:|
| **Auth / Own Profile** | Read/Self | Read/Self | Read/Self | Read/Self | Full |
| **Employee Management** | Read Self | Full CRUD | Full CRUD | Full CRUD | Full CRUD |
| **Contracts** | - | Full CRUD | Full CRUD | Full CRUD | Full CRUD |
| **Working Schedules** | Read Self | Full CRUD | Full CRUD | Full CRUD | Full CRUD |
| **Attendance** | Read/Self Clock In | Full CRUD | Full CRUD | Full CRUD | Full CRUD |
| **Time Off Types** | Read Active | Full CRUD | Full CRUD | Full CRUD | Full CRUD |
| **Leave Allocations** | Read Self | Full CRUD | Full CRUD | Full CRUD | Full CRUD |
| **Time Off Requests** | Read/Apply Self | Full CRUD + Approve/Refuse | Full CRUD + Approve/Refuse | Full CRUD + Approve/Refuse | Full CRUD |
| **Salary Structures** | - | - | Read Only | Full CRUD | Full CRUD |
| **Salary Rules** | - | - | Read Only | Full CRUD | Full CRUD |
| **Payruns** | - | - | Create/Read/Update/Compute | Full CRUD + Validate/Pay | Full CRUD |
| **Payslips** | Read/PDF Self | - | Read/Update | Full CRUD + Email | Full CRUD |
| **Dashboard / Reports** | - | HR Stats | Read Payroll | Full Analytics | Full Analytics |

---

## 5. Important Business Rules Implemented

1. **Period-Specific Contract Resolution (`getApplicableContract`)**:
   - Payroll does not naively use the latest contract. It selects the contract active during `[periodStart, periodEnd]`, preserving historical contracts.
   - Prevents concurrent active contract conflicts.
2. **Working Schedule Auto Hours**:
   - Computes daily work duration from `startTime`, `endTime`, and `breakMinutes`. Automatically aggregates `totalWeeklyHours`.
3. **Attendance & Worked Hours Calculation**:
   - Computes daily worked hours from `checkIn` and `checkOut` timestamps. Supports manual HR corrections.
4. **Automatic Leave Balance Deduction**:
   - Approving a `TimeOffRequest` automatically increments `takenAmount` and decrements `remainingAmount` on the employee's active `LeaveAllocation`.
   - Prevents approvals if requested duration exceeds remaining balance.
5. **Dynamic Sequenced Salary Rule Engine**:
   - Executes rules in strict ascending sequence.
   - Supports **Fixed** amount, **Percentage** (of Basic or any base rule), and **Formula** (`mathjs` expressions like `CONTRACT_WAGE * 0.50`, `BASIC * 0.12`, `GROSS - DEDUCTIONS`).
   - Context is enriched cumulatively for downstream rules.
6. **2-Step Payrun Processing & Duplicate Prevention**:
   - **Step 1**: Select Salary Structure and Payroll Period.
   - **Step 2**: Query and select eligible employees with active contracts in the period.
   - **Compute**: Generates detailed payslips with rule breakdowns. Compound unique index (`employee + payrollPeriod.start + payrollPeriod.end`) and service-level checks prevent duplicate active payslips.
   - **Validate & Mark Paid**: Checks for critical warnings before finalizing and updating payslip statuses.
7. **Real PDF Generation & Bulk Email**:
   - Real `pdfkit` generation creates itemized vector payslips.
   - Bulk emails dispatch PDFs to employees with delivery status tracking.
8. **Live Database Aggregations**:
   - Dashboard metrics (Net Paid, Headcount by Dept, Salary Expenditure, Attendance Health, Leave Summary) run live MongoDB aggregation pipelines with date/dept filters.

---

## 6. Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@peoplepay360.com` | `Password@123` |
| **HR Manager** | `hrmanager@peoplepay360.com` | `Password@123` |
| **HR Payroll User** | `payrolluser@peoplepay360.com` | `Password@123` |
| **HR Payroll Manager** | `payrollmgr@peoplepay360.com` | `Password@123` |
| **Employee** | `alex.turner@peoplepay360.com` | `Password@123` |

---

## 7. Setup and Execution

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/peoplepay360
JWT_SECRET=peoplepay360_super_secret_jwt_key_2026_hackathon
JWT_EXPIRES_IN=7d
APP_URL=http://localhost:5000
```

### 3. Seed Realistic Database
```bash
npm run seed
```

### 4. Run Automated Test Suite
```bash
npm test
```

### 5. Start Backend Server
```bash
npm start
# Or for live reload during development:
npm run dev
```
Server runs on: `http://localhost:5000`  
Health check: `GET http://localhost:5000/api/health`

---

## 8. REST API Summary

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Authenticate and retrieve JWT token
- `GET  /api/auth/me` - Get current user profile and linked employee

### Employees (`/api/employees`)
- `GET    /api/employees` - List employees with filters (`department`, `employeeStatus`, `employeeType`, `search`)
- `GET    /api/employees/:id` - Get employee profile & active contract details
- `POST   /api/employees` - Create employee record
- `PUT    /api/employees/:id` - Update employee details
- `DELETE /api/employees/:id` - Delete employee record

### Contracts (`/api/contracts`)
- `GET    /api/contracts` - List contracts
- `GET    /api/contracts/applicable?employeeId=...&startDate=...&endDate=...` - Resolve period-specific applicable contract
- `GET    /api/contracts/:id` - Get contract details
- `POST   /api/contracts` - Create contract (validates against active overlaps)
- `PUT    /api/contracts/:id` - Update contract
- `DELETE /api/contracts/:id` - Delete contract

### Working Schedules (`/api/schedules`)
- `GET    /api/schedules` - List working schedules
- `GET    /api/schedules/:id` - Get schedule with automatic weekly hours
- `POST   /api/schedules` - Create schedule (auto computes `totalWeeklyHours`)
- `PUT    /api/schedules/:id` - Update schedule
- `DELETE /api/schedules/:id` - Delete schedule

### Attendance (`/api/attendance`)
- `GET    /api/attendance` - List attendance logs with date/department/status filters
- `GET    /api/attendance/:id` - Get attendance entry
- `POST   /api/attendance` - Create attendance / clock in
- `PUT    /api/attendance/:id` - Clock out or HR manual correction
- `DELETE /api/attendance/:id` - Delete attendance record

### Time Off & Leave Management (`/api/time-off`)
- `GET    /api/time-off/types` - List leave types
- `POST   /api/time-off/types` - Create leave type
- `GET    /api/time-off/allocations` - List leave allocations
- `POST   /api/time-off/allocations` - Grant leave allocation to employee
- `POST   /api/time-off/allocations/:id/approve` - Approve leave allocation
- `GET    /api/time-off/requests` - List time off requests
- `POST   /api/time-off/requests` - Submit leave request (validates balance)
- `POST   /api/time-off/requests/:id/approve` - Approve request & auto-deduct allocation
- `POST   /api/time-off/requests/:id/refuse` - Refuse leave request
- `GET    /api/time-off/balance` - Get leave balance breakdown

### Salary Rules & Structures (`/api/salary-rules`, `/api/salary-structures`)
- `GET    /api/salary-rules` - List ordered salary rules
- `POST   /api/salary-rules` - Create rule (Fixed / Percentage / Formula)
- `GET    /api/salary-structures` - List salary structures
- `POST   /api/salary-structures` - Create structure with ordered rules

### Payrun Processing (`/api/payruns`)
- `GET    /api/payruns` - List payruns
- `GET    /api/payruns/eligible-employees?salaryStructureId=...&periodStart=...&periodEnd=...` - Step 2: Query eligible employees
- `POST   /api/payruns` - Step 1: Create payrun
- `POST   /api/payruns/:id/compute` - Compute all employee payslips with rule breakdowns
- `POST   /api/payruns/:id/validate` - Validate payrun against critical warnings
- `POST   /api/payruns/:id/mark-paid` - Transition payrun and payslips to Paid
- `POST   /api/payruns/:id/send-payslips` - Bulk dispatch payslips via email with PDF

### Payslips (`/api/payslips`)
- `GET    /api/payslips` - List payslips (Employee sees self, HR sees all)
- `GET    /api/payslips/:id` - Get payslip detail
- `GET    /api/payslips/:id/pdf` - Download printable payslip PDF
- `POST   /api/payslips/:id/send-email` - Send single payslip email

### Live Payroll & HR Dashboard (`/api/dashboard`)
- `GET    /api/dashboard/payroll?periodStart=...&periodEnd=...&department=...` - Live aggregated analytics
