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
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'kanban'
  
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
    if (selectedEmployee?._id === emp._id) {
      setSelectedEmployee(null);
      return;
    }
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

  const [kanbanGroupBy, setKanbanGroupBy] = useState('department'); // 'department' | 'status'
  const [draggedEmpId, setDraggedEmpId] = useState(null);
  const [dragOverColId, setDragOverColId] = useState(null);

  const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'Marketing', 'Human Resources'];
  const STATUSES = ['Active', 'Probation', 'Suspended', 'Terminated'];

  // Helper to group employees into columns
  const getKanbanColumns = () => {
    if (kanbanGroupBy === 'status') {
      return STATUSES.map((st) => ({
        id: st,
        title: st,
        color: st === 'Active' ? '#0F5C4A' : st === 'Probation' ? '#8A6D3B' : '#B5482E',
        items: employees.filter((e) => (e.employeeStatus || 'Active') === st)
      }));
    }
    // Default group by department
    const groups = DEPARTMENTS.map((dept) => ({
      id: dept,
      title: dept,
      color: dept === 'Engineering' ? '#0F5C4A' : dept === 'Product' ? '#8A6D3B' : dept === 'Design' ? '#6B665C' : '#0F5C4A',
      items: employees.filter((e) => (e.department || 'General') === dept)
    }));

    const otherEmps = employees.filter((e) => !DEPARTMENTS.includes(e.department));
    if (otherEmps.length > 0) {
      groups.push({
        id: 'Other',
        title: 'Other Departments',
        color: '#918C82',
        items: otherEmps
      });
    }
    return groups;
  };

  // Drag and Drop Handlers
  const handleDragStart = (e, empId) => {
    e.dataTransfer.setData('text/plain', empId);
    setDraggedEmpId(empId);
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    if (dragOverColId !== colId) {
      setDragOverColId(colId);
    }
  };

  const handleDragLeave = () => {
    setDragOverColId(null);
  };

  const handleDrop = async (e, targetColId) => {
    e.preventDefault();
    const empId = e.dataTransfer.getData('text/plain') || draggedEmpId;
    setDragOverColId(null);
    setDraggedEmpId(null);

    if (!empId || !targetColId) return;

    const targetEmp = employees.find((emp) => emp._id === empId);
    if (!targetEmp) return;

    if (kanbanGroupBy === 'department' && targetEmp.department === targetColId) return;
    if (kanbanGroupBy === 'status' && targetEmp.employeeStatus === targetColId) return;

    const payload =
      kanbanGroupBy === 'department'
        ? { department: targetColId }
        : { employeeStatus: targetColId };

    // Optimistic UI update
    setEmployees((prev) =>
      prev.map((emp) => (emp._id === empId ? { ...emp, ...payload } : emp))
    );

    try {
      const res = await employeeApi.update(empId, payload);
      if (res.success) {
        showToast(
          `${targetEmp.firstName} ${targetEmp.lastName} moved to ${targetColId}`,
          'success'
        );
        fetchEmployees();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to move employee', 'error');
      fetchEmployees();
    }
  };

  return (
    <div className="p-5 max-w-[1600px] w-full mx-auto flex flex-col gap-5 font-body">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E2D9]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-[#0F5C4A] font-semibold">
              People Operations
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-medium text-[#1C1B19]">
            Employee Directory ({employees.length})
          </h1>
          <p className="text-xs text-[#6B665C] mt-0.5">
            Talent roster, contract terms, attendance logs, and digital payslip history.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Switcher: List vs Kanban */}
          <div className="flex items-center bg-[#FAF9F6] p-0.5 rounded-lg border border-[#E7E2D9]">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white text-[#0F5C4A] shadow-sm' : 'text-[#6B665C] hover:text-[#1C1B19]'
              }`}
              title="List View"
            >
              <span className="material-symbols-outlined text-base">format_list_bulleted</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'kanban' ? 'bg-white text-[#0F5C4A] shadow-sm' : 'text-[#6B665C] hover:text-[#1C1B19]'
              }`}
              title="Kanban Cards View"
            >
              <span className="material-symbols-outlined text-base">grid_view</span>
            </button>
          </div>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="staffora-input py-1.5 px-3 text-xs w-auto font-medium"
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
            className="staffora-input py-1.5 px-3 text-xs w-auto font-medium"
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
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#6B665C] text-base">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID, job title..."
              className="staffora-input pl-9 text-xs"
            />
          </div>

          {viewMode === 'kanban' ? (
            loading ? (
              <LoadingSpinner message="Querying employee records..." />
            ) : employees.length === 0 ? (
              <div className="p-8 text-center text-[#6B665C] text-xs bg-white rounded-xl border border-[#E7E2D9]">
                No matching employees found.
              </div>
            ) : (
              <div className="space-y-3">
                {/* Kanban Group By Controls */}
                <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-[#E7E2D9] text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[#6B665C]">Group by:</span>
                    <button
                      onClick={() => setKanbanGroupBy('department')}
                      className={`px-3 py-1 rounded-md transition-colors ${
                        kanbanGroupBy === 'department'
                          ? 'bg-[#E8F4F1] text-[#0F5C4A] font-semibold border border-[#0F5C4A]/20'
                          : 'text-[#6B665C] hover:text-[#1C1B19]'
                      }`}
                    >
                      Department
                    </button>
                    <button
                      onClick={() => setKanbanGroupBy('status')}
                      className={`px-3 py-1 rounded-md transition-colors ${
                        kanbanGroupBy === 'status'
                          ? 'bg-[#E8F4F1] text-[#0F5C4A] font-semibold border border-[#0F5C4A]/20'
                          : 'text-[#6B665C] hover:text-[#1C1B19]'
                      }`}
                    >
                      Status
                    </button>
                  </div>

                  <span className="text-[#918C82] text-xs">
                    {employees.length} cards across {getKanbanColumns().length} lanes
                  </span>
                </div>

                {/* Kanban Column Lanes */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 items-start">
                  {getKanbanColumns().map((col) => {
                    const isDragOver = dragOverColId === col.id;
                    return (
                      <div
                        key={col.id}
                        onDragOver={(e) => handleDragOver(e, col.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, col.id)}
                        className={`rounded-xl p-3 flex flex-col gap-2.5 shadow-sm transition-all ${
                          isDragOver
                            ? 'bg-[#E8F4F1] border-2 border-dashed border-[#0F5C4A]'
                            : 'bg-[#FAF9F6] border border-[#E7E2D9]'
                        }`}
                      >
                        {/* Column Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-[#E7E2D9]">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: col.color }}
                            ></span>
                            <span className="text-xs font-semibold text-[#1C1B19]">
                              {col.title}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-white text-[#6B665C] border border-[#E7E2D9]">
                            {col.items.length}
                          </span>
                        </div>

                        {/* Column Items */}
                        <div className="flex flex-col gap-2 min-h-[120px]">
                          {col.items.length === 0 ? (
                            <div className="h-24 flex items-center justify-center border-2 border-dashed border-[#E7E2D9] rounded-lg text-[11px] text-[#918C82]">
                              Drop employees here
                            </div>
                          ) : (
                            col.items.map((emp) => {
                              const isSelected = selectedEmployee?._id === emp._id;
                              return (
                                <div
                                  key={emp._id}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, emp._id)}
                                  onClick={() => selectEmployee(emp)}
                                  className={`p-3 rounded-lg border bg-white cursor-pointer transition-all shadow-sm ${
                                    isSelected
                                      ? 'border-[#0F5C4A] ring-1 ring-[#0F5C4A]'
                                      : 'border-[#E7E2D9] hover:border-[#0F5C4A]/40'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="w-7 h-7 rounded-full bg-[#E8F4F1] text-[#0F5C4A] flex items-center justify-center font-bold text-xs shrink-0">
                                        {emp.firstName?.[0]}{emp.lastName?.[0]}
                                      </div>
                                      <div className="min-w-0">
                                        <span className="font-semibold text-xs text-[#1C1B19] block truncate">
                                          {emp.firstName} {emp.lastName}
                                        </span>
                                        <span className="text-[10px] font-mono text-[#6B665C] block truncate">
                                          {emp.employeeId}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5">
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
                                    </div>
                                  </div>

                                  <div className="text-xs text-[#6B665C] space-y-0.5 pt-1.5 border-t border-[#E7E2D9]">
                                    <div className="text-[#1C1B19] font-medium truncate">{emp.jobPosition}</div>
                                    <div className="text-[11px] text-[#6B665C]">{emp.department} • {emp.employeeType}</div>
                                  </div>

                                  <div className="flex items-center justify-between pt-1.5 border-t border-[#E7E2D9] text-xs">
                                    <span className="text-[#0F5C4A] font-medium flex items-center gap-1">
                                      <span className="material-symbols-outlined text-sm">badge</span>
                                      Hub 360°
                                    </span>

                                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                      {hasRole('Admin', 'HR Manager', 'HR Payroll Manager') && (
                                        <button
                                          onClick={() => handleOpenEdit(emp)}
                                          className="p-1 hover:bg-[#FAF9F6] rounded text-[#6B665C] hover:text-[#1C1B19]"
                                          title="Edit"
                                        >
                                          <span className="material-symbols-outlined text-sm">edit</span>
                                        </button>
                                      )}
                                      {hasRole('Admin', 'HR Manager') && (
                                        <button
                                          onClick={() => handleDelete(emp._id)}
                                          className="p-1 hover:bg-[#FDF1EE] rounded text-[#B5482E]"
                                          title="Delete"
                                        >
                                          <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          ) : (
            <div className="staffora-table-container">
              {loading ? (
                <LoadingSpinner message="Querying employee records..." />
              ) : employees.length === 0 ? (
                <div className="p-8 text-center text-[#6B665C] text-xs">
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
                            isSelected ? 'bg-[#E8F4F1]/40' : ''
                          }`}
                        >
                          <td>
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-[#E8F4F1] text-[#0F5C4A] flex items-center justify-center font-bold text-xs font-mono shrink-0">
                                {emp.firstName?.[0]}{emp.lastName?.[0]}
                              </div>
                              <div className="min-w-0">
                                <span className="font-medium text-[#1C1B19] text-xs block truncate">
                                  {emp.firstName} {emp.lastName}
                                </span>
                                <span className="text-[11px] font-mono text-[#6B665C] block truncate">
                                  {emp.employeeId}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="text-xs">
                            <span className="text-[#1C1B19] block truncate font-medium">{emp.jobPosition}</span>
                            <span className="text-[11px] text-[#6B665C] block truncate">{emp.department}</span>
                          </td>

                          <td>
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
                                  className="p-1 hover:bg-[#FAF9F6] rounded text-[#6B665C] hover:text-[#1C1B19]"
                                  title="Edit"
                                >
                                  <span className="material-symbols-outlined text-[16px]">edit</span>
                                </button>
                              )}
                              {hasRole('Admin', 'HR Manager') && (
                                <button
                                  onClick={() => handleDelete(emp._id)}
                                  className="p-1 hover:bg-[#FDF1EE] rounded text-[#B5482E]"
                                  title="Delete"
                                >
                                  <span className="material-symbols-outlined text-[16px]">delete</span>
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
          )}
        </div>

        {/* Right Column: Employee Command Hub */}
        {selectedEmployee && (
          <div className="lg:col-span-5 bg-white rounded-xl border border-[#E7E2D9] p-5 flex flex-col gap-4 shadow-sm">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#E7E2D9]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-[#E8F4F1] text-[#0F5C4A] flex items-center justify-center font-bold text-sm font-mono shrink-0">
                  {selectedEmployee.firstName?.[0]}{selectedEmployee.lastName?.[0]}
                </div>
                <div>
                  <h2 className="text-base font-heading font-medium text-[#1C1B19]">
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </h2>
                  <span className="text-xs font-mono text-[#0F5C4A] block">
                    {selectedEmployee.jobPosition} • {selectedEmployee.employeeId}
                  </span>
                  <span className="text-xs text-[#6B665C]">
                    {selectedEmployee.department}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={selectedEmployee.employeeStatus === 'Active' ? 'success' : 'warning'}>
                  {selectedEmployee.employeeStatus}
                </Badge>
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="w-7 h-7 rounded-lg bg-[#FAF9F6] hover:bg-[#FDF1EE] text-[#6B665C] hover:text-[#B5482E] border border-[#E7E2D9] flex items-center justify-center transition-colors cursor-pointer"
                  title="Close 360° Hub"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            </div>

            {/* Hub Tabs */}
            <div className="flex items-center bg-[#FAF9F6] p-1 rounded-lg border border-[#E7E2D9] text-xs">
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
                  className={`flex-1 py-1 rounded-md text-center transition-colors ${
                    hubTab === tab.id
                      ? 'bg-white text-[#0F5C4A] font-semibold shadow-sm'
                      : 'text-[#6B665C] hover:text-[#1C1B19]'
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
              <div className="space-y-2.5 text-xs">
                <div className="p-3.5 bg-[#FAF9F6] rounded-lg border border-[#E7E2D9] space-y-2">
                  <span className="text-xs text-[#6B665C] font-semibold block">Contact Information</span>
                  <div className="flex justify-between"><span className="text-[#6B665C]">Email:</span><span className="text-[#1C1B19] font-medium">{selectedEmployee.email}</span></div>
                  <div className="flex justify-between"><span className="text-[#6B665C]">Phone:</span><span className="text-[#1C1B19]">{selectedEmployee.phone || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-[#6B665C]">Type:</span><span className="text-[#1C1B19]">{selectedEmployee.employeeType}</span></div>
                  <div className="flex justify-between"><span className="text-[#6B665C]">Joined:</span><span className="text-[#1C1B19]">{new Date(selectedEmployee.joiningDate).toLocaleDateString()}</span></div>
                </div>
              </div>
            ) : hubTab === 'contracts' ? (
              <div className="space-y-2 text-xs">
                {hubData.contracts.length === 0 ? (
                  <p className="text-[#6B665C] p-4 text-center">No contracts linked.</p>
                ) : (
                  hubData.contracts.map((c) => (
                    <div key={c._id} className="p-3 bg-[#FAF9F6] rounded-lg border border-[#E7E2D9] space-y-1">
                      <div className="flex justify-between font-medium text-[#1C1B19]">
                        <span>{c.name}</span>
                        <span className="text-[#8A6D3B] font-mono font-semibold">₹{Number(c.wage || 0).toLocaleString('en-IN')}/mo</span>
                      </div>
                      <div className="text-[11px] text-[#6B665C]">
                        Structure: {c.salaryStructure?.name || 'Standard'} • Status: {c.state}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : hubTab === 'attendance' ? (
              <div className="space-y-2 text-xs">
                {hubData.attendance.length === 0 ? (
                  <p className="text-[#6B665C] p-4 text-center">No attendance logs.</p>
                ) : (
                  hubData.attendance.slice(0, 5).map((a) => (
                    <div key={a._id} className="p-2.5 bg-[#FAF9F6] rounded-lg border border-[#E7E2D9] flex justify-between items-center">
                      <div>
                        <span className="text-[#1C1B19] font-medium block">{a.date}</span>
                        <span className="text-[11px] text-[#6B665C]">{a.status}</span>
                      </div>
                      <span className="text-xs font-bold text-[#0F5C4A] font-mono">{a.workedHours || 8}h</span>
                    </div>
                  ))
                )}
              </div>
            ) : hubTab === 'timeOff' ? (
              <div className="space-y-2 text-xs">
                {hubData.timeOffRequests.length === 0 ? (
                  <p className="text-[#6B665C] p-4 text-center">No leave requests.</p>
                ) : (
                  hubData.timeOffRequests.map((r) => (
                    <div key={r._id} className="p-2.5 bg-[#FAF9F6] rounded-lg border border-[#E7E2D9] flex justify-between items-center">
                      <div>
                        <span className="text-[#1C1B19] font-medium block">{r.timeOffType?.name || 'Leave'}</span>
                        <span className="text-[11px] text-[#6B665C]">{r.startDate?.split('T')[0]} to {r.endDate?.split('T')[0]}</span>
                      </div>
                      <Badge variant={r.status === 'Approved' ? 'success' : r.status === 'Pending' ? 'warning' : 'danger'}>
                        {r.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                {hubData.payslips.length === 0 ? (
                  <p className="text-[#6B665C] p-4 text-center">No payslips generated.</p>
                ) : (
                  hubData.payslips.map((ps) => (
                    <div key={ps._id} className="p-2.5 bg-[#FAF9F6] rounded-lg border border-[#E7E2D9] flex justify-between items-center">
                      <div>
                        <span className="text-[#1C1B19] font-medium block">{ps.payrun?.name || 'Payrun'}</span>
                        <span className="text-[11px] text-[#6B665C]">Gross: ₹{Number(ps.grossSalary || ps.gross || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <span className="text-xs font-bold text-[#8A6D3B] font-mono">₹{Number(ps.netSalary || ps.net || 0).toLocaleString('en-IN')}</span>
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
        <form onSubmit={handleSubmitForm} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="staffora-label">Employee Code *</label>
              <input
                type="text"
                required
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="staffora-input font-mono"
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
                className="staffora-input font-mono"
              />
            </div>
            <div>
              <label className="staffora-label">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="staffora-input font-mono"
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

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E7E2D9]">
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
