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
    <div className="p-5 max-w-[1600px] w-full mx-auto flex flex-col gap-5 font-body">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E2D9]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-[#0F5C4A] font-semibold">
              Time &amp; Attendance
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-medium text-[#1C1B19]">
            Attendance &amp; Shift Logs
          </h1>
          <p className="text-xs text-[#6B665C] mt-0.5">
            Biometric punch desk, shift adherence records, overtime hours, and manual HR corrections.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="staffora-input py-1.5 px-3 text-xs w-auto font-mono"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="staffora-input py-1.5 px-3 text-xs w-auto font-medium"
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
        <div className="bg-white rounded-xl border border-[#E7E2D9] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#E8F4F1] text-[#0F5C4A] flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">schedule</span>
            </div>
            <div>
              <span className="text-xs font-mono uppercase text-[#6B665C] block font-medium">Punch Desk</span>
              <span className="text-sm font-semibold text-[#1C1B19]">
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
              <span className="font-mono text-xs text-[#0F5C4A] font-semibold bg-[#E8F4F1] px-3 py-1.5 rounded-md border border-[#0F5C4A]/20">
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
          <div className="p-10 text-center text-[#6B665C] text-xs">
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
                      <div className="font-medium text-[#1C1B19]">{empName}</div>
                      <div className="text-[11px] font-mono text-[#6B665C]">
                        {att.employee?.employeeId || att.employee?.jobPosition || 'Staff'}
                      </div>
                    </td>

                    <td className="font-mono text-xs text-[#6B665C]">{att.date}</td>
                    <td className="font-mono text-xs text-[#1C1B19]">{checkInTime}</td>
                    <td className="font-mono text-xs text-[#1C1B19]">{checkOutTime}</td>

                    <td className="text-center font-mono font-bold text-xs text-[#0F5C4A]">
                      {att.workedHours ? `${att.workedHours}h` : '—'}
                    </td>

                    <td>{getStatusBadge(att.status)}</td>

                    <td className="text-right">
                      {canCorrect && (
                        <button
                          onClick={() => handleOpenCorrection(att)}
                          className="px-2.5 py-1 bg-white hover:bg-[#FAF9F6] text-[#0F5C4A] border border-[#E7E2D9] rounded-md text-xs font-medium transition-colors"
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
        <form onSubmit={handleSaveCorrection} className="space-y-3 text-xs">
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
              className="staffora-input font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="staffora-label">Check In</label>
              <input
                type="time"
                value={correctionForm.checkIn}
                onChange={(e) => setCorrectionForm({ ...correctionForm, checkIn: e.target.value })}
                className="staffora-input font-mono"
              />
            </div>
            <div>
              <label className="staffora-label">Check Out</label>
              <input
                type="time"
                value={correctionForm.checkOut}
                onChange={(e) => setCorrectionForm({ ...correctionForm, checkOut: e.target.value })}
                className="staffora-input font-mono"
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

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E7E2D9]">
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
