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

  // Modal State
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
        rules: rules.map((r) => r._id) // by default include all available rules
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
          showToast('Salary structure updated successfully', 'success');
          setShowModal(false);
          fetchData();
        }
      } else {
        const res = await salaryApi.createStructure(formData);
        if (res.success) {
          showToast('Salary structure created successfully', 'success');
          setShowModal(false);
          fetchData();
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save salary structure', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this salary structure?')) return;
    try {
      const res = await salaryApi.deleteStructure(id);
      if (res.success) {
        showToast('Structure deleted', 'success');
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete structure', 'error');
    }
  };

  const canManage = hasRole('Admin', 'HR Payroll Manager');

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Salary Structures</h1>
          <p className="text-sm text-slate-500 mt-1">
            Define multi-tier compensation blueprints, grouping statutory salary rules and pay scales.
          </p>
        </div>
        {canManage && (
          <Button
            variant="primary"
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            New Structure
          </Button>
        )}
      </div>

      {/* Structure Grid */}
      {loading ? (
        <div className="flex justify-center p-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : structures.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">account_tree</span>
          <h3 className="text-base font-semibold text-slate-700">No Salary Structures Defined</h3>
          <p className="text-sm text-slate-500 mt-1">Create structures to bind salary calculation rules together.</p>
          {canManage && (
            <Button variant="primary" onClick={() => handleOpenModal()} className="mt-4">
              Add Structure
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {structures.map((struct) => (
            <div
              key={struct._id}
              className="bg-surface-container-lowest border border-slate-200/80 hover:border-primary/40 transition-all rounded-2xl p-6 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 bg-indigo-50 text-primary border border-indigo-100 rounded-md">
                        {struct.code}
                      </span>
                      <h3 className="text-lg font-bold text-on-surface">{struct.name}</h3>
                      <Badge variant={struct.active ? 'success' : 'neutral'}>
                        {struct.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {struct.description && (
                      <p className="text-xs text-slate-500 mt-1.5">{struct.description}</p>
                    )}
                  </div>
                </div>

                {/* Attached Rules */}
                <div className="mt-5 border-t border-slate-100 pt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <span>Configured Rule Pipeline ({struct.rules?.length || 0} Rules)</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {struct.rules?.map((r) => (
                      <span
                        key={r._id || r}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {r.name || r.code || 'Rule'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Deterministic Calculation Profile</span>
                {canManage && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenModal(struct)}
                      className="flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(struct._id)}
                      className="text-red-600 hover:bg-red-50 flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingStructure ? 'Edit Salary Structure' : 'Create Salary Structure'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Structure Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Standard Executive Structure"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Structure Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. EXEC_STD"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <input
              type="text"
              placeholder="e.g. Full-time professional package including HRA and PF statutory rules"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Select Attached Salary Rules ({formData.rules.length} selected)
            </label>
            <div className="border border-slate-200 rounded-xl p-3 max-h-56 overflow-y-auto space-y-2 bg-slate-50/50">
              {rules.map((rule) => {
                const isSelected = formData.rules.includes(rule._id);
                return (
                  <div
                    key={rule._id}
                    onClick={() => handleToggleRule(rule._id)}
                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-indigo-50/60 border-primary/40 text-primary font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by parent onClick
                        className="rounded text-primary focus:ring-primary h-4 w-4"
                      />
                      <span>
                        {rule.name} <span className="font-mono text-[10px] text-slate-400">({rule.code})</span>
                      </span>
                    </div>
                    <Badge variant={rule.category === 'Allowances' ? 'success' : rule.category === 'Deductions' ? 'danger' : 'neutral'}>
                      {rule.category} • Seq {rule.sequence}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingStructure ? 'Save Changes' : 'Create Structure'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
