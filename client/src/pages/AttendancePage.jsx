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
  const getTodayLocalDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };
  const [selectedDate, setSelectedDate] = useState(getTodayLocalDate());
  const [statusFilter, setStatusFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');

  // Clock In/Out state for logged in user
  const [todayRecord, setTodayRecord] = useState(null);
  const [clockActionLoading, setClockActionLoading] = useState(false);

  // Manual Correction Modal
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewingPunchRecord, setViewingPunchRecord] = useState(null);
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
          const userEmpId = (user.employee?._id || user.employee || '').toString();
          const userRec = attRes.data.find(
            (a) => (a.employee?._id || a.employee || '').toString() === userEmpId
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
    setClockActionLoading(true);
    try {
      const res = await attendanceApi.togglePunch();
      if (res.success) {
        showToast(res.message || 'Shift punch recorded successfully', 'success');
        fetchAttendance();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Clock in failed', 'error');
    } finally {
      setClockActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    setClockActionLoading(true);
    try {
      const res = await attendanceApi.togglePunch();
      if (res.success) {
        showToast(res.message || 'Break / Clock-out logged successfully', 'success');
        fetchAttendance();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Clock out failed', 'error');
    } finally {
      setClockActionLoading(false);
    }
  };

  const formatTimeToLocalInput = (dateInput, fallback = '09:00') => {
    if (!dateInput) return fallback;
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return fallback;
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const buildLocalDateTime = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return null;
    const cleanDate = dateStr.split('T')[0];
    const d = new Date(`${cleanDate}T${timeStr}:00`);
    return !isNaN(d.getTime()) ? d.toISOString() : null;
  };

  const handleOpenCorrection = (rec) => {
    setEditingRecord(rec);
    const recDate = rec?.date ? new Date(rec.date).toISOString().split('T')[0] : selectedDate;
    setCorrectionForm({
      employeeId: rec?.employee?._id || rec?.employee || (employees[0]?._id || ''),
      date: recDate,
      checkIn: formatTimeToLocalInput(rec?.checkIn, '09:00'),
      checkOut: formatTimeToLocalInput(rec?.checkOut, '18:00'),
      status: rec?.status || 'Present',
      workedHours: rec?.workedHours !== undefined ? rec.workedHours : 8,
      isManualCorrection: true,
      remarks: rec?.remarks || ''
    });
    setShowCorrectionModal(true);
  };

  const handleSaveCorrection = async (e) => {
    e.preventDefault();
    try {
      const checkInISO = buildLocalDateTime(correctionForm.date, correctionForm.checkIn);
      const checkOutISO = buildLocalDateTime(correctionForm.date, correctionForm.checkOut);

      if (editingRecord) {
        const res = await attendanceApi.update(editingRecord._id, {
          ...correctionForm,
          checkIn: checkInISO,
          checkOut: checkOutISO
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
          checkIn: checkInISO,
          checkOut: checkOutISO,
          status: correctionForm.status,
          workedHours: Number(correctionForm.workedHours) || 8,
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
                Clock In Shift
              </Button>
            ) : !todayRecord?.checkOut ? (
              <Button
                variant="danger"
                size="sm"
                onClick={handleClockOut}
                loading={clockActionLoading}
                icon="logout"
              >
                Clock Out / Break
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleClockIn}
                loading={clockActionLoading}
                icon="login"
              >
                Clock In Again / Resume
              </Button>
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

                    <td className="font-mono text-xs text-[#6B665C]">
                      {att.date ? new Date(att.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                    <td className="font-mono text-xs text-[#1C1B19]">{checkInTime}</td>
                    <td className="font-mono text-xs text-[#1C1B19]">{checkOutTime}</td>

                    <td className="text-center font-mono font-bold text-xs text-[#0F5C4A]">
                      {att.workedHours ? `${att.workedHours}h` : '—'}
                    </td>

                    <td>{getStatusBadge(att.status)}</td>

                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingPunchRecord(att)}
                          className="px-2 py-1 bg-[#FAF9F6] hover:bg-[#E8F4F1] text-[#0F5C4A] border border-[#E7E2D9] hover:border-[#0F5C4A]/30 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1"
                          title="View detailed punch intervals and break logs"
                        >
                          <span className="material-symbols-outlined text-[14px]">timeline</span>
                          {Array.isArray(att.punches) && att.punches.length > 1 ? `${att.punches.length} Punches` : 'Timeline'}
                        </button>
                        {canCorrect && (
                          <button
                            onClick={() => handleOpenCorrection(att)}
                            className="px-2 py-1 bg-white hover:bg-[#FAF9F6] text-[#1C1B19] border border-[#E7E2D9] rounded-md text-[11px] font-medium transition-colors"
                          >
                            Adjust
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

      {/* Punch Sessions Timeline Modal for Admin & HR */}
      <Modal
        isOpen={!!viewingPunchRecord}
        onClose={() => setViewingPunchRecord(null)}
        title="Shift Punch Log & Break Breakdown"
        maxWidth="max-w-lg"
      >
        {viewingPunchRecord && (
          <div className="space-y-4 text-xs font-body">
            {/* Summary Header Card */}
            <div className="p-3 bg-[#FAF9F6] rounded-lg border border-[#E7E2D9] flex items-center justify-between">
              <div>
                <span className="font-semibold text-sm text-[#1C1B19] block">
                  {typeof viewingPunchRecord.employee === 'object'
                    ? `${viewingPunchRecord.employee.firstName || ''} ${viewingPunchRecord.employee.lastName || ''}`.trim()
                    : 'Employee'}
                </span>
                <span className="text-[11px] font-mono text-[#6B665C]">
                  {viewingPunchRecord.employee?.employeeId || 'EMP'} • {viewingPunchRecord.employee?.department || 'General'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-[#0F5C4A] block">
                  {viewingPunchRecord.workedHours || 0} hrs Logged
                </span>
                {getStatusBadge(viewingPunchRecord.status)}
              </div>
            </div>

            {/* Punch Interval Sessions List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-[#6B665C] font-mono">
                <span>Chronological Shift Intervals:</span>
                <span>{Array.isArray(viewingPunchRecord.punches) ? viewingPunchRecord.punches.length : 1} session(s)</span>
              </div>

              {Array.isArray(viewingPunchRecord.punches) && viewingPunchRecord.punches.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {viewingPunchRecord.punches.map((p, idx) => {
                    const inTime = p.in ? new Date(p.in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
                    const outTime = p.out ? new Date(p.out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active on Shift';
                    const isCurrent = !p.out;

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border transition-all ${
                          isCurrent
                            ? 'bg-[#E8F4F1]/50 border-[#0F5C4A]/30'
                            : 'bg-white border-[#E7E2D9]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-[#0F5C4A] text-white text-[10px] font-bold flex items-center justify-center font-mono">
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-xs text-[#1C1B19]">
                              Session #{idx + 1} ({p.type || 'Regular'})
                            </span>
                            {isCurrent && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#0F5C4A] bg-[#E8F4F1] px-1.5 py-0.5 rounded border border-[#0F5C4A]/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#0F5C4A] animate-pulse"></span>
                                Live On Shift
                              </span>
                            )}
                          </div>
                          <span className="font-mono font-bold text-[#0F5C4A] text-xs">
                            {p.out ? `${p.durationHours || 0} hrs` : 'Counting'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[#E7E2D9]/60 text-[11px] font-mono text-[#6B665C]">
                          <div>
                            <span className="text-[#918C82] block text-[10px]">PUNCH IN:</span>
                            <span className="text-[#1C1B19] font-medium">{inTime}</span>
                          </div>
                          <div>
                            <span className="text-[#918C82] block text-[10px]">PUNCH OUT / BREAK:</span>
                            <span className="text-[#1C1B19] font-medium">{outTime}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 bg-[#FAF9F6] rounded-lg border border-[#E7E2D9] text-center text-xs text-[#6B665C]">
                  Single punch recorded: In at {viewingPunchRecord.checkIn ? new Date(viewingPunchRecord.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  {viewingPunchRecord.checkOut ? ` • Out at ${new Date(viewingPunchRecord.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ' (Currently Clocked In)'}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex justify-between items-center pt-3 border-t border-[#E7E2D9]">
              <span className="text-[11px] text-[#918C82] font-mono">
                {viewingPunchRecord.isManualCorrection ? '⚠️ Manual HR Adjustment' : 'Biometric / Web Clock Sync'}
              </span>
              <div className="flex gap-2">
                {canCorrect && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const rec = viewingPunchRecord;
                      setViewingPunchRecord(null);
                      handleOpenCorrection(rec);
                    }}
                    icon="edit"
                  >
                    Adjust Hours
                  </Button>
                )}
                <Button variant="primary" size="sm" onClick={() => setViewingPunchRecord(null)}>
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
