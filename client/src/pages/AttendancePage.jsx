import React, { useState, useEffect } from 'react';
import { attendanceApi } from '../api/attendanceApi';
import { employeeApi } from '../api/employeeApi';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const AttendancePage = () => {
  const [attendances, setAttendances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');

  // Clock In/Out state for logged in user
  const [todayRecord, setTodayRecord] = useState(null);
  const [clockActionLoading, setClockActionLoading] = useState(false);

  // Manual Correction Modal
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [correctionForm, setCorrectionForm] = useState({
    employeeId: '',
    date: '',
    checkIn: '',
    checkOut: '',
    status: 'Present',
    workedHours: 8,
    isManualCorrection: true,
    remarks: ''
  });

  const { user, hasRole } = useAuth();
  const { showToast } = useToast();

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedDate) params.date = selectedDate;
      if (statusFilter) params.status = statusFilter;
      if (employeeFilter) params.employee = employeeFilter;

      const [attRes, empRes] = await Promise.all([
        attendanceApi.getAll(params),
        employeeApi.getAll()
      ]);

      if (attRes.success) {
        setAttendances(attRes.data);

        // Check if current user has record for selected date / today
        if (user?.employee) {
          const userRec = attRes.data.find(
            (a) => (a.employee?._id || a.employee) === user.employee
          );
          setTodayRecord(userRec || null);
        }
      }
      if (empRes.success) {
        setEmployees(empRes.data);
      }
    } catch (err) {
      showToast('Failed to load attendance records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate, statusFilter, employeeFilter]);

  // Handle Quick Clock In
  const handleClockIn = async () => {
    if (!user?.employee) {
      showToast('No employee profile linked to current user account', 'warning');
      return;
    }
    setClockActionLoading(true);
    try {
      const now = new Date();
      const res = await attendanceApi.create({
        employee: user.employee,
        date: selectedDate || now.toISOString().split('T')[0],
        checkIn: now.toISOString(),
        status: 'Present'
      });
      if (res.success) {
        showToast('Successfully clocked in at ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 'success');
        fetchAttendance();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Clock in failed', 'error');
    } finally {
      setClockActionLoading(false);
    }
  };

  // Handle Quick Clock Out
  const handleClockOut = async () => {
    if (!todayRecord) return;
    setClockActionLoading(true);
    try {
      const now = new Date();
      const res = await attendanceApi.update(todayRecord._id, {
        checkOut: now.toISOString(),
        status: 'Present'
      });
      if (res.success) {
        showToast('Successfully clocked out at ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 'success');
        fetchAttendance();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Clock out failed', 'error');
    } finally {
      setClockActionLoading(false);
    }
  };

  const handleOpenCorrection = (record = null) => {
    if (record) {
      setEditingRecord(record);
      const toTimeInput = (dt) => (dt ? new Date(dt).toISOString().slice(11, 16) : '');
      const toDateInput = (dt) => (dt ? new Date(dt).toISOString().split('T')[0] : '');

      setCorrectionForm({
        employeeId: record.employee?._id || record.employee || '',
        date: toDateInput(record.date),
        checkIn: toTimeInput(record.checkIn),
        checkOut: toTimeInput(record.checkOut),
        status: record.status || 'Present',
        workedHours: record.workedHours || 8,
        isManualCorrection: true,
        remarks: record.remarks || ''
      });
    } else {
      setEditingRecord(null);
      setCorrectionForm({
        employeeId: employees[0]?._id || '',
        date: selectedDate || new Date().toISOString().split('T')[0],
        checkIn: '09:00',
        checkOut: '17:00',
        status: 'Present',
        workedHours: 8,
        isManualCorrection: true,
        remarks: 'HR manual log entry'
      });
    }
    setShowCorrectionModal(true);
  };

  const handleSaveCorrection = async (e) => {
    e.preventDefault();
    try {
      // Build ISO checkIn & checkOut from date and time
      let checkInIso = null;
      let checkOutIso = null;

      if (correctionForm.checkIn) {
        checkInIso = new Date(`${correctionForm.date}T${correctionForm.checkIn}:00Z`).toISOString();
      }
      if (correctionForm.checkOut) {
        checkOutIso = new Date(`${correctionForm.date}T${correctionForm.checkOut}:00Z`).toISOString();
      }

      const payload = {
        employee: correctionForm.employeeId,
        date: correctionForm.date,
        checkIn: checkInIso,
        checkOut: checkOutIso,
        status: correctionForm.status,
        workedHours: Number(correctionForm.workedHours),
        isManualCorrection: true,
        remarks: correctionForm.remarks
      };

      if (editingRecord) {
        const res = await attendanceApi.update(editingRecord._id, payload);
        if (res.success) {
          showToast('Attendance record corrected successfully', 'success');
          setShowCorrectionModal(false);
          fetchAttendance();
        }
      } else {
        const res = await attendanceApi.create(payload);
        if (res.success) {
          showToast('Manual attendance entry created', 'success');
          setShowCorrectionModal(false);
          fetchAttendance();
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update attendance', 'error');
    }
  };

  const getStatusBadgeVariant = (st) => {
    switch (st) {
      case 'Present':
        return 'success';
      case 'Late':
        return 'warning';
      case 'Absent':
        return 'danger';
      case 'Overtime':
        return 'purple';
      case 'Missing Check-out':
        return 'danger';
      case 'Half Day':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  const canManage = hasRole('Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User');

  // Compute metric stats
  const presentCount = attendances.filter((a) => a.status === 'Present' || a.status === 'Overtime').length;
  const lateCount = attendances.filter((a) => a.status === 'Late').length;
  const missingCount = attendances.filter((a) => a.status === 'Missing Check-out' || (a.checkIn && !a.checkOut)).length;
  const totalWorked = attendances.reduce((acc, a) => acc + (a.workedHours || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Time & Attendance Hub</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time punch logs, working hours calculation, exception tracking, and manual HR corrections.
          </p>
        </div>
        {canManage && (
          <Button
            variant="primary"
            onClick={() => handleOpenCorrection()}
            className="flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Manual Log Entry
          </Button>
        )}
      </div>

      {/* Quick Punch Action Banner for Active User */}
      <div className="bg-gradient-to-r from-primary to-secondary p-6 rounded-2xl text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
            <span className="material-symbols-outlined text-3xl">fingerprint</span>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-indigo-200">
              Employee Punch Desk
            </span>
            <h2 className="text-xl font-bold text-white mt-0.5">
              {todayRecord?.checkIn && !todayRecord?.checkOut
                ? 'You are currently Clocked In'
                : todayRecord?.checkOut
                ? 'Shift Completed for Today'
                : 'Ready to start your work shift'}
            </h2>
            <p className="text-xs text-indigo-100 mt-1">
              {todayRecord?.checkIn
                ? `Punch In recorded at: ${new Date(todayRecord.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Punches feed directly into payroll overtime & leave deduction calculation.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {!todayRecord ? (
            <button
              onClick={handleClockIn}
              disabled={clockActionLoading}
              className="w-full md:w-auto px-6 py-3 bg-white text-primary font-bold text-sm rounded-xl hover:bg-slate-100 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-xl">login</span>
              Clock In Now
            </button>
          ) : !todayRecord.checkOut ? (
            <button
              onClick={handleClockOut}
              disabled={clockActionLoading}
              className="w-full md:w-auto px-6 py-3 bg-amber-400 text-amber-950 font-bold text-sm rounded-xl hover:bg-amber-300 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
              Clock Out
            </button>
          ) : (
            <div className="px-4 py-2 bg-white/20 rounded-xl text-xs font-semibold text-white flex items-center gap-2 border border-white/20">
              <span className="material-symbols-outlined text-[16px] text-emerald-300">check_circle</span>
              {todayRecord.workedHours}h Worked Logged
            </div>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Present Today</span>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{presentCount}</div>
          <span className="text-[11px] text-slate-400">On-time or overtime</span>
        </div>

        <div className="bg-surface-container-lowest border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Late Arrivals</span>
          <div className="text-2xl font-bold text-amber-600 mt-2">{lateCount}</div>
          <span className="text-[11px] text-slate-400">Past grace period</span>
        </div>

        <div className="bg-surface-container-lowest border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Missing Out-Punch</span>
          <div className="text-2xl font-bold text-red-600 mt-2">{missingCount}</div>
          <span className="text-[11px] text-slate-400">Requires correction</span>
        </div>

        <div className="bg-surface-container-lowest border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Hours Logged</span>
          <div className="text-2xl font-bold text-primary mt-2">{totalWorked.toFixed(1)}h</div>
          <span className="text-[11px] text-slate-400">Accumulated daily hours</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-surface-container-lowest border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Filter Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-500 uppercase">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Late">Late</option>
            <option value="Absent">Absent</option>
            <option value="Overtime">Overtime</option>
            <option value="Missing Check-out">Missing Check-out</option>
            <option value="Half Day">Half Day</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto md:ml-auto">
          <span className="text-xs font-bold text-slate-500 uppercase">Employee:</span>
          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 max-w-[200px]"
          >
            <option value="">All Employees</option>
            {employees.map((e) => (
              <option key={e._id} value={e._id}>
                {e.firstName} {e.lastName} ({e.employeeCode})
              </option>
            ))}
          </select>
          {(statusFilter || employeeFilter) && (
            <button
              onClick={() => {
                setStatusFilter('');
                setEmployeeFilter('');
              }}
              className="text-xs text-primary hover:underline font-semibold"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Attendance Ledger Table */}
      <div className="bg-surface-container-lowest border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : attendances.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <span className="material-symbols-outlined text-4xl mb-2">event_busy</span>
            <p className="text-sm font-semibold text-slate-600">No attendance records found for this criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200/80 text-left text-sm">
              <thead className="bg-slate-50/70 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Check In</th>
                  <th className="px-5 py-3.5">Check Out</th>
                  <th className="px-5 py-3.5 text-center">Worked Hours</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Audit / Correction</th>
                  {canManage && <th className="px-5 py-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {attendances.map((att) => {
                  const emp = att.employee;
                  const formatTime = (t) =>
                    t
                      ? new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '—';
                  const formatDate = (d) =>
                    d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

                  return (
                    <tr key={att._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary/10 to-indigo-100 flex items-center justify-center font-bold text-primary text-xs">
                            {emp?.firstName?.[0] || 'E'}
                            {emp?.lastName?.[0] || ''}
                          </div>
                          <div>
                            <span className="font-semibold text-on-surface block text-xs">
                              {emp ? `${emp.firstName} ${emp.lastName}` : 'Unassigned Employee'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {emp?.employeeCode || '—'} • {emp?.department || 'General'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-xs font-medium text-slate-700">
                        {formatDate(att.date)}
                      </td>

                      <td className="px-5 py-4 text-xs font-medium text-slate-600">
                        {formatTime(att.checkIn)}
                      </td>

                      <td className="px-5 py-4 text-xs font-medium text-slate-600">
                        {formatTime(att.checkOut)}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span className="inline-block px-2.5 py-1 bg-indigo-50 border border-indigo-100/80 rounded-lg text-xs font-bold text-primary">
                          {att.workedHours || 0} hrs
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <Badge variant={getStatusBadgeVariant(att.status)}>
                          {att.status}
                        </Badge>
                      </td>

                      <td className="px-5 py-4">
                        {att.isManualCorrection ? (
                          <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-200/60 max-w-fit">
                            <span className="material-symbols-outlined text-[14px]">edit_note</span>
                            <span>Manual Entry: {att.remarks || 'HR override'}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Automated Punch</span>
                        )}
                      </td>

                      {canManage && (
                        <td className="px-5 py-4 text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenCorrection(att)}
                            className="flex items-center gap-1 text-xs"
                          >
                            <span className="material-symbols-outlined text-[14px]">edit</span>
                            Correct
                          </Button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Correction / Log Modal */}
      <Modal
        isOpen={showCorrectionModal}
        onClose={() => setShowCorrectionModal(false)}
        title={editingRecord ? 'Correct Attendance Record' : 'Create Manual Attendance Log'}
        size="lg"
      >
        <form onSubmit={handleSaveCorrection} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Employee *
            </label>
            <select
              required
              disabled={!!editingRecord}
              value={correctionForm.employeeId}
              onChange={(e) => setCorrectionForm({ ...correctionForm, employeeId: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-slate-100"
            >
              <option value="">Select Employee</option>
              {employees.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.firstName} {e.lastName} ({e.employeeCode}) — {e.department}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={correctionForm.date}
                onChange={(e) => setCorrectionForm({ ...correctionForm, date: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Check In Time
              </label>
              <input
                type="time"
                value={correctionForm.checkIn}
                onChange={(e) => setCorrectionForm({ ...correctionForm, checkIn: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Check Out Time
              </label>
              <input
                type="time"
                value={correctionForm.checkOut}
                onChange={(e) => setCorrectionForm({ ...correctionForm, checkOut: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Attendance Status *
              </label>
              <select
                value={correctionForm.status}
                onChange={(e) => setCorrectionForm({ ...correctionForm, status: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Absent">Absent</option>
                <option value="Overtime">Overtime</option>
                <option value="Missing Check-out">Missing Check-out</option>
                <option value="Half Day">Half Day</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Worked Hours Override
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={correctionForm.workedHours}
                onChange={(e) => setCorrectionForm({ ...correctionForm, workedHours: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              HR Reason & Remarks
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Employee forgot card swipe / approved client on-site visit"
              value={correctionForm.remarks}
              onChange={(e) => setCorrectionForm({ ...correctionForm, remarks: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" type="button" onClick={() => setShowCorrectionModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Attendance Record
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
