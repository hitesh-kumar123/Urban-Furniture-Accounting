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

  const handleOpenCorrection = (rec) => {
    setEditingRecord(rec);
    setCorrectionForm({
      employeeId: rec?.employee?._id || rec?.employee || (employees[0]?._id || ''),
      date: rec?.date || selectedDate,
      checkIn: rec?.checkIn ? new Date(rec.checkIn).toISOString().slice(11, 16) : '09:00',
      checkOut: rec?.checkOut ? new Date(rec.checkOut).toISOString().slice(11, 16) : '18:00',
      status: rec?.status || 'Present',
      workedHours: rec?.workedHours || 8,
      isManualCorrection: true,
      remarks: rec?.remarks || ''
    });
    setShowCorrectionModal(true);
  };

  const handleSaveCorrection = async (e) => {
    e.preventDefault();
    try {
      if (editingRecord) {
        const res = await attendanceApi.update(editingRecord._id, {
          ...correctionForm,
          checkIn: `${correctionForm.date}T${correctionForm.checkIn}:00.000Z`,
          checkOut: `${correctionForm.date}T${correctionForm.checkOut}:00.000Z`
        });
        if (res.success) {
          showToast('Attendance correction saved', 'success');
          setShowCorrectionModal(false);
          fetchAttendance();
        }
      } else {
        const res = await attendanceApi.create({
          employee: correctionForm.employeeId,
          date: correctionForm.date,
          checkIn: `${correctionForm.date}T${correctionForm.checkIn}:00.000Z`,
          checkOut: `${correctionForm.date}T${correctionForm.checkOut}:00.000Z`,
          status: correctionForm.status,
          isManualCorrection: true,
          remarks: correctionForm.remarks
        });
        if (res.success) {
          showToast('Attendance logged manually', 'success');
          setShowCorrectionModal(false);
          fetchAttendance();
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save record', 'error');
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'Present':
        return <Badge variant="success">Present</Badge>;
      case 'Late':
        return <Badge variant="warning">Late</Badge>;
      case 'Absent':
        return <Badge variant="danger">Absent</Badge>;
      case 'HalfDay':
        return <Badge variant="info">Half Day</Badge>;
      default:
        return <Badge variant="default">{st}</Badge>;
    }
  };

  const canCorrect = hasRole('Admin', 'HR Manager', 'HR Payroll Manager');

  return (
    <div className="p-5 max-w-[1600px] w-full mx-auto flex flex-col gap-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#FF6B3D] font-semibold">
              Time &amp; Attendance
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#F5F2EA] tracking-tight font-display">
            Attendance &amp; Shift Logs
          </h1>
          <p className="text-xs text-[#A6A3A0] mt-0.5">
            Biometric punch desk, shift adherence records, overtime hours, and manual HR corrections.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="staffora-input py-1 px-2.5 text-xs w-auto font-mono"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="staffora-input py-1 px-2.5 text-xs w-auto font-mono"
          >
            <option value="">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Late">Late</option>
            <option value="Absent">Absent</option>
            <option value="HalfDay">Half Day</option>
          </select>

          {canCorrect && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleOpenCorrection(null)}
              icon="tune"
            >
              Manual Log
            </Button>
          )}
        </div>
      </div>

      {/* Clock In / Out Live Desk (For logged-in employee) */}
      {user?.employee && (
        <div className="midnight-card-elevated p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-[#0B0B0D] border border-white/10 text-[#FF6B3D] flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">schedule</span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-[#6F6C69] block">Punch Desk</span>
              <span className="text-sm font-bold text-[#F5F2EA] font-sans">
                {todayRecord?.checkIn
                  ? `Clocked In at ${new Date(todayRecord.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Ready to Clock In for Current Shift'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!todayRecord?.checkIn ? (
              <Button
                variant="primary"
                size="sm"
                onClick={handleClockIn}
                loading={clockActionLoading}
                icon="login"
              >
                Clock In
              </Button>
            ) : !todayRecord?.checkOut ? (
              <Button
                variant="danger"
                size="sm"
                onClick={handleClockOut}
                loading={clockActionLoading}
                icon="logout"
              >
                Clock Out
              </Button>
            ) : (
              <span className="font-mono text-xs text-[#39D98A] font-semibold">
                ✓ Shift Completed ({todayRecord.workedHours || 8}h logged)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Attendance Table */}
      <div className="staffora-table-container">
        {loading ? (
          <LoadingSpinner message="Scanning attendance punches..." />
        ) : attendances.length === 0 ? (
          <div className="p-10 text-center text-[#6F6C69] font-mono text-xs">
            No attendance records found for this date.
          </div>
        ) : (
          <table className="staffora-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th className="text-center">Hours</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {attendances.map((att) => {
                const empName = att.employee
                  ? typeof att.employee === 'object'
                    ? `${att.employee.firstName || ''} ${att.employee.lastName || ''}`.trim()
                    : 'Employee'
                  : 'Employee';
                const checkInTime = att.checkIn
                  ? new Date(att.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '—';
                const checkOutTime = att.checkOut
                  ? new Date(att.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '—';

                return (
                  <tr key={att._id}>
                    <td>
                      <div className="font-semibold text-[#F5F2EA]">{empName}</div>
                      <div className="text-[10px] font-mono text-[#6F6C69]">
                        {att.employee?.employeeId || att.employee?.jobPosition || 'Staff'}
                      </div>
                    </td>

                    <td className="font-mono text-xs text-[#A6A3A0]">{att.date}</td>
                    <td className="font-mono text-xs text-[#F5F2EA]">{checkInTime}</td>
                    <td className="font-mono text-xs text-[#F5F2EA]">{checkOutTime}</td>

                    <td className="text-center font-mono font-bold text-xs text-[#FF8A65]">
                      {att.workedHours ? `${att.workedHours}h` : '—'}
                    </td>

                    <td className="font-mono">{getStatusBadge(att.status)}</td>

                    <td className="text-right">
                      {canCorrect && (
                        <button
                          onClick={() => handleOpenCorrection(att)}
                          className="px-2 py-1 bg-[#17171B] hover:bg-[#1E1E24] text-[#A6A3A0] hover:text-[#F5F2EA] border border-white/10 rounded text-[11px] font-mono"
                        >
                          Adjust
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Manual Correction Modal */}
      <Modal
        isOpen={showCorrectionModal}
        onClose={() => setShowCorrectionModal(false)}
        title={editingRecord ? 'Adjust Attendance Record' : 'Manual Shift Log'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveCorrection} className="space-y-3 font-mono text-xs">
          {!editingRecord && (
            <div>
              <label className="staffora-label">Employee</label>
              <select
                value={correctionForm.employeeId}
                onChange={(e) => setCorrectionForm({ ...correctionForm, employeeId: e.target.value })}
                className="staffora-input"
                required
              >
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeId || emp.jobPosition || 'Staff'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="staffora-label">Date</label>
            <input
              type="date"
              required
              value={correctionForm.date}
              onChange={(e) => setCorrectionForm({ ...correctionForm, date: e.target.value })}
              className="staffora-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="staffora-label">Check In</label>
              <input
                type="time"
                value={correctionForm.checkIn}
                onChange={(e) => setCorrectionForm({ ...correctionForm, checkIn: e.target.value })}
                className="staffora-input"
              />
            </div>
            <div>
              <label className="staffora-label">Check Out</label>
              <input
                type="time"
                value={correctionForm.checkOut}
                onChange={(e) => setCorrectionForm({ ...correctionForm, checkOut: e.target.value })}
                className="staffora-input"
              />
            </div>
          </div>

          <div>
            <label className="staffora-label">Status</label>
            <select
              value={correctionForm.status}
              onChange={(e) => setCorrectionForm({ ...correctionForm, status: e.target.value })}
              className="staffora-input"
            >
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Absent">Absent</option>
              <option value="HalfDay">Half Day</option>
            </select>
          </div>

          <div>
            <label className="staffora-label">Remarks</label>
            <input
              type="text"
              placeholder="Reason for adjustment"
              value={correctionForm.remarks}
              onChange={(e) => setCorrectionForm({ ...correctionForm, remarks: e.target.value })}
              className="staffora-input"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <Button variant="secondary" type="button" onClick={() => setShowCorrectionModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Adjustment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
