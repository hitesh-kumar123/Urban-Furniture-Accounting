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

  const [formData, setFormData] = useState({
    name: '',
    employee: '',
    wage: 5000,
    salaryStructure: '',
    workingSchedule: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    state: 'Active'
  });

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

  const handleOpenModal = (contract = null) => {
    if (contract) {
      setEditingContract(contract);
      setFormData({
        name: contract.name,
        employee: contract.employee?._id || contract.employee,
        wage: contract.wage,
        salaryStructure: contract.salaryStructure?._id || contract.salaryStructure || (structures[0]?._id || ''),
        workingSchedule: contract.workingSchedule?._id || contract.workingSchedule || (schedules[0]?._id || ''),
        startDate: contract.startDate ? contract.startDate.split('T')[0] : '',
        endDate: contract.endDate ? contract.endDate.split('T')[0] : '',
        state: contract.state || 'Active'
      });
    } else {
      setEditingContract(null);
      setFormData({
        name: `Contract — ${employees[0]?.firstName || 'Staff'}`,
        employee: employees[0]?._id || '',
        wage: 6500,
        salaryStructure: structures[0]?._id || '',
        workingSchedule: schedules[0]?._id || '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        state: 'Active'
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingContract) {
        const res = await contractApi.update(editingContract._id, formData);
        if (res.success) {
          showToast('Contract updated', 'success');
          setShowModal(false);
          fetchData();
        }
      } else {
        const res = await contractApi.create(formData);
        if (res.success) {
          showToast('Contract created', 'success');
          setShowModal(false);
          fetchData();
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this contract record?')) return;
    try {
      const res = await contractApi.delete(id);
      if (res.success) {
        showToast('Contract deleted', 'success');
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

  const canManage = hasRole('Admin', 'HR Manager', 'HR Payroll Manager');

  return (
    <div className="p-5 max-w-[1600px] w-full mx-auto flex flex-col gap-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#FF6B3D] font-semibold">
              Employment Registry
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#F5F2EA] tracking-tight font-display">
            Contracts &amp; Wage Terms ({contracts.length})
          </h1>
          <p className="text-xs text-[#A6A3A0] mt-0.5">
            Base wages, salary structure linkages, shift schedule mappings, and historical terms.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setLookupResult(null);
              setLookupForm({
                employeeId: employees[0]?._id || '',
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0]
              });
              setShowLookupModal(true);
            }}
            icon="search"
          >
            Period Tester
          </Button>

          {canManage && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenModal(null)}
              icon="add"
            >
              New Contract
            </Button>
          )}
        </div>
      </div>

      {/* Contracts Table */}
      <div className="staffora-table-container">
        {loading ? (
          <LoadingSpinner message="Querying active contracts..." />
        ) : contracts.length === 0 ? (
          <div className="p-10 text-center text-[#6F6C69] font-mono text-xs">
            No contract records found.
          </div>
        ) : (
          <table className="staffora-table">
            <thead>
              <tr>
                <th>Contract Reference</th>
                <th>Employee</th>
                <th className="text-right">Monthly Base Wage</th>
                <th>Salary Structure</th>
                <th>Validity Period</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => {
                const empName = c.employee
                  ? typeof c.employee === 'object'
                    ? `${c.employee.firstName || ''} ${c.employee.lastName || ''}`.trim()
                    : 'Employee'
                  : 'Employee';
                const sDate = c.startDate ? new Date(c.startDate).toLocaleDateString() : '—';
                const eDate = c.endDate ? new Date(c.endDate).toLocaleDateString() : 'Indefinite';

                return (
                  <tr key={c._id}>
                    <td>
                      <div className="font-semibold text-[#F5F2EA]">{c.name}</div>
                      <div className="text-[10px] font-mono text-[#6F6C69]">
                        ID: {c._id.slice(-6)}
                      </div>
                    </td>

                    <td>
                      <div className="font-semibold text-[#F5F2EA]">{empName}</div>
                      <div className="text-[10px] font-mono text-[#6F6C69]">
                        {c.employee?.employeeCode || '—'}
                      </div>
                    </td>

                    <td className="text-right font-mono font-bold text-xs text-[#39D98A]">
                      ${Number(c.wage || 0).toLocaleString()}
                    </td>

                    <td className="text-xs font-mono text-[#A6A3A0]">
                      {c.salaryStructure?.name || 'Standard'}
                    </td>

                    <td className="font-mono text-xs text-[#A6A3A0]">
                      {sDate} → {eDate}
                    </td>

                    <td className="font-mono">
                      <Badge variant={c.state === 'Active' ? 'success' : c.state === 'Draft' ? 'default' : 'danger'}>
                        {c.state || 'Active'}
                      </Badge>
                    </td>

                    <td className="text-right">
                      {canManage && (
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleOpenModal(c)}
                            className="p-1 hover:bg-[#17171B] rounded text-[#A6A3A0] hover:text-[#F5F2EA]"
                            title="Edit Contract"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(c._id)}
                            className="p-1 hover:bg-[#FF5C5C]/10 rounded text-[#FF5C5C]"
                            title="Delete Contract"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Contract Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingContract ? 'Edit Employment Contract' : 'New Contract Record'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-3 font-mono text-xs">
          <div>
            <label className="staffora-label">Contract Reference Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="staffora-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="staffora-label">Employee *</label>
              <select
                value={formData.employee}
                onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                className="staffora-input"
                required
              >
                {employees.map((e) => (
                  <option key={e._id} value={e._id}>
                    {e.firstName} {e.lastName} ({e.employeeCode})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="staffora-label">Monthly Base Wage ($) *</label>
              <input
                type="number"
                required
                value={formData.wage}
                onChange={(e) => setFormData({ ...formData, wage: Number(e.target.value) })}
                className="staffora-input font-mono font-bold text-[#39D98A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="staffora-label">Salary Structure *</label>
              <select
                value={formData.salaryStructure}
                onChange={(e) => setFormData({ ...formData, salaryStructure: e.target.value })}
                className="staffora-input"
                required
              >
                {structures.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="staffora-label">Working Schedule</label>
              <select
                value={formData.workingSchedule}
                onChange={(e) => setFormData({ ...formData, workingSchedule: e.target.value })}
                className="staffora-input"
              >
                {schedules.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.weeklyHours}h/wk)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="staffora-label">Start Date *</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="staffora-input"
              />
            </div>
            <div>
              <label className="staffora-label">End Date (Leave blank if ongoing)</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="staffora-input"
              />
            </div>
          </div>

          <div>
            <label className="staffora-label">Contract State</label>
            <select
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="staffora-input"
            >
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Expired">Expired</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingContract ? 'Save Changes' : 'Create Contract'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Applicable Contract Lookup Tester Modal */}
      <Modal
        isOpen={showLookupModal}
        onClose={() => setShowLookupModal(false)}
        title="Period Contract Resolution Tester"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleLookup} className="space-y-3 font-mono text-xs">
          <div>
            <label className="staffora-label">Employee</label>
            <select
              value={lookupForm.employeeId}
              onChange={(e) => setLookupForm({ ...lookupForm, employeeId: e.target.value })}
              className="staffora-input"
              required
            >
              {employees.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.firstName} {e.lastName} ({e.employeeCode})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="staffora-label">Period Start</label>
              <input
                type="date"
                required
                value={lookupForm.startDate}
                onChange={(e) => setLookupForm({ ...lookupForm, startDate: e.target.value })}
                className="staffora-input"
              />
            </div>
            <div>
              <label className="staffora-label">Period End</label>
              <input
                type="date"
                required
                value={lookupForm.endDate}
                onChange={(e) => setLookupForm({ ...lookupForm, endDate: e.target.value })}
                className="staffora-input"
              />
            </div>
          </div>

          <Button variant="primary" type="submit" className="w-full">
            Test Contract Resolution
          </Button>

          {lookupResult && (
            <div className="p-3 bg-[#111114] rounded border border-white/10 space-y-1">
              <span className="text-[10px] text-[#39D98A] uppercase font-bold block">✓ Applicable Contract Resolved</span>
              <div className="font-bold text-[#F5F2EA]">{lookupResult.name}</div>
              <div className="text-[#A6A3A0]">Wage: ${lookupResult.wage}/mo</div>
              <div className="text-[#6F6C69]">Structure: {lookupResult.salaryStructure?.name || 'Standard'}</div>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
};
