const User = require('../models/User');
const Employee = require('../models/Employee');
const { WorkingSchedule } = require('../models/WorkingSchedule');
const Contract = require('../models/Contract');
const Attendance = require('../models/Attendance');
const TimeOffType = require('../models/TimeOffType');
const LeaveAllocation = require('../models/LeaveAllocation');
const TimeOffRequest = require('../models/TimeOffRequest');
const SalaryRule = require('../models/SalaryRule');
const SalaryStructure = require('../models/SalaryStructure');
const Payrun = require('../models/Payrun');
const Payslip = require('../models/Payslip');
const { calculateSalary } = require('../services/salaryEngine');

const DEPARTMENTS = [
  'Engineering',
  'Product',
  'Design',
  'Marketing',
  'Sales',
  'Human Resources',
  'Finance',
  'Operations'
];

const RAW_50_EMPLOYEES_DATA = [
  // 1-12 Engineering
  { id: 'EMP-001', first: 'Aarav', last: 'Sharma', dept: 'Engineering', pos: 'Lead Software Architect', type: 'Full-Time', wage: 185000, bank: 'HDFC Bank', ac: '50100234567891', ifsc: 'HDFC0001234', city: 'Bengaluru', status: 'Active' },
  { id: 'EMP-002', first: 'Priya', last: 'Patel', dept: 'Engineering', pos: 'Senior Backend Engineer', type: 'Full-Time', wage: 125000, bank: 'ICICI Bank', ac: '001105012345', ifsc: 'ICIC0000011', city: 'Pune', status: 'Active' },
  { id: 'EMP-003', first: 'Aditya', last: 'Verma', dept: 'Engineering', pos: 'Senior Frontend Developer', type: 'Full-Time', wage: 110000, bank: 'State Bank of India', ac: '30495829102', ifsc: 'SBIN0004521', city: 'Bengaluru', status: 'Active' },
  { id: 'EMP-004', first: 'Rohan', last: 'Mehta', dept: 'Engineering', pos: 'DevOps & Cloud Specialist', type: 'Full-Time', wage: 135000, bank: 'Axis Bank Ltd', ac: '914010023456789', ifsc: 'UTIB0000140', city: 'Hyderabad', status: 'Active' },
  { id: 'EMP-005', first: 'Neha', last: 'Gupta', dept: 'Engineering', pos: 'Full Stack Engineer', type: 'Full-Time', wage: 95000, bank: 'Kotak Mahindra Bank', ac: '6543210987', ifsc: 'KKBK0000654', city: 'Bengaluru', status: 'Active' },
  { id: 'EMP-006', first: 'Kunal', last: 'Bose', dept: 'Engineering', pos: 'Data Platform Engineer', type: 'Full-Time', wage: 105000, bank: 'HDFC Bank', ac: '50100492817263', ifsc: 'HDFC0001234', city: 'Kolkata', status: 'Active' },
  { id: 'EMP-007', first: 'Ishaan', last: 'Nair', dept: 'Engineering', pos: 'QA Automation Lead', type: 'Full-Time', wage: 85000, bank: 'ICICI Bank', ac: '002205098765', ifsc: 'ICIC0000022', city: 'Kochi', status: 'Active' },
  { id: 'EMP-008', first: 'Siddharth', last: 'Rao', dept: 'Engineering', pos: 'Distributed Systems Engineer', type: 'Full-Time', wage: 140000, bank: 'HDFC Bank', ac: '50100918273645', ifsc: 'HDFC0001820', city: 'Bengaluru', status: 'Active' },
  { id: 'EMP-009', first: 'Tanvi', last: 'Deshmukh', dept: 'Engineering', pos: 'Mobile Applications Engineer', type: 'Contractor', wage: 75000, bank: 'Axis Bank', ac: '918010082736152', ifsc: 'UTIB0000918', city: 'Pune', status: 'Active' },
  { id: 'EMP-010', first: 'Arjun', last: 'Chauhan', dept: 'Engineering', pos: 'Security Operations Engineer', type: 'Full-Time', wage: 115000, bank: 'State Bank of India', ac: '31928475610', ifsc: 'SBIN0001890', city: 'Delhi NCR', status: 'Active' },
  { id: 'EMP-011', first: 'Meera', last: 'Iyer', dept: 'Engineering', pos: 'Junior Backend Developer', type: 'Intern', wage: 30000, bank: 'Kotak Mahindra', ac: '7829103948', ifsc: 'KKBK0000192', city: 'Chennai', status: 'Probation' },
  { id: 'EMP-012', first: 'Dev', last: 'Singhal', dept: 'Engineering', pos: 'Frontend Intern', type: 'Intern', wage: 28000, bank: 'HDFC Bank', ac: '50100829102938', ifsc: 'HDFC0000451', city: 'Bengaluru', status: 'Probation' },

  // 13-18 Product & Strategy
  { id: 'EMP-013', first: 'Vikram', last: 'Malhotra', dept: 'Product', pos: 'Principal Product Manager', type: 'Full-Time', wage: 165000, bank: 'HDFC Bank', ac: '50100382910293', ifsc: 'HDFC0000120', city: 'Mumbai', status: 'Active' },
  { id: 'EMP-014', first: 'Sneha', last: 'Kulkarni', dept: 'Product', pos: 'Senior Technical PM', type: 'Full-Time', wage: 130000, bank: 'ICICI Bank', ac: '003305019283', ifsc: 'ICIC0000033', city: 'Pune', status: 'Active' },
  { id: 'EMP-015', first: 'Gaurav', last: 'Bhatia', dept: 'Product', pos: 'Growth Product Manager', type: 'Full-Time', wage: 120000, bank: 'Axis Bank', ac: '915010092837461', ifsc: 'UTIB0000150', city: 'Delhi NCR', status: 'Active' },
  { id: 'EMP-016', first: 'Ananya', last: 'Sen', dept: 'Product', pos: 'Associate Product Manager', type: 'Full-Time', wage: 70000, bank: 'Kotak Bank', ac: '9182736450', ifsc: 'KKBK0000918', city: 'Bengaluru', status: 'Active' },
  { id: 'EMP-017', first: 'Kabir', last: 'Kapoor', dept: 'Product', pos: 'Lead Technical Writer', type: 'Full-Time', wage: 65000, bank: 'State Bank of India', ac: '32019284756', ifsc: 'SBIN0002100', city: 'Mumbai', status: 'Active' },
  { id: 'EMP-018', first: 'Rhea', last: 'Chopra', dept: 'Product', pos: 'Product Analytics Specialist', type: 'Full-Time', wage: 85000, bank: 'HDFC Bank', ac: '50100293847561', ifsc: 'HDFC0000980', city: 'Bengaluru', status: 'Active' },

  // 19-24 Design & User Experience
  { id: 'EMP-019', first: 'Varun', last: 'Saxena', dept: 'Design', pos: 'Head of Brand & UX Design', type: 'Full-Time', wage: 155000, bank: 'ICICI Bank', ac: '004405029384', ifsc: 'ICIC0000044', city: 'Bengaluru', status: 'Active' },
  { id: 'EMP-020', first: 'Pooja', last: 'Mishra', dept: 'Design', pos: 'Senior Product Designer', type: 'Full-Time', wage: 95000, bank: 'HDFC Bank', ac: '50100938475610', ifsc: 'HDFC0000234', city: 'Mumbai', status: 'Active' },
  { id: 'EMP-021', first: 'Nikhil', last: 'Pillai', dept: 'Design', pos: 'Design Systems Architect', type: 'Full-Time', wage: 100000, bank: 'Axis Bank', ac: '916010038475619', ifsc: 'UTIB0000160', city: 'Chennai', status: 'Active' },
  { id: 'EMP-022', first: 'Divya', last: 'Nambiar', dept: 'Design', pos: 'User Research Specialist', type: 'Contractor', wage: 65000, bank: 'Kotak Bank', ac: '8291039485', ifsc: 'KKBK0000829', city: 'Bengaluru', status: 'Active' },
  { id: 'EMP-023', first: 'Ayush', last: 'Tiwari', dept: 'Design', pos: 'Visual & Motion Designer', type: 'Full-Time', wage: 60000, bank: 'State Bank of India', ac: '33948572019', ifsc: 'SBIN0003400', city: 'Delhi NCR', status: 'Active' },
  { id: 'EMP-024', first: 'Tara', last: 'Venkatesh', dept: 'Design', pos: 'UI Design Intern', type: 'Intern', wage: 25000, bank: 'ICICI Bank', ac: '005505039485', ifsc: 'ICIC0000055', city: 'Hyderabad', status: 'Probation' },

  // 25-30 Marketing & Growth
  { id: 'EMP-025', first: 'Rahul', last: 'Khanna', dept: 'Marketing', pos: 'Director of Growth Marketing', type: 'Full-Time', wage: 160000, bank: 'HDFC Bank', ac: '50100394857201', ifsc: 'HDFC0000450', city: 'Mumbai', status: 'Active' },
  { id: 'EMP-026', first: 'Zoya', last: 'Khan', dept: 'Marketing', pos: 'Performance Marketing Lead', type: 'Full-Time', wage: 90000, bank: 'ICICI Bank', ac: '006605049382', ifsc: 'ICIC0000066', city: 'Bengaluru', status: 'Active' },
  { id: 'EMP-027', first: 'Manish', last: 'Joshi', dept: 'Marketing', pos: 'Content Marketing Specialist', type: 'Full-Time', wage: 55000, bank: 'Axis Bank', ac: '917010049382710', ifsc: 'UTIB0000170', city: 'Delhi NCR', status: 'Active' },
  { id: 'EMP-028', first: 'Kriti', last: 'Pandey', dept: 'Marketing', pos: 'Brand Communications Lead', type: 'Full-Time', wage: 75000, bank: 'Kotak Bank', ac: '7394850291', ifsc: 'KKBK0000739', city: 'Mumbai', status: 'Active' },
  { id: 'EMP-029', first: 'Samir', last: 'Ali', dept: 'Marketing', pos: 'SEO & Inbound Strategist', type: 'Full-Time', wage: 60000, bank: 'State Bank of India', ac: '34958671029', ifsc: 'SBIN0004500', city: 'Hyderabad', status: 'Active' },
  { id: 'EMP-030', first: 'Ananya', last: 'Roy', dept: 'Marketing', pos: 'Social Media Associate', type: 'Part-Time', wage: 35000, bank: 'HDFC Bank', ac: '50100485960192', ifsc: 'HDFC0000780', city: 'Kolkata', status: 'Active' },

  // 31-36 Sales & Enterprise Partnerships
  { id: 'EMP-031', first: 'Amitabh', last: 'Srivastava', dept: 'Sales', pos: 'VP of Global Enterprise Sales', type: 'Full-Time', wage: 210000, bank: 'HDFC Bank', ac: '50100596019283', ifsc: 'HDFC0000890', city: 'Mumbai', status: 'Active' },
  { id: 'EMP-032', first: 'Deepika', last: 'Menon', dept: 'Sales', pos: 'Enterprise Account Executive', type: 'Full-Time', wage: 120000, bank: 'ICICI Bank', ac: '007705059483', ifsc: 'ICIC0000077', city: 'Bengaluru', status: 'Active' },
  { id: 'EMP-033', first: 'Karan', last: 'Oberoi', dept: 'Sales', pos: 'Strategic Partnerships Lead', type: 'Full-Time', wage: 110000, bank: 'Axis Bank', ac: '918010059483721', ifsc: 'UTIB0000180', city: 'Delhi NCR', status: 'Active' },
  { id: 'EMP-034', first: 'Shweta', last: 'Bajaj', dept: 'Sales', pos: 'Commercial Sales Specialist', type: 'Full-Time', wage: 80000, bank: 'Kotak Bank', ac: '6485920193', ifsc: 'KKBK0000648', city: 'Pune', status: 'Active' },
  { id: 'EMP-035', first: 'Harsh', last: 'Goyal', dept: 'Sales', pos: 'Sales Development Representative', type: 'Full-Time', wage: 50000, bank: 'State Bank of India', ac: '35069782103', ifsc: 'SBIN0005600', city: 'Mumbai', status: 'Active' },
  { id: 'EMP-036', first: 'Simran', last: 'Kaur', dept: 'Sales', pos: 'Customer Success Manager', type: 'Full-Time', wage: 70000, bank: 'HDFC Bank', ac: '50100607182934', ifsc: 'HDFC0000910', city: 'Chandigarh', status: 'Active' },

  // 37-41 Human Resources & People Operations
  { id: 'EMP-037', first: 'Neha', last: 'Reddy', dept: 'Human Resources', pos: 'Head of People & Culture', type: 'Full-Time', wage: 140000, bank: 'HDFC Bank', ac: '50100718293041', ifsc: 'HDFC0001120', city: 'Hyderabad', status: 'Active' },
  { id: 'EMP-038', first: 'Sunil', last: 'Narang', dept: 'Human Resources', pos: 'Principal Payroll & Compliance Lead', type: 'Full-Time', wage: 115000, bank: 'ICICI Bank', ac: '008805069584', ifsc: 'ICIC0000088', city: 'Mumbai', status: 'Active' },
  { id: 'EMP-039', first: 'Kavita', last: 'Iyer', dept: 'Human Resources', pos: 'Senior Payroll Specialist', type: 'Full-Time', wage: 80000, bank: 'Axis Bank', ac: '919010069584732', ifsc: 'UTIB0000190', city: 'Chennai', status: 'Active' },
  { id: 'EMP-040', first: 'Abhishek', last: 'Roy', dept: 'Human Resources', pos: 'Talent Acquisition Partner', type: 'Full-Time', wage: 65000, bank: 'Kotak Bank', ac: '5394857201', ifsc: 'KKBK0000539', city: 'Bengaluru', status: 'Active' },
  { id: 'EMP-041', first: 'Pragya', last: 'Dutta', dept: 'Human Resources', pos: 'HR Operations Associate', type: 'Full-Time', wage: 48000, bank: 'State Bank of India', ac: '36170893214', ifsc: 'SBIN0006700', city: 'Kolkata', status: 'Active' },

  // 42-46 Finance, Legal & Compliance
  { id: 'EMP-042', first: 'Rajesh', last: 'Singhania', dept: 'Finance', pos: 'Chief Financial Officer', type: 'Full-Time', wage: 250000, bank: 'HDFC Bank', ac: '50100829304152', ifsc: 'HDFC0001340', city: 'Mumbai', status: 'Active' },
  { id: 'EMP-043', first: 'Pallavi', last: 'Deshmukh', dept: 'Finance', pos: 'Director of Corporate Finance', type: 'Full-Time', wage: 150000, bank: 'ICICI Bank', ac: '009905079685', ifsc: 'ICIC0000099', city: 'Pune', status: 'Active' },
  { id: 'EMP-044', first: 'Alok', last: 'Nanda', dept: 'Finance', pos: 'Corporate Tax & Statutory Manager', type: 'Full-Time', wage: 110000, bank: 'Axis Bank', ac: '920010079685843', ifsc: 'UTIB0000200', city: 'Delhi NCR', status: 'Active' },
  { id: 'EMP-045', first: 'Geeta', last: 'Bhandari', dept: 'Finance', pos: 'Senior Accounts Specialist', type: 'Full-Time', wage: 65000, bank: 'Kotak Bank', ac: '4283948572', ifsc: 'KKBK0000428', city: 'Mumbai', status: 'Active' },
  { id: 'EMP-046', first: 'Tushar', last: 'Parekh', dept: 'Finance', pos: 'Legal & Risk Counsel', type: 'Contractor', wage: 120000, bank: 'State Bank of India', ac: '37281904325', ifsc: 'SBIN0007800', city: 'Mumbai', status: 'Active' },

  // 47-50 IT & Operational Support
  { id: 'EMP-047', first: 'Manoj', last: 'Vaidya', dept: 'Operations', pos: 'Director of IT & Facilities', type: 'Full-Time', wage: 130000, bank: 'HDFC Bank', ac: '50100930415263', ifsc: 'HDFC0001450', city: 'Bengaluru', status: 'Active' },
  { id: 'EMP-048', first: 'Bhavna', last: 'Swaminathan', dept: 'Operations', pos: 'Customer Support Lead', type: 'Full-Time', wage: 70000, bank: 'ICICI Bank', ac: '001005089796', ifsc: 'ICIC0000010', city: 'Chennai', status: 'Active' },
  { id: 'EMP-049', first: 'Naveen', last: 'Choudhary', dept: 'Operations', pos: 'Systems & Network Admin', type: 'Full-Time', wage: 55000, bank: 'Axis Bank', ac: '921010089796954', ifsc: 'UTIB0000210', city: 'Hyderabad', status: 'Active' },
  { id: 'EMP-050', first: 'Ritika', last: 'Dhar', dept: 'Operations', pos: 'Operations Support Executive', type: 'Full-Time', wage: 42000, bank: 'State Bank of India', ac: '38392015436', ifsc: 'SBIN0008900', city: 'Delhi NCR', status: 'Active' }
];

