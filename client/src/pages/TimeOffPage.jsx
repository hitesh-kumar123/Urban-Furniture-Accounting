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
  const [activeTab, setActiveTab] = useState('requests'); // 'requests', 'allocations', 'types'
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
  const [showTypeModal, setShowTypeModal] = useState(false);
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

  const [typeForm, setTypeForm] = useState({
    name: '',
    code: '',
    isPaid: true,
    requiresApproval: true,
    color: '#2a14b4',
    maxDaysPerYear: 30
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
      if (typRes.success) setTypes(typRes.data);
      if (empRes.success) {
        setEmployees(empRes.data);
        if (!requestForm.employee && user?.employee) {
          setRequestForm((prev) => ({ ...prev, employee: user.employee }));
        } else if (!requestForm.employee && empRes.data.length > 0) {
          setRequestForm((prev) => ({ ...prev, employee: empRes.data[0]._id }));
        }
      }

      // If user is employee or specific employee selected, fetch balance
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

  // Handle Approve Request
  const handleApprove = async (id) => {
    try {
      const res = await timeOffApi.approveRequest(id);
      if (res.success) {
        showToast('Leave request approved successfully', 'success');
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to approve request', 'error');
    }
  };

  // Handle Reject Request
  const handleOpenReject = (req) => {
    setRejectingRequest(req);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectingRequest) return;
    try {
      const res = await timeOffApi.refuseRequest(rejectingRequest._id, rejectionReason);
      if (res.success) {
        showToast('Leave request refused', 'info');
        setShowRejectModal(false);
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reject request', 'error');
    }
  };

  // Submit Request Form
  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    try {
      const res = await timeOffApi.createRequest(requestForm);
      if (res.success) {
        showToast('Leave request submitted successfully', 'success');
        setShowRequestModal(false);
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit request', 'error');
    }
  };

  // Submit Allocation Form
  const handleSubmitAllocation = async (e) => {
    e.preventDefault();
    try {
      const res = await timeOffApi.createAllocation(allocationForm);
      if (res.success) {
        showToast('Leave allocation saved and activated', 'success');
        setShowAllocationModal(false);
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create allocation', 'error');
    }
  };

  // Submit Type Form
  const handleSubmitType = async (e) => {
    e.preventDefault();
    try {
      const res = await timeOffApi.createType(typeForm);
      if (res.success) {
        showToast('Time off type created', 'success');
        setShowTypeModal(false);
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create leave type', 'error');
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'Approved':
        return <Badge variant="success">Approved</Badge>;
      case 'Pending Approval':
        return <Badge variant="warning">Pending Approval</Badge>;
      case 'Refused':
        return <Badge variant="danger">Refused</Badge>;
      case 'Cancelled':
        return <Badge variant="neutral">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{st}</Badge>;
    }
  };

  const canApprove = hasRole('Admin', 'HR Manager', 'HR Payroll Manager');
  const pendingRequests = requests.filter((r) => r.status === 'Pending Approval');
  const approvedRequests = requests.filter((r) => r.status === 'Approved');

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Time Off & Leave Central</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage leave requests, statutory entitlements, approval workflows, and payroll integration.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canApprove && (
            <Button
              variant="secondary"
              onClick={() => setShowAllocationModal(true)}
              className="flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">post_add</span>
              Allocate Days
            </Button>
          )}
          <Button
            variant="primary"
            onClick={() => {
              if (types.length > 0 && !requestForm.timeOffType) {
                setRequestForm((prev) => ({ ...prev, timeOffType: types[0]._id }));
              }
              setShowRequestModal(true);
            }}
            className="flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">flight_takeoff</span>
            Request Time Off
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Review</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <span className="material-symbols-outlined text-[18px]">pending_actions</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{pendingRequests.length}</div>
          <span className="text-[11px] text-slate-400">Awaiting manager decision</span>
        </div>

        <div className="bg-surface-container-lowest border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved Requests</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <span className="material-symbols-outlined text-[18px]">verified</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{approvedRequests.length}</div>
          <span className="text-[11px] text-slate-400">Applied to payroll engine</span>
        </div>

        <div className="bg-surface-container-lowest border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Leave Types</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">category</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-primary mt-2">{types.length}</div>
          <span className="text-[11px] text-slate-400">Paid & unpaid categories</span>
        </div>

        <div className="bg-surface-container-lowest border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Allocations</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <span className="material-symbols-outlined text-[18px]">assignment_turned_in</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-600 mt-2">{allocations.length}</div>
          <span className="text-[11px] text-slate-400">Annual entitlement grants</span>
        </div>
      </div>

      {/* Stitch Design: Entitlement Visualizer Progress Bars */}
      {balances && balances.length > 0 && (
        <div className="bg-surface-container-lowest border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-on-surface">Annual Entitlement Visualizer</h3>
              <p className="text-xs text-slate-500">Live balance vs consumption metrics for year {new Date().getFullYear()}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Filter Employee:</span>
              <select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
              >
                <option value="">(All / Default)</option>
                {employees.map((e) => (
                  <option key={e._id} value={e._id}>
                    {e.firstName} {e.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {balances.map((b) => {
              const total = b.allocated || 0;
              const used = b.used || 0;
              const remaining = b.remaining || 0;
              const percent = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;

              return (
                <div key={b.timeOffType?._id || b.timeOffType?.name} className="p-4 bg-slate-50/70 border border-slate-100 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">{b.timeOffType?.name || 'Leave Type'}</span>
                    <span className="text-xs font-bold text-primary">{remaining} days left</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full transition-all rounded-full ${
                        percent > 85 ? 'bg-amber-500' : 'bg-primary'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Used: {used} d</span>
                    <span>Total: {total} d</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stitch Design: Pending Approval Action Stream (When Pending items exist and User can approve) */}
      {canApprove && pendingRequests.length > 0 && (
        <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <span className="material-symbols-outlined text-[20px] text-amber-600">assignment_late</span>
              Pending Approval Stream ({pendingRequests.length} Requests Awaiting Action)
            </div>
            <span className="text-xs text-amber-700">Quick 1-Click Review Desk</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {pendingRequests.map((req) => (
              <div
                key={req._id}
                className="bg-white border border-amber-200/60 rounded-xl p-4 shadow-sm flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-100 to-amber-200 text-amber-900 flex items-center justify-center font-bold text-xs">
                        {req.employee?.firstName?.[0]}
                        {req.employee?.lastName?.[0]}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-on-surface">
                          {req.employee?.firstName} {req.employee?.lastName}
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          {req.employee?.employeeCode} • {req.employee?.department}
                        </span>
                      </div>
                    </div>
                    <Badge variant="warning">{req.timeOffType?.name || 'Leave'}</Badge>
                  </div>

                  <div className="mt-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                    <div className="flex justify-between font-semibold text-slate-700 mb-1">
                      <span>
                        {new Date(req.startDate).toLocaleDateString()} — {new Date(req.endDate).toLocaleDateString()}
                      </span>
                      <span className="text-primary font-bold">{req.numberOfDays} Days</span>
                    </div>
                    {req.reason && (
                      <p className="text-[11px] text-slate-500 italic">"{req.reason}"</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenReject(req)}
                    className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[15px]">close</span>
                    Refuse
                  </button>
                  <button
                    onClick={() => handleApprove(req._id)}
                    className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shadow-sm flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[15px]">check</span>
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs Header */}
      <div className="border-b border-slate-200 flex items-center gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'requests'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">event_note</span>
          All Leave Requests ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab('allocations')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'allocations'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">tune</span>
          Allocations & Entitlements ({allocations.length})
        </button>
        {canApprove && (
          <button
            onClick={() => setActiveTab('types')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'types'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">category</span>
            Leave Types & Policies ({types.length})
          </button>
        )}
      </div>

      {/* Tab 1: Requests Table */}
      {activeTab === 'requests' && (
        <div className="bg-surface-container-lowest border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center p-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <span className="material-symbols-outlined text-4xl mb-2">event_available</span>
              <p className="text-sm font-semibold text-slate-600">No leave requests found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200/80 text-left text-sm">
                <thead className="bg-slate-50/70 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Employee</th>
                    <th className="px-5 py-3.5">Leave Type</th>
                    <th className="px-5 py-3.5">Duration</th>
                    <th className="px-5 py-3.5 text-center">Days</th>
                    <th className="px-5 py-3.5">Reason</th>
                    <th className="px-5 py-3.5">Status</th>
                    {canApprove && <th className="px-5 py-3.5 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {requests.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-on-surface text-xs">
                          {r.employee?.firstName} {r.employee?.lastName}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {r.employee?.employeeCode} • {r.employee?.department}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs font-medium text-slate-700">
                        {r.timeOffType?.name || 'Leave'}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600">
                        {new Date(r.startDate).toLocaleDateString()} — {new Date(r.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md text-xs font-bold text-slate-700">
                          {r.numberOfDays} d
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500 max-w-[200px] truncate">
                        {r.reason || '—'}
                      </td>
                      <td className="px-5 py-4">{getStatusBadge(r.status)}</td>
                      {canApprove && (
                        <td className="px-5 py-4 text-right">
                          {r.status === 'Pending Approval' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleApprove(r._id)}
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold"
                                title="Approve"
                              >
                                <span className="material-symbols-outlined text-[16px]">check</span>
                              </button>
                              <button
                                onClick={() => handleOpenReject(r)}
                                className="p-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold"
                                title="Refuse"
                              >
                                <span className="material-symbols-outlined text-[16px]">close</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Closed</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Allocations Table */}
      {activeTab === 'allocations' && (
        <div className="bg-surface-container-lowest border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200/80 text-left text-sm">
              <thead className="bg-slate-50/70 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Leave Type</th>
                  <th className="px-5 py-3.5">Year</th>
                  <th className="px-5 py-3.5 text-center">Days Allocated</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {allocations.map((a) => (
                  <tr key={a._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-semibold text-xs text-on-surface">
                        {a.employee?.firstName} {a.employee?.lastName}
                      </span>
                      <span className="block text-[10px] text-slate-400">{a.employee?.employeeCode}</span>
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-slate-700">{a.timeOffType?.name}</td>
                    <td className="px-5 py-4 text-xs text-slate-600">{a.year}</td>
                    <td className="px-5 py-4 text-center font-bold text-xs text-primary">{a.numberOfDays} Days</td>
                    <td className="px-5 py-4">
                      <Badge variant={a.status === 'Approved' ? 'success' : 'warning'}>{a.status}</Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {a.status === 'Pending Approval' && canApprove && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={async () => {
                            await timeOffApi.approveAllocation(a._id);
                            fetchData();
                          }}
                        >
                          Approve
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Leave Types */}
      {activeTab === 'types' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowTypeModal(true)}
              className="flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Create Leave Policy
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {types.map((t) => (
              <div
                key={t._id}
                className="bg-surface-container-lowest border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                      {t.code}
                    </span>
                    <Badge variant={t.isPaid ? 'success' : 'neutral'}>{t.isPaid ? 'Paid' : 'Unpaid'}</Badge>
                  </div>
                  <h3 className="text-base font-bold text-on-surface">{t.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Max entitlement: <span className="font-semibold text-slate-700">{t.maxDaysPerYear} days / year</span>
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{t.requiresApproval ? 'Approval Required' : 'Auto Approved'}</span>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color || '#2a14b4' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Request Leave Modal */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        title="Submit Time Off Request"
        size="md"
      >
        <form onSubmit={handleSubmitRequest} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Employee *
            </label>
            <select
              required
              value={requestForm.employee}
              onChange={(e) => setRequestForm({ ...requestForm, employee: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {employees.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.firstName} {e.lastName} ({e.employeeCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Time Off Type *
            </label>
            <select
              required
              value={requestForm.timeOffType}
              onChange={(e) => setRequestForm({ ...requestForm, timeOffType: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {types.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.isPaid ? 'Paid' : 'Unpaid'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={requestForm.startDate}
                onChange={(e) => setRequestForm({ ...requestForm, startDate: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                End Date *
              </label>
              <input
                type="date"
                required
                value={requestForm.endDate}
                onChange={(e) => setRequestForm({ ...requestForm, endDate: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Reason / Remarks
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Annual vacation / Medical appointment"
              value={requestForm.reason}
              onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" type="button" onClick={() => setShowRequestModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* Allocate Days Modal */}
      <Modal
        isOpen={showAllocationModal}
        onClose={() => setShowAllocationModal(false)}
        title="Allocate Leave Days"
        size="md"
      >
        <form onSubmit={handleSubmitAllocation} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Employee *
            </label>
            <select
              required
              value={allocationForm.employee}
              onChange={(e) => setAllocationForm({ ...allocationForm, employee: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Select Employee</option>
              {employees.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.firstName} {e.lastName} ({e.employeeCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Leave Type *
            </label>
            <select
              required
              value={allocationForm.timeOffType}
              onChange={(e) => setAllocationForm({ ...allocationForm, timeOffType: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Select Leave Type</option>
              {types.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Calendar Year *
              </label>
              <input
                type="number"
                required
                value={allocationForm.year}
                onChange={(e) => setAllocationForm({ ...allocationForm, year: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Number of Days *
              </label>
              <input
                type="number"
                min="1"
                max="60"
                required
                value={allocationForm.numberOfDays}
                onChange={(e) => setAllocationForm({ ...allocationForm, numberOfDays: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" type="button" onClick={() => setShowAllocationModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Grant Allocation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reject Request Modal with Reason */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Refuse Leave Request"
        size="sm"
      >
        <form onSubmit={handleConfirmReject} className="space-y-4">
          <p className="text-xs text-slate-600">
            Provide an official reason for refusing the leave request for{' '}
            <span className="font-bold text-on-surface">
              {rejectingRequest?.employee?.firstName} {rejectingRequest?.employee?.lastName}
            </span>
            .
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Rejection Reason *
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Critical project milestone / Insufficient team coverage"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" type="submit">
              Confirm Refusal
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Type Modal */}
      <Modal
        isOpen={showTypeModal}
        onClose={() => setShowTypeModal(false)}
        title="Create Leave Policy / Type"
        size="md"
      >
        <form onSubmit={handleSubmitType} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Type Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Paid Annual Leave"
                value={typeForm.name}
                onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. AL"
                value={typeForm.code}
                onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Max Days / Year
              </label>
              <input
                type="number"
                value={typeForm.maxDaysPerYear}
                onChange={(e) => setTypeForm({ ...typeForm, maxDaysPerYear: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Display Color
              </label>
              <input
                type="color"
                value={typeForm.color}
                onChange={(e) => setTypeForm({ ...typeForm, color: e.target.value })}
                className="w-full h-10 p-1 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={typeForm.isPaid}
                onChange={(e) => setTypeForm({ ...typeForm, isPaid: e.target.checked })}
                className="rounded text-primary focus:ring-primary h-4 w-4"
              />
              Paid Leave
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={typeForm.requiresApproval}
                onChange={(e) => setTypeForm({ ...typeForm, requiresApproval: e.target.checked })}
                className="rounded text-primary focus:ring-primary h-4 w-4"
              />
              Requires Manager Approval
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" type="button" onClick={() => setShowTypeModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Policy
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
