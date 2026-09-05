import React, { useState, useEffect } from 'react';
import { contractApi } from '../api/contractApi';
import { employeeApi } from '../api/employeeApi';
import { salaryApi } from '../api/salaryApi';
import { scheduleApi } from '../api/scheduleApi';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const ContractsPage = () => {
  const [contracts, setContracts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [structures, setStructures] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modals & Applicable lookup tester
  const [showModal, setShowModal] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupForm, setLookupForm] = useState({ employeeId: '', startDate: '', endDate: '' });

  const { hasRole } = useAuth();
  const { showToast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, eRes, strRes, schRes] = await Promise.all([
        contractApi.getAll({ status: statusFilter || undefined }),
        employeeApi.getAll(),
        salaryApi.getStructures(),
        scheduleApi.getAll()
      ]);

      if (cRes.success) setContracts(cRes.data);
      if (eRes.success) setEmployees(eRes.data);
      if (strRes.success) setStructures(strRes.data);
      if (schRes.success) setSchedules(schRes.data);
    } catch (err) {
      showToast('Failed to load contract registry', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this contract?')) return;
    try {
      const res = await contractApi.delete(id);
      if (res.success) {
        showToast('Contract deleted successfully', 'success');
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed', 'error');
    }
  };

  const handleLookup = async (e) => {
    e.preventDefault();
    try {
      const res = await contractApi.getApplicable(lookupForm.employeeId, lookupForm.startDate, lookupForm.endDate);
      setLookupResult(res.data);
      if (!res.data) {
        showToast('No active or historical contract covered this period', 'warning');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Lookup failed', 'error');
    }
  };

  return (
    <div className="p-space-lg max-w-[1600px] w-full mx-auto flex flex-col gap-space-lg">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div>
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">
            Employment Terms &amp; Compensation
          </span>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
            Contract Management Registry
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Historical contract versioning &amp; dynamic payroll period mapping.
          </p>
        </div>

        <div className="flex items-center gap-space-xs flex-wrap">
          <Button
            variant="outline"
            icon="manage_search"
            onClick={() => {
              setLookupResult(null);
              setShowLookupModal(true);
            }}
          >
            Period Contract Lookup
          </Button>

          {hasRole('Admin', 'HR Manager', 'HR Payroll Manager') && (
            <Button
              onClick={() => {
                setEditingContract(null);
                setShowModal(true);
              }}
              icon="add"
            >
              + Create Contract
            </Button>
          )}
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading employment contracts..." />
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low font-label-sm text-label-sm text-outline uppercase tracking-wider select-none">
                  <th className="py-3 px-4 font-semibold">Contract Title &amp; Employee</th>
                  <th className="py-3 px-4 font-semibold">Base Wage ($)</th>
                  <th className="py-3 px-4 font-semibold">Salary Structure</th>
                  <th className="py-3 px-4 font-semibold">Validity Range</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 font-body-sm text-body-sm text-on-surface">
                {contracts.map((contract) => (
                  <tr key={contract._id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-on-surface">{contract.name}</span>
                        <span className="text-xs text-primary font-semibold">
                          {contract.employee?.firstName} {contract.employee?.lastName} ({contract.employee?.employeeId})
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-primary font-tabular-numeric text-sm">
                        ${contract.wage?.toLocaleString()}/mo
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-on-surface font-medium">
                        {contract.salaryStructure?.name || 'Standard Structure'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-xs text-on-surface-variant font-medium">
                        {new Date(contract.startDate).toLocaleDateString()} –{' '}
                        {contract.endDate ? new Date(contract.endDate).toLocaleDateString() : 'Ongoing'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          contract.status === 'Active'
                            ? 'success'
                            : contract.status === 'Expired'
                            ? 'default'
                            : 'warning'
                        }
                      >
                        {contract.status}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        {hasRole('Admin', 'HR Manager', 'HR Payroll Manager') && (
                          <button
                            onClick={() => {
                              setEditingContract(contract);
                              setShowModal(true);
                            }}
                            className="p-1.5 hover:bg-surface-container rounded-lg text-primary"
                            title="Edit Contract"
                          >
                            <span className="material-symbols-outlined text-base">edit</span>
                          </button>
                        )}
                        {hasRole('Admin', 'HR Manager') && (
                          <button
                            onClick={() => handleDelete(contract._id)}
                            className="p-1.5 hover:bg-rose-50 rounded-lg text-error"
                            title="Delete Contract"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Contract Create/Edit Modal */}
      <ContractFormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingContract(null);
        }}
        initialData={editingContract}
        employees={employees}
        structures={structures}
        schedules={schedules}
        onSuccess={() => {
          setShowModal(false);
          setEditingContract(null);
          fetchData();
        }}
      />

      {/* Period Contract Lookup Tester Modal */}
      <Modal
        isOpen={showLookupModal}
        onClose={() => setShowLookupModal(false)}
        title="Period-Specific Applicable Contract Lookup"
      >
        <form onSubmit={handleLookup} className="flex flex-col gap-4">
          <p className="text-xs text-on-surface-variant">
            Test the backend <code className="bg-surface-container-low px-1 py-0.5 rounded font-bold text-primary">getApplicableContract()</code> resolution algorithm by selecting an employee and a target payroll timeframe.
          </p>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-on-surface-variant">Select Employee *</label>
            <select
              required
              value={lookupForm.employeeId}
              onChange={(e) => setLookupForm({ ...lookupForm, employeeId: e.target.value })}
              className="w-full px-3 py-2 bg-surface-container-low rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Choose employee...</option>
              {employees.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.firstName} {e.lastName} ({e.employeeId})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-on-surface-variant">Period Start Date *</label>
              <input
                type="date"
                required
                value={lookupForm.startDate}
                onChange={(e) => setLookupForm({ ...lookupForm, startDate: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-surface-container-low rounded-xl text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant">Period End Date *</label>
              <input
                type="date"
                required
                value={lookupForm.endDate}
                onChange={(e) => setLookupForm({ ...lookupForm, endDate: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-surface-container-low rounded-xl text-sm outline-none"
              />
            </div>
          </div>

          <Button type="submit" icon="search">Resolve Applicable Contract</Button>

          {lookupResult && (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 mt-2 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-emerald-900">{lookupResult.name}</span>
                <Badge variant="success">Applicable Match</Badge>
              </div>
              <p className="text-xs text-emerald-800">
                Wage: <strong>${lookupResult.wage?.toLocaleString()}/mo</strong> • Structure: <strong>{lookupResult.salaryStructure?.name}</strong>
              </p>
              <p className="text-[11px] text-emerald-700">
                Term: {new Date(lookupResult.startDate).toLocaleDateString()} to {lookupResult.endDate ? new Date(lookupResult.endDate).toLocaleDateString() : 'Permanent'}
              </p>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
};

const ContractFormModal = ({ isOpen, onClose, initialData, employees, structures, schedules, onSuccess }) => {
  const [formData, setFormData] = useState({
    employee: '',
    name: '',
    startDate: '',
    endDate: '',
    wage: 5000,
    salaryStructure: '',
    workingSchedule: '',
    status: 'Active'
  });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (initialData) {
      setFormData({
        employee: initialData.employee?._id || initialData.employee || '',
        name: initialData.name || '',
        startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '',
        endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '',
        wage: initialData.wage || 0,
        salaryStructure: initialData.salaryStructure?._id || initialData.salaryStructure || '',
        workingSchedule: initialData.workingSchedule?._id || initialData.workingSchedule || '',
        status: initialData.status || 'Active'
      });
    } else {
      setFormData({
        employee: employees[0]?._id || '',
        name: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        wage: 6500,
        salaryStructure: structures[0]?._id || '',
        workingSchedule: schedules[0]?._id || '',
        status: 'Active'
      });
    }
  }, [initialData, isOpen, employees, structures, schedules]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        endDate: formData.endDate ? formData.endDate : null
      };
      if (initialData) {
        await contractApi.update(initialData._id, payload);
        showToast('Contract updated successfully', 'success');
      } else {
        await contractApi.create(payload);
        showToast('Contract created successfully', 'success');
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
      title={initialData ? 'Edit Contract Terms' : 'Draft New Employment Contract'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-semibold text-on-surface-variant">Contract Reference Title *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Senior Engineer 2026 Permanent Agreement"
            className="w-full mt-1 px-3 py-2 bg-surface-container-low rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-on-surface-variant">Employee *</label>
            <select
              required
              disabled={!!initialData}
              value={formData.employee}
              onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-surface-container-low rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
            >
              <option value="">Select Employee...</option>
              {employees.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.firstName} {e.lastName} ({e.employeeId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-on-surface-variant">Monthly Base Wage ($) *</label>
            <input
              type="number"
              required
              min="0"
              value={formData.wage}
              onChange={(e) => setFormData({ ...formData, wage: Number(e.target.value) })}
              className="w-full mt-1 px-3 py-2 bg-surface-container-low rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-on-surface-variant">Salary Structure *</label>
            <select
              required
              value={formData.salaryStructure}
              onChange={(e) => setFormData({ ...formData, salaryStructure: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-surface-container-low rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select Salary Structure...</option>
              {structures.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-on-surface-variant">Working Schedule</label>
            <select
              value={formData.workingSchedule}
              onChange={(e) => setFormData({ ...formData, workingSchedule: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-surface-container-low rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Choose Schedule...</option>
              {schedules.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.totalWeeklyHours}h/wk)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-on-surface-variant">Start Date *</label>
            <input
              type="date"
              required
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-surface-container-low rounded-xl text-sm outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-on-surface-variant">End Date (Optional / Open-ended)</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-surface-container-low rounded-xl text-sm outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>{initialData ? 'Save Changes' : 'Create Contract'}</Button>
        </div>
      </form>
    </Modal>
  );
};
