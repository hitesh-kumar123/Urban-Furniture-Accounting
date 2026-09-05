import React, { useState, useEffect } from 'react';
import { employeeApi } from '../api/employeeApi';
import { contractApi } from '../api/contractApi';
import { attendanceApi } from '../api/attendanceApi';
import { timeOffApi } from '../api/timeOffApi';
import { payslipApi } from '../api/payslipApi';
import { scheduleApi } from '../api/scheduleApi';
import { salaryApi } from '../api/salaryApi';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const EmployeesPage = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'matrix'
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Slide-over Hub selected employee
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [hubTab, setHubTab] = useState('profile'); // 'profile' | 'contracts' | 'attendance' | 'timeOff' | 'payslips'
  const [hubData, setHubData] = useState({
    contracts: [],
    attendance: [],
    timeOffRequests: [],
    leaveBalances: [],
    payslips: []
  });
  const [hubLoading, setHubLoading] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [schedules, setSchedules] = useState([]);

  const { user, hasRole } = useAuth();
  const { showToast } = useToast();

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await employeeApi.getAll({
        search: search || undefined,
        department: deptFilter || undefined,
        employeeStatus: statusFilter || undefined
      });
      if (res.success) {
        setEmployees(res.data);
        if (res.data.length > 0 && !selectedEmployee) {
          selectEmployee(res.data[0]);
        }
      }
    } catch (err) {
      showToast('Failed to load employee list', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      const res = await scheduleApi.getAll();
      if (res.success) setSchedules(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchSchedules();
  }, [search, deptFilter, statusFilter]);

  const selectEmployee = async (emp) => {
    setSelectedEmployee(emp);
    setHubLoading(true);
    try {
      const [contractsRes, attRes, leavesRes, balRes, payslipsRes] = await Promise.all([
        contractApi.getAll({ employee: emp._id }),
        attendanceApi.getAll({ employee: emp._id }),
        timeOffApi.getRequests({ employee: emp._id }),
        timeOffApi.getBalance({ employeeId: emp._id }),
        payslipApi.getAll({ employee: emp._id })
      ]);

      setHubData({
        contracts: contractsRes.data || [],
        attendance: attRes.data || [],
        timeOffRequests: leavesRes.data || [],
        leaveBalances: Array.isArray(balRes.data) ? balRes.data : [],
        payslips: payslipsRes.data || []
      });
    } catch (err) {
      console.error('Error fetching hub data:', err);
    } finally {
      setHubLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this employee record?')) return;
    try {
      const res = await employeeApi.delete(id);
      if (res.success) {
        showToast('Employee deleted successfully', 'success');
        fetchEmployees();
        if (selectedEmployee?._id === id) setSelectedEmployee(null);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed', 'error');
    }
  };

  return (
    <div className="p-space-lg max-w-[1600px] w-full mx-auto flex flex-col gap-space-md">
      {/* Top Action Bar / Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-xs mb-1">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">
              Talent Core
            </span>
            <span className="text-outline text-label-sm">•</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
              Real-Time Directory Sync
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
          </div>
          <div className="flex items-baseline gap-space-sm">
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
              Employee Directory &amp; Talent Hub
            </h1>
            <span className="font-label-md text-label-md px-space-xs py-0.5 rounded-xl bg-surface-container-high text-on-surface-variant font-semibold">
              {employees.length} active
            </span>
          </div>
        </div>

        {/* Quick Controls */}
        <div className="flex flex-wrap items-center gap-space-xs">
          {/* Segmented View Toggle */}
          <div className="flex items-center bg-surface-container-low p-1 rounded-xl shadow-inner">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-space-xs py-1 rounded-lg font-label-md text-label-md font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-base">format_list_bulleted</span>
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`flex items-center gap-1 px-space-xs py-1 rounded-lg font-label-md text-label-md font-semibold transition-all ${
                viewMode === 'matrix'
                  ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-base">view_kanban</span>
              <span>Matrix</span>
            </button>
          </div>

          {/* Department Filter */}
          <div className="relative">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="appearance-none bg-surface-container-lowest text-on-surface font-body-sm text-body-sm pl-space-sm pr-space-lg py-1.5 rounded-xl shadow-sm cursor-pointer focus:outline-none"
            >
              <option value="">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Product">Product</option>
              <option value="Design">Design</option>
              <option value="Marketing">Marketing</option>
              <option value="Sales">Sales</option>
              <option value="Operations">Operations</option>
              <option value="Human Resources">Human Resources</option>
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-base">
              expand_more
            </span>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-surface-container-lowest text-on-surface font-body-sm text-body-sm pl-space-sm pr-space-lg py-1.5 rounded-xl shadow-sm cursor-pointer focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Probation">Probation</option>
              <option value="Suspended">Suspended</option>
              <option value="Terminated">Terminated</option>
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-base">
              filter_list
            </span>
          </div>

          {/* Add Employee Button */}
          {hasRole('Admin', 'HR Manager', 'HR Payroll Manager') && (
            <Button
              onClick={() => {
                setEditingEmployee(null);
                setShowCreateModal(true);
              }}
              icon="person_add"
              size="sm"
            >
              + New Employee
            </Button>
          )}
        </div>
      </div>

      {/* Main Split Layout: Table (Left 7 cols) + Slide-Over Hub (Right 5 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-md items-start">
        {/* Left Column: Table or Matrix View */}
        <div
          className={`${
            selectedEmployee ? 'xl:col-span-7' : 'xl:col-span-12'
          } flex flex-col bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden border border-outline-variant/20 transition-all duration-300`}
        >
          {/* Table Search */}
          <div className="p-space-sm bg-surface-container-low flex items-center justify-between gap-space-xs">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-space-xs top-1/2 -translate-y-1/2 text-outline text-lg">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by name, ID, email, or job position..."
                className="w-full pl-9 pr-3 py-1.5 bg-surface-container-lowest rounded-xl font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none shadow-sm"
              />
            </div>
          </div>

          {loading ? (
            <LoadingSpinner message="Fetching talent roster..." />
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low font-label-sm text-label-sm text-outline uppercase tracking-wider select-none">
                    <th className="py-2.5 px-3 font-semibold">Employee</th>
                    <th className="py-2.5 px-3 font-semibold">ID / Role</th>
                    <th className="py-2.5 px-3 font-semibold">Department</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="font-body-sm text-body-sm text-on-surface divide-y divide-outline-variant/10">
                  {employees.map((emp) => {
                    const isSelected = selectedEmployee?._id === emp._id;
                    return (
                      <tr
                        key={emp._id}
                        onClick={() => selectEmployee(emp)}
                        className={`transition-colors cursor-pointer group ${
                          isSelected
                            ? 'bg-surface-container-high/60 hover:bg-surface-container-high'
                            : 'hover:bg-surface-container-low'
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-space-xs">
                            <div className="relative">
                              <div className="w-9 h-9 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-xs shadow-sm">
                                {emp.firstName[0]}{emp.lastName[0]}
                              </div>
                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-surface-container-lowest"></span>
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-title-sm text-title-sm font-bold text-primary group-hover:underline truncate">
                                {emp.firstName} {emp.lastName}
                              </span>
                              <span className="font-caption text-caption text-on-surface-variant truncate">
                                {emp.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="flex flex-col">
                            <span className="font-label-md text-label-md font-semibold text-on-surface">
                              {emp.jobPosition}
                            </span>
                            <span className="font-caption text-caption text-on-surface-variant">
                              {emp.employeeId}
                            </span>
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">
                            {emp.department}
                          </span>
                        </td>

                        <td className="py-2.5 px-3">
                          <Badge
                            variant={
                              emp.employeeStatus === 'Active'
                                ? 'success'
                                : emp.employeeStatus === 'Probation'
                                ? 'warning'
                                : 'danger'
                            }
                          >
                            {emp.employeeStatus}
                          </Badge>
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            {hasRole('Admin', 'HR Manager', 'HR Payroll Manager') && (
                              <button
                                onClick={() => {
                                  setEditingEmployee(emp);
                                  setShowCreateModal(true);
                                }}
                                className="p-1 hover:bg-surface-container rounded-lg text-primary text-xs font-semibold"
                                title="Edit Employee"
                              >
                                <span className="material-symbols-outlined text-base">edit</span>
                              </button>
                            )}
                            {hasRole('Admin', 'HR Manager') && (
                              <button
                                onClick={() => handleDelete(emp._id)}
                                className="p-1 hover:bg-rose-50 rounded-lg text-error"
                                title="Delete Employee"
                              >
                                <span className="material-symbols-outlined text-base">delete</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Matrix / Kanban View */
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {employees.map((emp) => (
                <div
                  key={emp._id}
                  onClick={() => selectEmployee(emp)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                    selectedEmployee?._id === emp._id
                      ? 'border-primary bg-primary-container/5 shadow-md'
                      : 'border-outline-variant/30 bg-surface-container-lowest hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                      {emp.firstName[0]}{emp.lastName[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-on-surface">{emp.firstName} {emp.lastName}</h4>
                      <p className="text-xs text-on-surface-variant">{emp.jobPosition}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-outline-variant/10">
                    <span className="text-on-surface-variant font-medium">{emp.department}</span>
                    <Badge variant={emp.employeeStatus === 'Active' ? 'success' : 'warning'}>
                      {emp.employeeStatus}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Slide-Over Employee Central Hub */}
        {selectedEmployee && (
          <div className="xl:col-span-5 bg-surface-container-lowest rounded-2xl shadow-md border border-outline-variant/20 p-space-md flex flex-col gap-space-md">
            {/* Hub Header Card */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-secondary text-white flex items-center justify-center font-bold text-lg shadow-md">
                  {selectedEmployee.firstName[0]}{selectedEmployee.lastName[0]}
                </div>
                <div className="flex flex-col">
                  <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </h2>
                  <span className="text-xs text-primary font-bold">
                    {selectedEmployee.jobPosition} • {selectedEmployee.employeeId}
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    {selectedEmployee.department} • Joined {new Date(selectedEmployee.joiningDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <Badge variant={selectedEmployee.employeeStatus === 'Active' ? 'success' : 'warning'}>
                {selectedEmployee.employeeStatus}
              </Badge>
            </div>

            {/* Smart Navigation Tabs */}
            <div className="flex items-center bg-surface-container-low p-1 rounded-xl gap-1 overflow-x-auto">
              {[
                { id: 'profile', label: 'Profile', icon: 'person' },
                { id: 'contracts', label: 'Contract', icon: 'description' },
                { id: 'attendance', label: 'Attendance', icon: 'schedule' },
                { id: 'timeOff', label: 'Time Off', icon: 'calendar_today' },
                { id: 'payslips', label: 'Payslips', icon: 'receipt_long' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setHubTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg font-label-sm text-label-sm font-semibold transition-all ${
                    hubTab === tab.id
                      ? 'bg-surface-container-lowest text-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Body Contents */}
            {hubLoading ? (
              <LoadingSpinner message="Loading employee intelligence..." />
            ) : hubTab === 'profile' ? (
              <div className="flex flex-col gap-3 text-sm">
                <div className="p-3 bg-surface-container-low rounded-xl flex flex-col gap-1.5">
                  <span className="text-xs text-outline font-semibold uppercase">Contact &amp; Identity</span>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <span className="text-xs text-on-surface-variant">Email:</span>
                      <p className="font-semibold text-xs text-on-surface truncate">{selectedEmployee.email}</p>
                    </div>
                    <div>
                      <span className="text-xs text-on-surface-variant">Phone:</span>
                      <p className="font-semibold text-xs text-on-surface">{selectedEmployee.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-on-surface-variant">Employee Type:</span>
                      <p className="font-semibold text-xs text-on-surface">{selectedEmployee.employeeType}</p>
                    </div>
                    <div>
                      <span className="text-xs text-on-surface-variant">Schedule:</span>
                      <p className="font-semibold text-xs text-on-surface">{selectedEmployee.workingSchedule?.name || 'Standard'}</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-surface-container-low rounded-xl flex flex-col gap-1.5">
                  <span className="text-xs text-outline font-semibold uppercase">Bank Details</span>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <span className="text-xs text-on-surface-variant">Bank Name:</span>
                      <p className="font-semibold text-xs text-on-surface">{selectedEmployee.bankAccount?.bankName || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-on-surface-variant">Account Number:</span>
                      <p className="font-semibold text-xs text-on-surface">
                        {selectedEmployee.bankAccount?.accountNumber ? '••••' + selectedEmployee.bankAccount.accountNumber.slice(-4) : 'Missing'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : hubTab === 'contracts' ? (
              <div className="flex flex-col gap-2">
                {hubData.contracts.length > 0 ? (
                  hubData.contracts.map((c) => (
                    <div key={c._id} className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-on-surface">{c.name}</span>
                        <Badge variant={c.status === 'Active' ? 'success' : 'default'}>{c.status}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-on-surface-variant mt-1">
                        <span>Wage: <strong className="text-primary font-bold">${c.wage?.toLocaleString()}/mo</strong></span>
                        <span>Structure: <strong>{c.salaryStructure?.name || 'Standard'}</strong></span>
                      </div>
                      <span className="text-[11px] text-outline">
                        Period: {new Date(c.startDate).toLocaleDateString()} – {c.endDate ? new Date(c.endDate).toLocaleDateString() : 'Permanent / Ongoing'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-outline py-4 text-center">No contracts found for this employee.</p>
                )}
              </div>
            ) : hubTab === 'attendance' ? (
              <div className="flex flex-col gap-2">
                <span className="text-xs text-outline font-semibold uppercase">Recent Logged Shifts</span>
                {hubData.attendance.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto flex flex-col gap-1.5">
                    {hubData.attendance.slice(0, 10).map((att) => (
                      <div key={att._id} className="p-2.5 bg-surface-container-low rounded-lg flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-on-surface">{new Date(att.date).toLocaleDateString()}</span>
                          <span className="text-on-surface-variant ml-2">({att.workedHours} hrs)</span>
                        </div>
                        <Badge variant={att.status === 'Present' ? 'success' : 'warning'}>{att.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-outline py-4 text-center">No attendance records logged.</p>
                )}
              </div>
            ) : hubTab === 'timeOff' ? (
              <div className="flex flex-col gap-3">
                <div className="p-3 bg-primary-container/10 rounded-xl flex flex-col gap-1">
                  <span className="text-xs font-bold text-primary uppercase">Leave Balance Summary</span>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {hubData.leaveBalances.map((bal, idx) => (
                      <div key={idx} className="p-2 bg-surface-container-lowest rounded-lg shadow-sm">
                        <span className="text-[11px] text-outline block">{bal.timeOffType?.name || 'Leave'}</span>
                        <span className="font-bold text-sm text-primary">{bal.remaining}d Remaining</span>
                        <span className="text-[10px] text-on-surface-variant block">({bal.taken}d taken of {bal.allocated}d)</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-outline font-semibold uppercase">Request History</span>
                  {hubData.timeOffRequests.length > 0 ? (
                    hubData.timeOffRequests.map((req) => (
                      <div key={req._id} className="p-2.5 bg-surface-container-low rounded-lg flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-on-surface">{req.timeOffType?.name} ({req.duration}d)</span>
                          <span className="text-outline block text-[10px]">
                            {new Date(req.startDate).toLocaleDateString()} to {new Date(req.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        <Badge variant={req.status === 'Approved' ? 'success' : req.status === 'Pending' ? 'warning' : 'danger'}>
                          {req.status}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-outline text-center py-2">No leave requests.</p>
                  )}
                </div>
              </div>
            ) : (
              /* Payslips Tab */
              <div className="flex flex-col gap-2">
                <span className="text-xs text-outline font-semibold uppercase">Historical Payslips</span>
                {hubData.payslips.length > 0 ? (
                  hubData.payslips.map((ps) => (
                    <div key={ps._id} className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-sm text-on-surface">${ps.net?.toLocaleString()} Net</span>
                        <span className="text-outline block text-[11px]">
                          Period: {new Date(ps.payrollPeriod.start).toLocaleDateString()} – {new Date(ps.payrollPeriod.end).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={ps.status === 'Paid' ? 'success' : 'warning'}>{ps.status}</Badge>
                        <button
                          onClick={() => payslipApi.downloadPDF(ps._id, `Payslip_${selectedEmployee.employeeId}.pdf`)}
                          className="p-1.5 bg-primary text-white rounded-lg hover:bg-primary-container transition-colors"
                          title="Download Payslip PDF"
                        >
                          <span className="material-symbols-outlined text-sm">download</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-outline py-4 text-center">No payslips calculated yet.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create / Edit Employee Modal */}
      <EmployeeFormModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingEmployee(null);
        }}
        initialData={editingEmployee}
        schedules={schedules}
        onSuccess={() => {
          setShowCreateModal(false);
          setEditingEmployee(null);
          fetchEmployees();
        }}
      />
    </div>
  );
};

// Form Modal Component for Create & Edit
const EmployeeFormModal = ({ isOpen, onClose, initialData, schedules, onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    employeeId: '',
    department: 'Engineering',
    jobPosition: '',
    workingSchedule: '',
    employeeStatus: 'Active',
    employeeType: 'Full-Time',
    joiningDate: new Date().toISOString().split('T')[0],
    bankAccount: {
      bankName: '',
      accountNumber: '',
      ifscOrRouting: '',
      accountHolderName: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (initialData) {
      setFormData({
        firstName: initialData.firstName || '',
        lastName: initialData.lastName || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        employeeId: initialData.employeeId || '',
        department: initialData.department || 'Engineering',
        jobPosition: initialData.jobPosition || '',
        workingSchedule: initialData.workingSchedule?._id || initialData.workingSchedule || '',
        employeeStatus: initialData.employeeStatus || 'Active',
        employeeType: initialData.employeeType || 'Full-Time',
        joiningDate: initialData.joiningDate ? new Date(initialData.joiningDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        bankAccount: {
          bankName: initialData.bankAccount?.bankName || '',
          accountNumber: initialData.bankAccount?.accountNumber || '',
          ifscOrRouting: initialData.bankAccount?.ifscOrRouting || '',
          accountHolderName: initialData.bankAccount?.accountHolderName || ''
        }
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        employeeId: `EMP-${Math.floor(100 + Math.random() * 900)}`,
        department: 'Engineering',
        jobPosition: '',
        workingSchedule: schedules[0]?._id || '',
        employeeStatus: 'Active',
        employeeType: 'Full-Time',
        joiningDate: new Date().toISOString().split('T')[0],
        bankAccount: {
          bankName: '',
          accountNumber: '',
          ifscOrRouting: '',
          accountHolderName: ''
        }
      });
    }
  }, [initialData, isOpen, schedules]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (initialData) {
        await employeeApi.update(initialData._id, formData);
        showToast('Employee updated successfully', 'success');
      } else {
        await employeeApi.create(formData);
        showToast('Employee created successfully', 'success');
      }
      onSuccess();
    } catch (err) {
      showToast(err.response?.data?.message || 'Operation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Employee Record' : 'Onboard New Employee'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-on-surface-variant">First Name *</label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-surface-container-low rounded-xl text-sm focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant">Last Name *</label>
            <input
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-surface-container-low rounded-xl text-sm focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-on-surface-variant">Email Address *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-surface-container-low rounded-xl text-sm focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant">Employee ID *</label>
            <input
              type="text"
              required
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-surface-container-low rounded-xl text-sm focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-on-surface-variant">Department *</label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-surface-container-low rounded-xl text-sm focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="Engineering">Engineering</option>
              <option value="Product">Product</option>
              <option value="Design">Design</option>
              <option value="Marketing">Marketing</option>
              <option value="Sales">Sales</option>
              <option value="Operations">Operations</option>
              <option value="Human Resources">Human Resources</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant">Job Position *</label>
            <input
              type="text"
              required
              value={formData.jobPosition}
              onChange={(e) => setFormData({ ...formData, jobPosition: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-surface-container-low rounded-xl text-sm focus:ring-1 focus:ring-primary outline-none"
              placeholder="e.g. Senior Backend Engineer"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-on-surface-variant">Employment Type</label>
            <select
              value={formData.employeeType}
              onChange={(e) => setFormData({ ...formData, employeeType: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-surface-container-low rounded-xl text-sm focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="Full-Time">Full-Time</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Contractor">Contractor</option>
              <option value="Intern">Intern</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant">Working Schedule</label>
            <select
              value={formData.workingSchedule}
              onChange={(e) => setFormData({ ...formData, workingSchedule: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-surface-container-low rounded-xl text-sm focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="">Default Schedule</option>
              {schedules.map((s) => (
                <option key={s._id} value={s._id}>{s.name} ({s.totalWeeklyHours}h/wk)</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bank Account Fields */}
        <div className="p-3 bg-surface-container-low rounded-xl flex flex-col gap-3">
          <span className="text-xs font-bold text-primary uppercase">Banking &amp; Direct Deposit Setup</span>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-on-surface-variant">Bank Name</label>
              <input
                type="text"
                value={formData.bankAccount.bankName}
                onChange={(e) => setFormData({ ...formData, bankAccount: { ...formData.bankAccount, bankName: e.target.value } })}
                className="w-full mt-1 px-3 py-1.5 bg-surface-container-lowest rounded-lg text-sm outline-none"
                placeholder="JPMorgan Chase"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-on-surface-variant">Account Number</label>
              <input
                type="text"
                value={formData.bankAccount.accountNumber}
                onChange={(e) => setFormData({ ...formData, bankAccount: { ...formData.bankAccount, accountNumber: e.target.value } })}
                className="w-full mt-1 px-3 py-1.5 bg-surface-container-lowest rounded-lg text-sm outline-none"
                placeholder="1234567890"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>{initialData ? 'Save Changes' : 'Create Employee'}</Button>
        </div>
      </form>
    </Modal>
  );
};
