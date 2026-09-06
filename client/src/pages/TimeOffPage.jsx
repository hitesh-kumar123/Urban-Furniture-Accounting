import React, { useState, useEffect } from 'react';
import { timeOffApi } from '../api/timeOffApi';
import { employeeApi } from '../api/employeeApi';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const TimeOffPage = () => {
  const [requests, setRequests] = useState([]);
  const [types, setTypes] = useState([]);
  const [balances, setBalances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Forms
  const [requestForm, setRequestForm] = useState({
    employee: '',
    timeOffType: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const [allocationForm, setAllocationForm] = useState({
    employee: '',
    timeOffType: '',
    year: new Date().getFullYear(),
    numberOfDays: 12
  });

  const { user, hasRole } = useAuth();
  const { showToast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqRes, typeRes, empRes] = await Promise.all([
        timeOffApi.getRequests({ status: statusFilter || undefined }),
        timeOffApi.getTypes(),
        employeeApi.getAll()
      ]);

      if (reqRes.success) setRequests(reqRes.data);
      if (typeRes.success) setTypes(typeRes.data);
      if (empRes.success) setEmployees(empRes.data);

      // If employee, fetch individual balances
      if (user?.employee) {
        const balRes = await timeOffApi.getBalance({ employeeId: user.employee });
        if (balRes.success) setBalances(Array.isArray(balRes.data) ? balRes.data : []);
      }
    } catch (err) {
      showToast('Failed to load leave records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const calculateDuration = (start, end) => {
    if (!start || !end) return 0;
    const startStr = String(start).split('T')[0];
    const endStr = String(end).split('T')[0];
    const [sY, sM, sD] = startStr.split('-').map(Number);
    const [eY, eM, eD] = endStr.split('-').map(Number);

    if (!sY || !sM || !sD || !eY || !eM || !eD) return 0;

    const cur = new Date(Date.UTC(sY, sM - 1, sD));
    const last = new Date(Date.UTC(eY, eM - 1, eD));
    if (cur > last) return 0;

    let workingDays = 0;
    while (cur <= last) {
      const day = cur.getUTCDay(); // 0 = Sunday, 6 = Saturday
      if (day !== 0 && day !== 6) {
        workingDays += 1;
      }
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    return workingDays;
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      const duration = calculateDuration(requestForm.startDate, requestForm.endDate);
      if (duration === 0) {
        showToast(
          'Selected date range falls on weekends (Saturday/Sunday). Leave is not required for non-working days.',
          'warning'
        );
        return;
      }

      const res = await timeOffApi.createRequest({
        ...requestForm,
        employee: user?.role === 'Employee' ? user.employee : requestForm.employee,
        duration
      });
      if (res.success) {
        showToast('Time off request submitted successfully', 'success');
        setShowRequestModal(false);
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Submission failed', 'error');
    }
  };

  const handleCreateAllocation = async (e) => {
    e.preventDefault();
    try {
      const res = await timeOffApi.allocate(allocationForm);
      if (res.success) {
        showToast('Annual quota allocated successfully', 'success');
        setShowAllocationModal(false);
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Allocation failed', 'error');
    }
  };

  const handleApprove = async (id) => {
    try {
      const res = await timeOffApi.approveRequest(id);
      if (res.success) {
        showToast('Leave request approved', 'success');
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Approval failed', 'error');
    }
  };

  const handleOpenReject = (req) => {
    setSelectedRequest(req);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    try {
      const res = await timeOffApi.rejectRequest(selectedRequest._id, { rejectionReason });
      if (res.success) {
        showToast('Leave request rejected', 'info');
        setShowRejectModal(false);
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Rejection failed', 'error');
    }
  };

  const handleOpenRequestModal = () => {
    setRequestForm({
      employee: employees[0]?._id || '',
      timeOffType: types[0]?._id || '',
      startDate: '',
      endDate: '',
      reason: ''
    });
    setShowRequestModal(true);
  };

  const handleOpenAllocationModal = () => {
    setAllocationForm({
      employee: employees[0]?._id || '',
      timeOffType: types[0]?._id || '',
      year: new Date().getFullYear(),
      numberOfDays: 12
    });
    setShowAllocationModal(true);
  };

  const canApprove = hasRole('Admin', 'HR Manager', 'HR Payroll Manager');

  return (
    <div className="p-5 max-w-[1600px] w-full mx-auto flex flex-col gap-5 font-body">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E2D9]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-[#0F5C4A] font-semibold">
              Time Off
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-medium text-[#1C1B19]">
            Leave Central &amp; Approvals
          </h1>
          <p className="text-xs text-[#6B665C] mt-0.5">
            Annual entitlements, paid/unpaid leave approval queue, and balance meters.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="staffora-input py-1.5 px-3 text-xs w-auto font-medium"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

          {canApprove && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleOpenAllocationModal}
              icon="tune"
            >
              Allocate Quota
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenRequestModal}
            icon="add"
          >
            Submit Request
          </Button>
        </div>
      </div>

      {/* Leave Entitlement Balance Meters */}
      {balances.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {balances.map((b) => {
            const used = b.taken || 0;
            const total = b.allocated || 20;
            const remaining = Math.max(0, total - used);
            const percent = Math.min(100, Math.round((used / total) * 100));

            return (
              <div key={b.timeOffType?._id || b.timeOffType} className="bg-white rounded-xl border border-[#E7E2D9] p-4 space-y-2 shadow-sm">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-[#1C1B19]">
                    {b.timeOffType?.name || 'Annual Leave'}
                  </span>
                  <span className="text-[#0F5C4A] font-bold font-mono">{remaining}d remaining</span>
                </div>

                <div className="flex justify-between items-center text-xs text-[#6B665C]">
                  <span>{used} / {total} days used</span>
                  <span className="font-mono">{percent}%</span>
                </div>

                <div className="w-full h-1.5 bg-[#E7E2D9] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#0F5C4A]"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Requests Table */}
      <div className="staffora-table-container">
        {loading ? (
          <LoadingSpinner message="Querying leave registry..." />
        ) : requests.length === 0 ? (
          <div className="p-10 text-center text-[#6B665C] text-xs">
            No leave requests found.
          </div>
        ) : (
          <table className="staffora-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Dates</th>
                <th className="text-center">Days</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => {
                const empName = r.employee
                  ? typeof r.employee === 'object'
                    ? `${r.employee.firstName || ''} ${r.employee.lastName || ''}`.trim()
                    : 'Employee'
                  : 'Employee';
                const sDate = r.startDate?.split('T')[0];
                const eDate = r.endDate?.split('T')[0];

                return (
                  <tr key={r._id}>
                    <td>
                      <div className="font-medium text-[#1C1B19]">{empName}</div>
                      <div className="text-[11px] text-[#6B665C]">
                        {r.reason || 'No reason provided'}
                      </div>
                    </td>

                    <td className="text-xs text-[#6B665C]">
                      {r.timeOffType?.name || 'Leave'}
                    </td>

                    <td className="font-mono text-xs text-[#6B665C]">
                      {sDate} → {eDate}
                    </td>

                    <td className="text-center font-mono font-bold text-xs text-[#0F5C4A]">
                      {r.numberOfDays || r.duration || 1}d
                    </td>

                    <td>
                      <Badge
                        variant={
                          r.status === 'Approved'
                            ? 'success'
                            : r.status === 'Pending'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {r.status}
                      </Badge>
                    </td>

                    <td className="text-right">
                      {r.status === 'Pending' && canApprove ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleApprove(r._id)}
                            className="px-2.5 py-1 bg-[#E8F4F1] text-[#0F5C4A] hover:bg-[#0F5C4A]/10 border border-[#0F5C4A]/25 rounded-md text-xs font-medium"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleOpenReject(r)}
                            className="px-2.5 py-1 bg-[#FDF1EE] text-[#B5482E] hover:bg-[#B5482E]/10 border border-[#B5482E]/25 rounded-md text-xs font-medium"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-[#918C82]">Resolved</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Submit Leave Modal */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        title="Submit Time Off Request"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateRequest} className="space-y-3 text-xs">
          {user?.role === 'Employee' ? (
            <div className="p-3 bg-[#FAF9F6] border border-[#E7E2D9] rounded-lg flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#6B665C] font-semibold block">Applying As</span>
                <span className="text-xs font-semibold text-[#1C1B19]">{user?.name}</span>
              </div>
              <Badge variant="info">{user?.employee?.employeeId || 'MY ACCOUNT'}</Badge>
            </div>
          ) : (
            <div>
              <label className="staffora-label">Employee *</label>
              <select
                value={requestForm.employee}
                onChange={(e) => setRequestForm({ ...requestForm, employee: e.target.value })}
                className="staffora-input"
                required
              >
                <option value="" disabled>-- Select Employee --</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeId || emp.jobPosition || 'Staff'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="staffora-label">Time Off Type</label>
            <select
              value={requestForm.timeOffType}
              onChange={(e) => setRequestForm({ ...requestForm, timeOffType: e.target.value })}
              className="staffora-input"
              required
            >
              {types.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.isPaid ? 'Paid' : 'Unpaid'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="staffora-label">Start Date</label>
              <input
                type="date"
                required
                value={requestForm.startDate}
                onChange={(e) => setRequestForm({ ...requestForm, startDate: e.target.value })}
                className="staffora-input font-mono"
              />
            </div>
            <div>
              <label className="staffora-label">End Date</label>
              <input
                type="date"
                required
                value={requestForm.endDate}
                onChange={(e) => setRequestForm({ ...requestForm, endDate: e.target.value })}
                className="staffora-input font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-[#6B665C] bg-[#FAF9F6] p-2.5 rounded-lg border border-[#E7E2D9]">
            <div className="flex flex-col">
              <span className="font-medium text-[#1C1B19]">Requested Working Days:</span>
              <span className="text-[10px] text-[#0F5C4A]">Excludes Saturdays &amp; Sundays</span>
            </div>
            <span className="font-bold text-[#0F5C4A] font-mono text-sm">
              {calculateDuration(requestForm.startDate, requestForm.endDate)} day(s)
            </span>
          </div>

          <div>
            <label className="staffora-label">Reason / Remarks</label>
            <textarea
              rows={2}
              value={requestForm.reason}
              onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
              className="staffora-input"
              placeholder="Provide reason for time off (e.g. Medical, Vacation, Family)"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E7E2D9]">
            <Button variant="secondary" type="button" onClick={() => setShowRequestModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* Allocate Quota Modal */}
      <Modal
        isOpen={showAllocationModal}
        onClose={() => setShowAllocationModal(false)}
        title="Allocate Annual Leave Quota"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateAllocation} className="space-y-3 text-xs">
          <div>
            <label className="staffora-label">Employee *</label>
            <select
              value={allocationForm.employee}
              onChange={(e) => setAllocationForm({ ...allocationForm, employee: e.target.value })}
              className="staffora-input"
              required
            >
              <option value="" disabled>-- Select Employee --</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeId || emp.jobPosition || 'Staff'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="staffora-label">Time Off Type</label>
            <select
              value={allocationForm.timeOffType}
              onChange={(e) => setAllocationForm({ ...allocationForm, timeOffType: e.target.value })}
              className="staffora-input"
              required
            >
              {types.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="staffora-label">Year</label>
              <input
                type="number"
                required
                value={allocationForm.year}
                onChange={(e) => setAllocationForm({ ...allocationForm, year: Number(e.target.value) })}
                className="staffora-input font-mono"
              />
            </div>
            <div>
              <label className="staffora-label">Number of Days</label>
              <input
                type="number"
                required
                value={allocationForm.numberOfDays}
                onChange={(e) => setAllocationForm({ ...allocationForm, numberOfDays: Number(e.target.value) })}
                className="staffora-input font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E7E2D9]">
            <Button variant="secondary" type="button" onClick={() => setShowAllocationModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Allocation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reject Request Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject Leave Request"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleConfirmReject} className="space-y-3 text-xs">
          <p className="text-[#6B665C]">
            Please provide an operational justification for refusing this leave request:
          </p>
          <div>
            <textarea
              required
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="staffora-input"
              placeholder="e.g. Critical project deadline, overlapping team leaves"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#E7E2D9]">
            <Button variant="secondary" type="button" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" type="submit">
              Confirm Rejection
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
