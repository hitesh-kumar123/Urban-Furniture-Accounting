import React, { useState, useEffect } from 'react';
import { employeeApi } from '../api/employeeApi';
import { contractApi } from '../api/contractApi';
import { attendanceApi } from '../api/attendanceApi';
import { timeOffApi } from '../api/timeOffApi';
import { payslipApi } from '../api/payslipApi';
import { scheduleApi } from '../api/scheduleApi';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const EmployeesPage = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
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

  // Form
  const [formData, setFormData] = useState({
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: 'Engineering',
    jobPosition: '',
    employeeType: 'Full-Time',
    employeeStatus: 'Active',
    joiningDate: new Date().toISOString().split('T')[0],
    workingSchedule: ''
  });

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
      if (res.success) {
        setSchedules(res.data);
        if (res.data.length > 0 && !formData.workingSchedule) {
          setFormData((prev) => ({ ...prev, workingSchedule: res.data[0]._id }));
        }
      }
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

  const handleOpenCreate = () => {
    setEditingEmployee(null);
    setFormData({
      employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      department: 'Engineering',
      jobPosition: '',
      employeeType: 'Full-Time',
      employeeStatus: 'Active',
      joiningDate: new Date().toISOString().split('T')[0],
      workingSchedule: schedules[0]?._id || ''
    });
    setShowCreateModal(true);
  };

  const handleOpenEdit = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      employeeId: emp.employeeId,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone || '',
      department: emp.department,
      jobPosition: emp.jobPosition,
      employeeType: emp.employeeType || 'Full-Time',
      employeeStatus: emp.employeeStatus || 'Active',
      joiningDate: emp.joiningDate ? emp.joiningDate.split('T')[0] : '',
      workingSchedule: emp.workingSchedule?._id || emp.workingSchedule || ''
    });
    setShowCreateModal(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        const res = await employeeApi.update(editingEmployee._id, formData);
        if (res.success) {
          showToast('Employee updated successfully', 'success');
          setShowCreateModal(false);
          fetchEmployees();
          if (selectedEmployee?._id === editingEmployee._id) {
            setSelectedEmployee(res.data);
          }
        }
      } else {
        const res = await employeeApi.create(formData);
        if (res.success) {
          showToast('Employee created successfully', 'success');
          setShowCreateModal(false);
          fetchEmployees();
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed', 'error');
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
    <div className="p-5 max-w-[1600px] w-full mx-auto flex flex-col gap-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#FF6B3D] font-semibold">
              People Operations
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#F5F2EA] tracking-tight font-display">
            Employee Directory ({employees.length})
          </h1>
          <p className="text-xs text-[#A6A3A0] mt-0.5">
            Talent roster, contract terms, attendance logs, and digital payslip history.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="staffora-input py-1 px-2.5 text-xs w-auto font-mono"
          >
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Product">Product</option>
            <option value="Design">Design</option>
            <option value="Marketing">Marketing</option>
            <option value="Human Resources">Human Resources</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="staffora-input py-1 px-2.5 text-xs w-auto font-mono"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Probation">Probation</option>
            <option value="Suspended">Suspended</option>
            <option value="Terminated">Terminated</option>
          </select>

          {hasRole('Admin', 'HR Manager', 'HR Payroll Manager') && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreate}
              icon="add"
            >
              Add Employee
            </Button>
          )}
        </div>
      </div>

      {/* Main Split Layout: Table (Left 7 Cols) + Command Hub (Right 5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: High-Density Table */}
        <div className={`${selectedEmployee ? 'lg:col-span-7' : 'lg:col-span-12'} flex flex-col gap-3`}>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6F6C69] text-base">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID, job title..."
              className="staffora-input pl-8 font-mono text-xs"
            />
          </div>

          <div className="staffora-table-container">
            {loading ? (
              <LoadingSpinner message="Querying employee records..." />
            ) : employees.length === 0 ? (
              <div className="p-8 text-center text-[#6F6C69] font-mono text-xs">
                No matching employees found.
              </div>
            ) : (
              <table className="staffora-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Position / Dept</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => {
                    const isSelected = selectedEmployee?._id === emp._id;
                    return (
                      <tr
                        key={emp._id}
                        onClick={() => selectEmployee(emp)}
                        className={`cursor-pointer ${
                          isSelected ? 'bg-[#17171B] text-[#F5F2EA]' : ''
                        }`}
                      >
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-[#1E1E24] border border-white/10 text-[#FF8A65] flex items-center justify-center font-bold text-[10px] font-mono shrink-0">
                              {emp.firstName?.[0]}{emp.lastName?.[0]}
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-[#F5F2EA] text-xs block truncate">
                                {emp.firstName} {emp.lastName}
                              </span>
                              <span className="text-[10px] font-mono text-[#6F6C69] block truncate">
                                {emp.employeeId}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="text-xs">
                          <span className="text-[#F5F2EA] block truncate">{emp.jobPosition}</span>
                          <span className="text-[10px] text-[#6F6C69] block font-mono truncate">{emp.department}</span>
                        </td>

                        <td className="font-mono">
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

                        <td className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center gap-1">
                            {hasRole('Admin', 'HR Manager', 'HR Payroll Manager') && (
                              <button
                                onClick={() => handleOpenEdit(emp)}
                                className="p-1 hover:bg-[#1E1E24] rounded text-[#A6A3A0] hover:text-[#F5F2EA]"
                                title="Edit"
                              >
                                <span className="material-symbols-outlined text-[15px]">edit</span>
                              </button>
                            )}
                            {hasRole('Admin', 'HR Manager') && (
                              <button
                                onClick={() => handleDelete(emp._id)}
                                className="p-1 hover:bg-[#FF5C5C]/10 rounded text-[#FF5C5C]"
                                title="Delete"
                              >
                                <span className="material-symbols-outlined text-[15px]">delete</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column: Employee Command Hub */}
        {selectedEmployee && (
          <div className="lg:col-span-5 midnight-card-elevated p-4 flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded bg-[#0B0B0D] border border-white/10 text-[#FF8A65] flex items-center justify-center font-bold text-sm font-mono shrink-0">
                  {selectedEmployee.firstName?.[0]}{selectedEmployee.lastName?.[0]}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#F5F2EA] font-display">
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </h2>
                  <span className="text-[11px] font-mono text-[#FF8A65] block">
                    {selectedEmployee.jobPosition} • {selectedEmployee.employeeId}
                  </span>
                  <span className="text-[10px] font-mono text-[#6F6C69]">
                    {selectedEmployee.department}
                  </span>
                </div>
              </div>

              <Badge variant={selectedEmployee.employeeStatus === 'Active' ? 'success' : 'warning'}>
                {selectedEmployee.employeeStatus}
              </Badge>
            </div>

            {/* Hub Tabs */}
            <div className="flex items-center bg-[#0B0B0D] p-0.5 rounded border border-white/10 font-mono text-[11px]">
              {[
                { id: 'profile', label: 'Profile' },
                { id: 'contracts', label: 'Contract' },
                { id: 'attendance', label: 'Attendance' },
                { id: 'timeOff', label: 'Leaves' },
                { id: 'payslips', label: 'Payslips' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setHubTab(tab.id)}
                  className={`flex-1 py-1 rounded text-center transition-colors ${
                    hubTab === tab.id
                      ? 'bg-[#17171B] text-[#FF8A65] font-semibold'
                      : 'text-[#6F6C69] hover:text-[#A6A3A0]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            {hubLoading ? (
              <LoadingSpinner message="Fetching employee data..." />
            ) : hubTab === 'profile' ? (
              <div className="space-y-2.5 text-xs font-mono">
                <div className="p-3 bg-[#111114] rounded border border-white/5 space-y-1.5">
                  <span className="text-[10px] text-[#6F6C69] uppercase font-bold block">Contact Information</span>
                  <div className="flex justify-between"><span className="text-[#6F6C69]">Email:</span><span className="text-[#F5F2EA]">{selectedEmployee.email}</span></div>
                  <div className="flex justify-between"><span className="text-[#6F6C69]">Phone:</span><span className="text-[#F5F2EA]">{selectedEmployee.phone || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-[#6F6C69]">Type:</span><span className="text-[#F5F2EA]">{selectedEmployee.employeeType}</span></div>
                  <div className="flex justify-between"><span className="text-[#6F6C69]">Joined:</span><span className="text-[#F5F2EA]">{new Date(selectedEmployee.joiningDate).toLocaleDateString()}</span></div>
                </div>
              </div>
            ) : hubTab === 'contracts' ? (
              <div className="space-y-2 font-mono text-xs">
                {hubData.contracts.length === 0 ? (
                  <p className="text-[#6F6C69] p-4 text-center">No contracts linked.</p>
                ) : (
                  hubData.contracts.map((c) => (
                    <div key={c._id} className="p-3 bg-[#111114] rounded border border-white/5 space-y-1">
                      <div className="flex justify-between font-bold text-[#F5F2EA]">
                        <span>{c.name}</span>
                        <span className="text-[#39D98A]">${Number(c.wage || 0).toLocaleString()}/mo</span>
                      </div>
                      <div className="text-[10px] text-[#6F6C69]">
                        Structure: {c.salaryStructure?.name || 'Standard'} • Status: {c.state}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : hubTab === 'attendance' ? (
              <div className="space-y-2 font-mono text-xs">
                {hubData.attendance.length === 0 ? (
                  <p className="text-[#6F6C69] p-4 text-center">No attendance logs.</p>
                ) : (
                  hubData.attendance.slice(0, 5).map((a) => (
                    <div key={a._id} className="p-2.5 bg-[#111114] rounded border border-white/5 flex justify-between items-center">
                      <div>
                        <span className="text-[#F5F2EA] block">{a.date}</span>
                        <span className="text-[10px] text-[#6F6C69]">{a.status}</span>
                      </div>
                      <span className="text-xs font-bold text-[#FF8A65]">{a.workedHours || 8}h</span>
                    </div>
                  ))
                )}
              </div>
            ) : hubTab === 'timeOff' ? (
              <div className="space-y-2 font-mono text-xs">
                {hubData.timeOffRequests.length === 0 ? (
                  <p className="text-[#6F6C69] p-4 text-center">No leave requests.</p>
                ) : (
                  hubData.timeOffRequests.map((r) => (
                    <div key={r._id} className="p-2.5 bg-[#111114] rounded border border-white/5 flex justify-between items-center">
                      <div>
                        <span className="text-[#F5F2EA] block">{r.timeOffType?.name || 'Leave'}</span>
                        <span className="text-[10px] text-[#6F6C69]">{r.startDate?.split('T')[0]} to {r.endDate?.split('T')[0]}</span>
                      </div>
                      <Badge variant={r.status === 'Approved' ? 'success' : r.status === 'Pending' ? 'warning' : 'danger'}>
                        {r.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-2 font-mono text-xs">
                {hubData.payslips.length === 0 ? (
                  <p className="text-[#6F6C69] p-4 text-center">No payslips generated.</p>
                ) : (
                  hubData.payslips.map((ps) => (
                    <div key={ps._id} className="p-2.5 bg-[#111114] rounded border border-white/5 flex justify-between items-center">
                      <div>
                        <span className="text-[#F5F2EA] block">{ps.payrun?.name || 'Payrun'}</span>
                        <span className="text-[10px] text-[#6F6C69]">Gross: ${ps.grossSalary}</span>
                      </div>
                      <span className="text-xs font-bold text-[#39D98A]">${ps.netSalary?.toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Employee Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={editingEmployee ? 'Edit Employee Record' : 'Create New Employee Record'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmitForm} className="space-y-3 font-mono text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="staffora-label">Employee Code *</label>
              <input
                type="text"
                required
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="staffora-input"
              />
            </div>
            <div>
              <label className="staffora-label">Department *</label>
              <select
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="staffora-input"
              >
                <option value="Engineering">Engineering</option>
                <option value="Product">Product</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Human Resources">Human Resources</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="staffora-label">First Name *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="staffora-input"
              />
            </div>
            <div>
              <label className="staffora-label">Last Name *</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="staffora-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="staffora-label">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="staffora-input"
              />
            </div>
            <div>
              <label className="staffora-label">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="staffora-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="staffora-label">Job Position *</label>
              <input
                type="text"
                required
                value={formData.jobPosition}
                onChange={(e) => setFormData({ ...formData, jobPosition: e.target.value })}
                className="staffora-input"
              />
            </div>
            <div>
              <label className="staffora-label">Status *</label>
              <select
                value={formData.employeeStatus}
                onChange={(e) => setFormData({ ...formData, employeeStatus: e.target.value })}
                className="staffora-input"
              >
                <option value="Active">Active</option>
                <option value="Probation">Probation</option>
                <option value="Suspended">Suspended</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <Button variant="secondary" type="button" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingEmployee ? 'Save Changes' : 'Create Record'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
