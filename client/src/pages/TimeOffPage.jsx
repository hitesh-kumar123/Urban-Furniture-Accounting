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
  const [activeTab, setActiveTab] = useState('requests'); // 'requests', 'allocations'
  const [requests, setRequests] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [types, setTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');

  // Modals
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingRequest, setRejectingRequest] = useState(null);
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
    numberOfDays: 20
  });

  const { user, hasRole } = useAuth();
  const { showToast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqRes, allRes, typRes, empRes] = await Promise.all([
        timeOffApi.getRequests({
          status: statusFilter || undefined,
          employee: employeeFilter || undefined
        }),
        timeOffApi.getAllocations(),
        timeOffApi.getTypes(),
        employeeApi.getAll()
      ]);

      if (reqRes.success) setRequests(reqRes.data);
      if (allRes.success) setAllocations(allRes.data);
      if (typRes.success) {
        setTypes(typRes.data);
        if (typRes.data.length > 0 && !requestForm.timeOffType) {
          setRequestForm((prev) => ({ ...prev, timeOffType: typRes.data[0]._id }));
          setAllocationForm((prev) => ({ ...prev, timeOffType: typRes.data[0]._id }));
        }
      }
      if (empRes.success) {
        setEmployees(empRes.data);
        if (!requestForm.employee && user?.employee) {
          setRequestForm((prev) => ({ ...prev, employee: user.employee }));
        } else if (!requestForm.employee && empRes.data.length > 0) {
          setRequestForm((prev) => ({ ...prev, employee: empRes.data[0]._id }));
          setAllocationForm((prev) => ({ ...prev, employee: empRes.data[0]._id }));
        }
      }

      const targetEmp = employeeFilter || user?.employee || (empRes.data?.[0]?._id);
      if (targetEmp) {
        const balRes = await timeOffApi.getBalance({ employeeId: targetEmp, year: new Date().getFullYear() });
        if (balRes.success) {
          setBalances(balRes.data);
        }
      }
    } catch (err) {
      showToast('Failed to load leave records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, employeeFilter, activeTab]);

  const handleApprove = async (id) => {
    try {
      const res = await timeOffApi.approveRequest(id);
      if (res.success) {
        showToast('Leave request approved', 'success');
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to approve', 'error');
    }
  };

  const handleOpenReject = (req) => {
    setRejectingRequest(req);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectingRequest) return;
    try {
      const res = await timeOffApi.rejectRequest(rejectingRequest._id, { rejectionReason });
      if (res.success) {
        showToast('Leave request rejected', 'success');
        setShowRejectModal(false);
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reject', 'error');
    }
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return 1;
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      const dur = calculateDuration(requestForm.startDate, requestForm.endDate);
      const payload = {
        ...requestForm,
        duration: dur
      };
      const res = await timeOffApi.createRequest(payload);
      if (res.success) {
        showToast('Leave request submitted successfully', 'success');
        setShowRequestModal(false);
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit request', 'error');
    }
  };

  const handleCreateAllocation = async (e) => {
    e.preventDefault();
    try {
      const res = await timeOffApi.createAllocation(allocationForm);
      if (res.success) {
        showToast('Leave quota allocated', 'success');
        setShowAllocationModal(false);
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to allocate', 'error');
    }
  };

  const handleOpenRequestModal = () => {
    const today = new Date().toISOString().split('T')[0];
    setRequestForm({
      employee: user?.employee || (employees[0]?._id || ''),
      timeOffType: types[0]?._id || '',
      startDate: today,
      endDate: today,
      reason: ''
    });
    setShowRequestModal(true);
  };

  const handleOpenAllocationModal = () => {
    setAllocationForm({
      employee: employees[0]?._id || '',
      timeOffType: types[0]?._id || '',
      year: new Date().getFullYear(),
      numberOfDays: 20
    });
    setShowAllocationModal(true);
  };

  const canApprove = hasRole('Admin', 'HR Manager', 'HR Payroll Manager');

  return (
    <div className="p-5 max-w-[1600px] w-full mx-auto flex flex-col gap-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#FF6B3D] font-semibold">
              Time Off
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#F5F2EA] tracking-tight font-display">
            Leave Central &amp; Approvals
          </h1>
          <p className="text-xs text-[#A6A3A0] mt-0.5">
            Annual entitlements, paid/unpaid leave approval queue, and balance meters.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="staffora-input py-1 px-2.5 text-xs w-auto font-mono"
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
          {balances.map((b) => {
            const used = b.taken || 0;
            const total = b.allocated || 20;
            const remaining = Math.max(0, total - used);
            const percent = Math.min(100, Math.round((used / total) * 100));

            return (
              <div key={b.timeOffType?._id || b.timeOffType} className="midnight-card p-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#F5F2EA] uppercase tracking-wider font-sans">
                    {b.timeOffType?.name || 'Annual Leave'}
                  </span>
                  <span className="text-[#39D98A] font-bold">{remaining}d remaining</span>
                </div>

                <div className="flex justify-between items-center text-[11px] text-[#6F6C69]">
                  <span>{used} / {total} days used</span>
                  <span>{percent}%</span>
                </div>

                <div className="w-full h-1.5 bg-[#0B0B0D] rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full rounded-full bg-[#FF6B3D]"
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
          <div className="p-10 text-center text-[#6F6C69] font-mono text-xs">
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
                      <div className="font-semibold text-[#F5F2EA]">{empName}</div>
                      <div className="text-[10px] font-mono text-[#6F6C69]">
                        {r.reason || 'No reason provided'}
                      </div>
                    </td>

                    <td className="text-xs text-[#A6A3A0]">
                      {r.timeOffType?.name || 'Leave'}
                    </td>

                    <td className="font-mono text-xs text-[#A6A3A0]">
                      {sDate} → {eDate}
                    </td>

                    <td className="text-center font-mono font-bold text-xs text-[#FF8A65]">
                      {r.numberOfDays || 1}d
                    </td>

                    <td className="font-mono">
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
                            className="px-2 py-0.5 bg-[#39D98A]/10 text-[#39D98A] hover:bg-[#39D98A]/20 border border-[#39D98A]/25 rounded text-[11px] font-mono font-semibold"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleOpenReject(r)}
                            className="px-2 py-0.5 bg-[#FF5C5C]/10 text-[#FF5C5C] hover:bg-[#FF5C5C]/20 border border-[#FF5C5C]/25 rounded text-[11px] font-mono font-semibold"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] font-mono text-[#6F6C69]">Resolved</span>
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
        <form onSubmit={handleCreateRequest} className="space-y-3 font-mono text-xs">
          <div>
            <label className="staffora-label">Employee</label>
            <select
              value={requestForm.employee}
              onChange={(e) => setRequestForm({ ...requestForm, employee: e.target.value })}
              className="staffora-input"
              required
            >
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeCode})
                </option>
              ))}
            </select>
          </div>

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
                className="staffora-input"
              />
            </div>
            <div>
              <label className="staffora-label">End Date</label>
              <input
                type="date"
                required
                value={requestForm.endDate}
                onChange={(e) => setRequestForm({ ...requestForm, endDate: e.target.value })}
                className="staffora-input"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-[#A6A3A0] bg-[#111114] p-2.5 rounded border border-white/5 font-mono">
            <span>Requested Duration:</span>
            <span className="font-bold text-[#FF8A65]">
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
              placeholder="Provide reason for time off"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
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
        <form onSubmit={handleCreateAllocation} className="space-y-3 font-mono text-xs">
          <div>
            <label className="staffora-label">Employee</label>
            <select
              value={allocationForm.employee}
              onChange={(e) => setAllocationForm({ ...allocationForm, employee: e.target.value })}
              className="staffora-input"
              required
            >
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeCode})
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
                className="staffora-input"
              />
            </div>
            <div>
              <label className="staffora-label">Number of Days</label>
              <input
                type="number"
                required
                value={allocationForm.numberOfDays}
                onChange={(e) => setAllocationForm({ ...allocationForm, numberOfDays: Number(e.target.value) })}
                className="staffora-input"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
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
        <form onSubmit={handleConfirmReject} className="space-y-3 font-mono text-xs">
          <p className="text-[#A6A3A0]">
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
          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
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
