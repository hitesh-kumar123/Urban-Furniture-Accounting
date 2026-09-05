import React, { useState, useEffect } from 'react';
import { salaryApi } from '../api/salaryApi';
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

  const [showModal, setShowModal] = useState(false);
  const [editingStructure, setEditingStructure] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    active: true,
    rules: []
  });

  const { hasRole } = useAuth();
  const { showToast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, rRes] = await Promise.all([
        salaryApi.getStructures(),
        salaryApi.getRules()
      ]);

      if (sRes.success) setStructures(sRes.data);
      if (rRes.success) setRules(rRes.data);
    } catch (err) {
      showToast('Failed to load salary structures', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (struct = null) => {
    if (struct) {
      setEditingStructure(struct);
      setFormData({
        name: struct.name,
        code: struct.code,
        description: struct.description || '',
        active: struct.active !== undefined ? struct.active : true,
        rules: struct.rules?.map((r) => r._id || r) || []
      });
    } else {
      setEditingStructure(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        active: true,
        rules: rules.map((r) => r._id)
      });
    }
    setShowModal(true);
  };

  const handleToggleRule = (ruleId) => {
    setFormData((prev) => {
      const current = prev.rules;
      const updated = current.includes(ruleId)
        ? current.filter((id) => id !== ruleId)
        : [...current, ruleId];
      return { ...prev, rules: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      showToast('Name and Code are required', 'warning');
      return;
    }

    try {
      if (editingStructure) {
        const res = await salaryApi.updateStructure(editingStructure._id, formData);
        if (res.success) {
          showToast('Salary structure updated', 'success');
          setShowModal(false);
          fetchData();
        }
      } else {
        const res = await salaryApi.createStructure(formData);
        if (res.success) {
          showToast('Salary structure created', 'success');
          setShowModal(false);
          fetchData();
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this salary structure profile?')) return;
    try {
      const res = await salaryApi.deleteStructure(id);
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
    <div className="p-5 max-w-[1600px] w-full mx-auto flex flex-col gap-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#FF6B3D] font-semibold">
              Payroll Config
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#F5F2EA] tracking-tight font-display">
            Salary Structures ({structures.length})
          </h1>
          <p className="text-xs text-[#A6A3A0] mt-0.5">
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
        <div className="p-10 text-center text-[#6F6C69] font-mono text-xs">
          No salary structures configured.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {structures.map((s) => (
            <div key={s._id} className="midnight-card p-5 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-[#F5F2EA] font-sans">{s.name}</h3>
                      <span className="font-mono text-[10px] text-[#6F6C69] bg-[#17171B] border border-white/10 px-1.5 py-0.2 rounded">
                        {s.code}
                      </span>
                    </div>
                    <p className="text-xs text-[#A6A3A0] mt-1">{s.description || 'Standard compensation tier'}</p>
                  </div>

                  <Badge variant={s.active ? 'success' : 'default'}>
                    {s.active ? 'Active' : 'Disabled'}
                  </Badge>
                </div>

                {/* Attached Rules List */}
                <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                  <span className="text-[10px] font-mono text-[#6F6C69] uppercase tracking-wider block">
                    Attached Rule Bundle ({s.rules?.length || 0} Rules)
                  </span>
                  <div className="flex flex-wrap gap-1.5 font-mono">
                    {s.rules?.map((r) => {
                      const rName = typeof r === 'object' ? r.code || r.name : 'RULE';
                      return (
                        <span
                          key={r._id || r}
                          className="px-2 py-0.5 rounded bg-[#17171B] border border-white/10 text-[11px] text-[#A6A3A0]"
                        >
                          {rName}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {canManage && (
                <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
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
        <form onSubmit={handleSubmit} className="space-y-3 font-mono text-xs">
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
                className="staffora-input"
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
            <div className="max-h-48 overflow-y-auto border border-white/10 rounded divide-y divide-white/5 bg-[#111114]">
              {rules.map((rule) => {
                const isChecked = formData.rules.includes(rule._id);
                return (
                  <div
                    key={rule._id}
                    onClick={() => handleToggleRule(rule._id)}
                    className={`p-2 flex items-center justify-between cursor-pointer ${
                      isChecked ? 'bg-[#17171B]' : 'hover:bg-[#1E1E24]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded text-[#FF6B3D] focus:ring-0 h-3.5 w-3.5 bg-[#0B0B0D] border-white/20"
                      />
                      <span className="text-xs text-[#F5F2EA] font-semibold">{rule.name}</span>
                    </div>
                    <span className="text-[10px] text-[#6F6C69]">
                      [{rule.code}] • Seq: {rule.sequence}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
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