const seedDatabase = async () => {
  console.log('[Seeder] 1. Cleaning existing database collections...');
  await Promise.all([
    User.deleteMany({}),
    Employee.deleteMany({}),
    WorkingSchedule.deleteMany({}),
    Contract.deleteMany({}),
    Attendance.deleteMany({}),
    TimeOffType.deleteMany({}),
    LeaveAllocation.deleteMany({}),
    TimeOffRequest.deleteMany({}),
    SalaryRule.deleteMany({}),
    SalaryStructure.deleteMany({}),
    Payrun.deleteMany({}),
    Payslip.deleteMany({})
  ]);

  console.log('[Seeder] 2. Creating Working Schedules...');
  const standardDays = [
    { day: 'Monday', isWorkingDay: true, startTime: '09:30', endTime: '18:30', breakMinutes: 60 },
    { day: 'Tuesday', isWorkingDay: true, startTime: '09:30', endTime: '18:30', breakMinutes: 60 },
    { day: 'Wednesday', isWorkingDay: true, startTime: '09:30', endTime: '18:30', breakMinutes: 60 },
    { day: 'Thursday', isWorkingDay: true, startTime: '09:30', endTime: '18:30', breakMinutes: 60 },
    { day: 'Friday', isWorkingDay: true, startTime: '09:30', endTime: '18:30', breakMinutes: 60 },
    { day: 'Saturday', isWorkingDay: false, startTime: '09:00', endTime: '17:00', breakMinutes: 0 },
    { day: 'Sunday', isWorkingDay: false, startTime: '09:00', endTime: '17:00', breakMinutes: 0 }
  ];

  const standardSchedule = await WorkingSchedule.create({
    name: 'Standard Corporate 40-Hour Week',
    description: 'Monday to Friday, 9:30 AM to 6:30 PM with 1-hour lunch break',
    days: standardDays
  });

  const flexibleSchedule = await WorkingSchedule.create({
    name: 'Flexible Engineering 35-Hour Shift',
    description: 'Monday to Friday 10:00 AM to 6:00 PM with 1-hour break',
    days: [
      { day: 'Monday', isWorkingDay: true, startTime: '10:00', endTime: '18:00', breakMinutes: 60 },
      { day: 'Tuesday', isWorkingDay: true, startTime: '10:00', endTime: '18:00', breakMinutes: 60 },
      { day: 'Wednesday', isWorkingDay: true, startTime: '10:00', endTime: '18:00', breakMinutes: 60 },
      { day: 'Thursday', isWorkingDay: true, startTime: '10:00', endTime: '18:00', breakMinutes: 60 },
      { day: 'Friday', isWorkingDay: true, startTime: '10:00', endTime: '18:00', breakMinutes: 60 },
      { day: 'Saturday', isWorkingDay: false, startTime: '09:00', endTime: '17:00', breakMinutes: 0 },
      { day: 'Sunday', isWorkingDay: false, startTime: '09:00', endTime: '17:00', breakMinutes: 0 }
    ]
  });

  const operationsSchedule = await WorkingSchedule.create({
    name: 'Support & Ops 44-Hour Week',
    description: 'Mon-Fri full day + Saturday half day',
    days: [
      { day: 'Monday', isWorkingDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
      { day: 'Tuesday', isWorkingDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
      { day: 'Wednesday', isWorkingDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
      { day: 'Thursday', isWorkingDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
      { day: 'Friday', isWorkingDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
      { day: 'Saturday', isWorkingDay: true, startTime: '09:30', endTime: '13:30', breakMinutes: 0 },
      { day: 'Sunday', isWorkingDay: false, startTime: '09:00', endTime: '17:00', breakMinutes: 0 }
    ]
  });

  console.log('[Seeder] 3. Creating 50 Diverse Indian Enterprise Employees...');
  const createdEmployees = [];

  for (const raw of RAW_50_EMPLOYEES_DATA) {
    const sched = raw.dept === 'Engineering' || raw.dept === 'Design' 
      ? flexibleSchedule._id 
      : raw.dept === 'Operations' 
      ? operationsSchedule._id 
      : standardSchedule._id;

    const email = `${raw.first.toLowerCase()}.${raw.last.toLowerCase()}@staffora.com`;

    const emp = await Employee.create({
      employeeId: raw.id,
      firstName: raw.first,
      lastName: raw.last,
      email,
      phone: `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`,
      department: raw.dept,
      jobPosition: raw.pos,
      workingSchedule: sched,
      employeeStatus: raw.status || 'Active',
      employeeType: raw.type,
      joiningDate: new Date('2023-01-15'),
      bankAccount: {
        bankName: raw.bank,
        accountNumber: raw.ac,
        ifscOrRouting: raw.ifsc,
        accountHolderName: `${raw.first} ${raw.last}`
      },
      address: {
        street: `Suite ${Math.floor(100 + Math.random() * 900)}, Tech Park Road`,
        city: raw.city,
        state: raw.city === 'Bengaluru' ? 'Karnataka' : raw.city === 'Mumbai' || raw.city === 'Pune' ? 'Maharashtra' : raw.city === 'Delhi NCR' ? 'Delhi' : raw.city === 'Hyderabad' ? 'Telangana' : 'Tamil Nadu',
        zipCode: '400051',
        country: 'India'
      }
    });

    createdEmployees.push(emp);
  }

  console.log('[Seeder] 4. Creating 5 User Authentication Logins...');
  const commonPassword = 'Password@123';
  const hashedCommon = await User.hashPassword(commonPassword);

  const adminUser = await User.create({
    name: 'Rajesh Singhania (Admin)',
    email: 'admin@staffora.com',
    passwordHash: hashedCommon,
    role: 'Admin',
    status: 'Active'
  });

  // Backward compatibility alias login
  await User.create({
    name: 'Rajesh Singhania (Admin)',
    email: 'admin@peoplepay360.com',
    passwordHash: hashedCommon,
    role: 'Admin',
    status: 'Active'
  });

  const hrManagerUser = await User.create({
    name: 'Neha Reddy (HR Manager)',
    email: 'hrmanager@staffora.com',
    passwordHash: hashedCommon,
    role: 'HR Manager',
    employee: createdEmployees[36]._id,
    status: 'Active'
  });

  await User.create({
    name: 'Neha Reddy (HR Manager)',
    email: 'hrmanager@peoplepay360.com',
    passwordHash: hashedCommon,
    role: 'HR Manager',
    employee: createdEmployees[36]._id,
    status: 'Active'
  });

  const payrollUser = await User.create({
    name: 'Kavita Iyer (Payroll Specialist)',
    email: 'payrolluser@staffora.com',
    passwordHash: hashedCommon,
    role: 'HR Payroll User',
    employee: createdEmployees[38]._id,
    status: 'Active'
  });

  await User.create({
    name: 'Kavita Iyer (Payroll Specialist)',
    email: 'payrolluser@peoplepay360.com',
    passwordHash: hashedCommon,
    role: 'HR Payroll User',
    employee: createdEmployees[38]._id,
    status: 'Active'
  });

  const payrollManagerUser = await User.create({
    name: 'Sunil Narang (Payroll Head)',
    email: 'payrollmgr@staffora.com',
    passwordHash: hashedCommon,
    role: 'HR Payroll Manager',
    employee: createdEmployees[37]._id,
    status: 'Active'
  });

  await User.create({
    name: 'Sunil Narang (Payroll Head)',
    email: 'payrollmgr@peoplepay360.com',
    passwordHash: hashedCommon,
    role: 'HR Payroll Manager',
    employee: createdEmployees[37]._id,
    status: 'Active'
  });

  const empUser = await User.create({
    name: 'Aarav Sharma (Employee)',
    email: 'aarav.sharma@staffora.com',
    passwordHash: hashedCommon,
    role: 'Employee',
    employee: createdEmployees[0]._id,
    status: 'Active'
  });

  await User.create({
    name: 'Alex Turner (Employee)',
    email: 'alex.turner@peoplepay360.com',
    passwordHash: hashedCommon,
    role: 'Employee',
    employee: createdEmployees[0]._id,
    status: 'Active'
  });

  console.log('[Seeder] 5. Creating Salary Rules & Sequential Formulas...');
  const ruleBasic = await SalaryRule.create({
    name: 'Basic Pay',
    code: 'BASIC',
    category: 'Basic',
    sequence: 10,
    calculationType: 'Formula',
    formula: 'CONTRACT_WAGE * 0.50',
    description: '50% of monthly base contract wage'
  });

  const ruleHra = await SalaryRule.create({
    name: 'House Rent Allowance (HRA)',
    code: 'HRA',
    category: 'Allowances',
    sequence: 20,
    calculationType: 'Percentage',
    percentage: 40,
    percentageBaseRuleCode: 'BASIC',
    description: '40% of Basic Pay towards residential accommodation'
  });

  const ruleSpecial = await SalaryRule.create({
    name: 'Special Allowance',
    code: 'SPECIAL_ALLOWANCE',
    category: 'Allowances',
    sequence: 30,
    calculationType: 'Fixed',
    fixedAmount: 5000,
    description: 'Monthly utility, conveyance & performance allowance'
  });

  const ruleMedical = await SalaryRule.create({
    name: 'Medical & Health Allowance',
    code: 'MED_ALLOWANCE',
    category: 'Allowances',
    sequence: 35,
    calculationType: 'Fixed',
    fixedAmount: 1500,
    description: 'Monthly statutory medical reimbursement component'
  });

  const ruleGross = await SalaryRule.create({
    name: 'Gross Earnings',
    code: 'GROSS',
    category: 'Gross',
    sequence: 40,
    calculationType: 'Formula',
    formula: 'BASIC + HRA + SPECIAL_ALLOWANCE + MED_ALLOWANCE',
    description: 'Total Gross Earnings before statutory deductions'
  });

  const rulePf = await SalaryRule.create({
    name: 'Provident Fund (EPF)',
    code: 'PF',
    category: 'Deductions',
    sequence: 50,
    calculationType: 'Percentage',
    percentage: 12,
    percentageBaseRuleCode: 'BASIC',
    description: '12% of Basic Pay towards employee retirement fund'
  });

  const ruleTax = await SalaryRule.create({
    name: 'Professional Tax (PT)',
    code: 'PRO_TAX',
    category: 'Deductions',
    sequence: 60,
    calculationType: 'Fixed',
    fixedAmount: 200,
    description: 'State statutory professional tax'
  });

  const ruleTds = await SalaryRule.create({
    name: 'Income Tax (TDS)',
    code: 'TDS',
    category: 'Deductions',
    sequence: 70,
    calculationType: 'Formula',
    formula: 'GROSS * 0.08',
    description: '8% Income Tax TDS deduction on Gross earnings'
  });

  const ruleNet = await SalaryRule.create({
    name: 'Net Take-Home Salary',
    code: 'NET',
    category: 'Net',
    sequence: 100,
    calculationType: 'Formula',
    formula: 'GROSS - DEDUCTIONS',
    description: 'Final Take-home salary credited to bank account'
  });

  console.log('[Seeder] 6. Creating Salary Structures...');
  const standardStructure = await SalaryStructure.create({
    name: 'Standard Indian Corporate Salary Structure',
    code: 'IND_CORP_2026',
    description: 'Comprehensive monthly salary package compliant with Indian statutory rules (EPF, PT, TDS, HRA)',
    rules: [
      ruleBasic._id,
      ruleHra._id,
      ruleSpecial._id,
      ruleMedical._id,
      ruleGross._id,
      rulePf._id,
      ruleTax._id,
      ruleTds._id,
      ruleNet._id
    ]
  });

  console.log('[Seeder] 7. Creating Active Employment Contracts for all 50 Employees...');
  for (let i = 0; i < createdEmployees.length; i++) {
    const emp = createdEmployees[i];
    const raw = RAW_50_EMPLOYEES_DATA[i];
    const sched = emp.workingSchedule;

    await Contract.create({
      employee: emp._id,
      name: `${emp.firstName} ${emp.lastName} - Permanent Employment Agreement`,
      startDate: new Date('2024-01-01'),
      endDate: null,
      wage: raw.wage,
      department: raw.dept,
      jobPosition: raw.pos,
      salaryStructure: standardStructure._id,
      workingSchedule: sched,
      status: 'Active',
      terms: 'Standard full-time employment agreement with EPF and statutory compliance.'
    });
  }

  console.log('[Seeder] 8. Creating Time Off Types, Quotas & Requests...');
  const plType = await TimeOffType.create({
    name: 'Privilege / Annual Leave (PL)',
    code: 'PL',
    unit: 'days',
    allocationRequired: true,
    approvalRequired: true,
    isPaid: true,
    description: 'Statutory paid annual vacation leaves'
  });

  const clType = await TimeOffType.create({
    name: 'Casual Leave (CL)',
    code: 'CL',
    unit: 'days',
    allocationRequired: true,
    approvalRequired: true,
    isPaid: true,
    description: 'Casual personal leaves for unplanned errands'
  });

  const slType = await TimeOffType.create({
    name: 'Sick & Medical Leave (SL)',
    code: 'SL',
    unit: 'days',
    allocationRequired: true,
    approvalRequired: true,
    isPaid: true,
    description: 'Paid medical leave for health recovery'
  });

  const currentYearStart = new Date('2026-01-01');
  const currentYearEnd = new Date('2026-12-31');

  for (let i = 0; i < createdEmployees.length; i++) {
    const emp = createdEmployees[i];
    await LeaveAllocation.create({
      employee: emp._id,
      timeOffType: plType._id,
      allocatedAmount: 18,
      takenAmount: i % 4 === 0 ? 3 : i % 5 === 0 ? 2 : 0,
      remainingAmount: i % 4 === 0 ? 15 : i % 5 === 0 ? 16 : 18,
      validityStart: currentYearStart,
      validityEnd: currentYearEnd,
      status: 'Approved',
      remarks: 'Annual 2026 Privilege Leave Quota'
    });

    await LeaveAllocation.create({
      employee: emp._id,
      timeOffType: clType._id,
      allocatedAmount: 12,
      takenAmount: i % 3 === 0 ? 1 : 0,
      remainingAmount: i % 3 === 0 ? 11 : 12,
      validityStart: currentYearStart,
      validityEnd: currentYearEnd,
      status: 'Approved',
      remarks: 'Annual 2026 Casual Leave Quota'
    });

    await LeaveAllocation.create({
      employee: emp._id,
      timeOffType: slType._id,
      allocatedAmount: 10,
      takenAmount: 0,
      remainingAmount: 10,
      validityStart: currentYearStart,
      validityEnd: currentYearEnd,
      status: 'Approved',
      remarks: 'Annual 2026 Sick Leave Quota'
    });
  }

  // Sample Leave Requests across statuses
  await TimeOffRequest.create({
    employee: createdEmployees[0]._id,
    timeOffType: plType._id,
    startDate: new Date('2026-08-12'),
    endDate: new Date('2026-08-14'),
    duration: 3,
    status: 'Approved',
    reason: 'Attending family wedding ceremony in Jaipur',
    approvedBy: hrManagerUser._id,
    approvedAt: new Date('2026-08-08')
  });

  await TimeOffRequest.create({
    employee: createdEmployees[1]._id,
    timeOffType: clType._id,
    startDate: new Date('2026-09-18'),
    endDate: new Date('2026-09-19'),
    duration: 2,
    status: 'Pending',
    reason: 'Personal home relocation and banking documentation'
  });

  await TimeOffRequest.create({
    employee: createdEmployees[2]._id,
    timeOffType: plType._id,
    startDate: new Date('2026-09-24'),
    endDate: new Date('2026-09-26'),
    duration: 3,
    status: 'Pending',
    reason: 'Attending React Global Developer Summit in Bengaluru'
  });

  await TimeOffRequest.create({
    employee: createdEmployees[3]._id,
    timeOffType: plType._id,
    startDate: new Date('2026-08-25'),
    endDate: new Date('2026-08-28'),
    duration: 4,
    status: 'Refused',
    reason: 'Extended vacation after national holiday',
    approvedBy: hrManagerUser._id,
    approvedAt: new Date('2026-08-20'),
    rejectionReason: 'Critical database migration scheduled on production cluster during this window.'
  });

  console.log('[Seeder] 9. Generating Attendance Punch Records across Months...');
  const sampleDates = [
    '2026-08-03', '2026-08-04', '2026-08-05', '2026-08-06', '2026-08-07',
    '2026-08-10', '2026-08-11', '2026-08-12', '2026-08-13', '2026-08-14',
    '2026-08-17', '2026-08-18', '2026-08-19', '2026-08-20', '2026-08-21',
    '2026-08-24', '2026-08-25', '2026-08-26', '2026-08-27', '2026-08-28',
    '2026-08-31', '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04',
    '2026-09-05'
  ];

  for (const dateStr of sampleDates) {
    const d = new Date(dateStr);
    for (let i = 0; i < createdEmployees.length; i++) {
      const emp = createdEmployees[i];
      const inTime = new Date(d);
      inTime.setHours(9, 30, 0);

      const outTime = new Date(d);
      outTime.setHours(18, 30, 0);

      let status = 'Present';
      let workedHours = 8.0;
      let finalCheckOut = outTime;

      // Create natural distribution of attendance metrics
      if ((i + d.getDate()) % 17 === 0) {
        status = 'Late';
        inTime.setHours(10, 20, 0);
        workedHours = 7.15;
      } else if ((i + d.getDate()) % 29 === 0) {
        status = 'Overtime';
        outTime.setHours(21, 15, 0);
        workedHours = 10.75;
      } else if (dateStr === '2026-09-05' && i === 15) {
        status = 'Missing Check-out';
        finalCheckOut = null;
        workedHours = 0;
      } else if ((i + d.getDate()) % 31 === 0) {
        status = 'Half Day';
        outTime.setHours(14, 0, 0);
        workedHours = 4.0;
      }

      await Attendance.create({
        employee: emp._id,
        date: d,
        checkIn: inTime,
        checkOut: finalCheckOut,
        workedHours,
        status
      });
    }
  }

  console.log('[Seeder] 10. Creating 4-Month Historical Settled Payruns (May, Jun, Jul, Aug 2026) & Draft (Sep 2026)...');

  const createBatch = async (name, start, end, status, finalizeDate) => {
    const payrun = new Payrun({
      name,
      salaryStructure: standardStructure._id,
      periodStart: start,
      periodEnd: end,
      selectedEmployees: createdEmployees.map((e) => e._id),
      status,
      createdBy: payrollManagerUser._id,
      finalizedAt: finalizeDate,
      paidAt: finalizeDate
    });
    await payrun.save();

    const payslipIds = [];
    let totalB = 0, totalA = 0, totalG = 0, totalD = 0, totalN = 0;

    for (const emp of createdEmployees) {
      const contract = await Contract.findOne({ employee: emp._id, status: 'Active' });
      const calc = await calculateSalary({
        employee: emp,
        contract,
        salaryStructure: standardStructure,
        payrollPeriod: { start, end },
        workingSchedule: standardSchedule
      });

      const payslip = await Payslip.create({
        employee: emp._id,
        payrun: payrun._id,
        contract: contract._id,
        salaryStructure: standardStructure._id,
        payrollPeriod: { start, end },
        metrics: calc.metrics,
        basic: calc.basic,
        allowances: calc.allowances,
        gross: calc.gross,
        deductions: calc.deductions,
        net: calc.net,
        ruleBreakdown: calc.ruleBreakdown,
        status: status === 'Paid' ? 'Paid' : 'Draft'
      });

      payslipIds.push(payslip._id);
      totalB += calc.basic;
      totalA += calc.allowances;
      totalG += calc.gross;
      totalD += calc.deductions;
      totalN += calc.net;
    }

    payrun.payslips = payslipIds;
    payrun.totals = {
      totalBasic: totalB,
      totalAllowances: totalA,
      totalGross: totalG,
      totalDeductions: totalD,
      totalNet: totalN,
      employeeCount: payslipIds.length
    };
    await payrun.save();
    return payrun;
  };

  // May 2026 Batch
  await createBatch(
    'May 2026 Corporate Pay Cycle',
    new Date('2026-05-01'),
    new Date('2026-05-31'),
    'Paid',
    new Date('2026-05-31T18:30:00Z')
  );

  // June 2026 Batch
  await createBatch(
    'June 2026 Corporate Pay Cycle',
    new Date('2026-06-01'),
    new Date('2026-06-30'),
    'Paid',
    new Date('2026-06-30T18:30:00Z')
  );

  // July 2026 Batch
  await createBatch(
    'July 2026 Corporate Pay Cycle',
    new Date('2026-07-01'),
    new Date('2026-07-31'),
    'Paid',
    new Date('2026-07-31T18:30:00Z')
  );

  // August 2026 Batch
  await createBatch(
    'August 2026 Corporate Pay Cycle',
    new Date('2026-08-01'),
    new Date('2026-08-31'),
    'Paid',
    new Date('2026-08-31T18:30:00Z')
  );

  // September 2026 Active Draft Batch
  await Payrun.create({
    name: 'September 2026 Corporate Pay Cycle',
    salaryStructure: standardStructure._id,
    periodStart: new Date('2026-09-01'),
    periodEnd: new Date('2026-09-30'),
    selectedEmployees: createdEmployees.map((e) => e._id),
    status: 'Draft',
    createdBy: payrollUser._id
  });

  console.log('========================================================================');
  console.log(' SEEDING COMPLETED: 50 EMPLOYEES + 4-MONTH HISTORICAL PAYROLL DATA READY');
  console.log('========================================================================');
  console.log('Demo Logins (Password: Password@123):');
  console.log('1. Admin:                 admin@staffora.com (or admin@peoplepay360.com)');
  console.log('2. HR Manager:            hrmanager@staffora.com');
  console.log('3. HR Payroll User:       payrolluser@staffora.com');
  console.log('4. HR Payroll Manager:    payrollmgr@staffora.com');
  console.log('5. Employee:              aarav.sharma@staffora.com');
  console.log('========================================================================');
};

module.exports = {
  seedDatabase
};
