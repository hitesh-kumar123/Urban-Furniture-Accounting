import React, { useState, useEffect } from 'react';
import { salaryStructureApi } from '../api/salaryStructureApi';
import { salaryRuleApi } from '../api/salaryRuleApi';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const SalaryStructuresPage = () => {
  const [structures, setStructures] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingStructure, setEditingStructure] = useState(null);

  // Form
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    rules: []
  });

  const { hasRole } = useAuth();
  const { showToast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, rRes] = await Promise.all([
        salaryStructureApi.getAll(),
        salaryRuleApi.getAll()
      ]);
      if (sRes.success) setStructures(sRes.data);
      if (rRes.success) setRules(rRes.data);
    } catch (err) {
      showToast('Failed to load salary structure configs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (struct = null) => {
    setEditingStructure(struct);
    if (struct) {
      setFormData({
        name: struct.name,
        code: struct.code,
        description: struct.description || '',
        rules: struct.rules?.map((r) => (typeof r === 'object' ? r._id : r)) || []
      });
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        rules: rules.map((r) => r._id) // default all
      });
    }
    setShowModal(true);
  };

  const handleToggleRule = (ruleId) => {
    setFormData((prev) => ({
      ...prev,
      rules: prev.rules.includes(ruleId)
        ? prev.rules.filter((id) => id !== ruleId)
        : [...prev.rules, ruleId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStructure) {
        const res = await salaryStructureApi.update(editingStructure._id, formData);
        if (res.success) {
          showToast('Salary structure updated', 'success');
          setShowModal(false);
          fetchData();
        }
      } else {
        const res = await salaryStructureApi.create(formData);
        if (res.success) {
          showToast('Salary structure created', 'success');
          setShowModal(false);
          fetchData();
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save salary structure', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this salary structure profile?')) return;
    try {
      const res = await salaryStructureApi.delete(id);
      if (res.success) {
        showToast('Structure deleted', 'success');
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed', 'error');
    }
  };

  const canManage = hasRole('Admin', 'HR Payroll Manager');

  return (
    <div className="p-5 max-w-[1600px] w-full mx-auto flex flex-col gap-5 font-body">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E2D9]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-[#0F5C4A] font-semibold">
              Payroll Config
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-medium text-[#1C1B19]">
            Salary Structures ({structures.length})
          </h1>
          <p className="text-xs text-[#6B665C] mt-0.5">
            Grouped compensation profiles, rule bundles, and contractual pay packages.
          </p>
        </div>

        {canManage && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenModal(null)}
            icon="add"
          >
            Create Structure
          </Button>
        )}
      </div>

      {/* Structures Grid */}
      {loading ? (
        <LoadingSpinner message="Querying salary structure packages..." />
      ) : structures.length === 0 ? (
        <div className="p-10 text-center text-[#6B665C] text-xs">
          No salary structures configured.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {structures.map((s) => (
            <div key={s._id} className="bg-white rounded-xl border border-[#E7E2D9] p-5 flex flex-col justify-between gap-4 shadow-sm">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-[#1C1B19]">{s.name}</h3>
                      <span className="font-mono text-[11px] text-[#6B665C] bg-[#FAF9F6] border border-[#E7E2D9] px-2 py-0.5 rounded">
                        {s.code}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B665C] mt-0.5">{s.description || 'Standard compensation tier'}</p>
                  </div>

                  <Badge variant={s.active ? 'success' : 'default'}>
                    {s.active ? 'Active' : 'Disabled'}
                  </Badge>
                </div>

                {/* Attached Rules & Employees Metrics */}
                <div className="mt-4 pt-3 border-t border-[#E7E2D9] space-y-2.5">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-[#FAF9F6] border border-[#E7E2D9] flex items-center justify-between">
                      <span className="text-[11px] text-[#6B665C]">Rules Linked</span>
                      <span className="font-bold text-[#1C1B19] font-mono">{s.rulesCount || s.rules?.length || 0} Rules</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#FAF9F6] border border-[#E7E2D9] flex items-center justify-between">
                      <span className="text-[11px] text-[#6B665C]">Active Staff</span>
                      <span className="font-bold text-[#0F5C4A] font-mono">{s.employeeCount || 0} Assigned</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-[#6B665C] font-semibold block mb-1">
                      Rule Sequence Bundle:
                    </span>
                    <div className="flex flex-wrap gap-1.5 font-mono">
                      {s.rules?.map((r) => {
                        const rName = typeof r === 'object' ? r.code || r.name : 'RULE';
                        return (
                          <span
                            key={r._id || r}
                            className="px-2 py-0.5 rounded-md bg-[#FAF9F6] border border-[#E7E2D9] text-[11px] text-[#6B665C]"
                          >
                            {rName}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {canManage && (
                <div className="flex justify-end gap-2 pt-3 border-t border-[#E7E2D9]">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleOpenModal(s)}
                    icon="edit"
                  >
                    Edit Structure
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(s._id)}
                    icon="delete"
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Structure Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingStructure ? 'Edit Salary Structure' : 'Create Salary Structure'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="staffora-label">Structure Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="staffora-input"
                placeholder="e.g. Executive Package"
              />
            </div>
            <div>
              <label className="staffora-label">Structure Code *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="staffora-input font-mono"
                placeholder="e.g. EXEC_TIER"
              />
            </div>
          </div>

          <div>
            <label className="staffora-label">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="staffora-input"
              placeholder="Brief description of this salary profile"
            />
          </div>

          <div className="space-y-1.5">
            <label className="staffora-label">Select Active Salary Rules to Bundle</label>
            <div className="max-h-48 overflow-y-auto border border-[#E7E2D9] rounded-lg divide-y divide-[#E7E2D9] bg-white">
              {rules.map((rule) => {
                const isChecked = formData.rules.includes(rule._id);
                return (
                  <div
                    key={rule._id}
                    onClick={() => handleToggleRule(rule._id)}
                    className={`p-2.5 flex items-center justify-between cursor-pointer ${
                      isChecked ? 'bg-[#E8F4F1]/50' : 'hover:bg-[#FAF9F6]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded text-[#0F5C4A] focus:ring-0 h-4 w-4 bg-white border-[#E7E2D9]"
                      />
                      <span className="text-xs text-[#1C1B19] font-medium">{rule.name}</span>
                    </div>
                    <span className="text-xs font-mono text-[#6B665C]">
                      [{rule.code}] • Seq: {rule.sequence}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E7E2D9]">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingStructure ? 'Save Structure' : 'Create Structure'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
