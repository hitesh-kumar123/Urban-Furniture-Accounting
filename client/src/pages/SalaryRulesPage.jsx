import React, { useState, useEffect } from 'react';
import { salaryApi } from '../api/salaryApi';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const SalaryRulesPage = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'Allowances',
    sequence: 10,
    calculationType: 'Percentage',
    fixedAmount: 0,
    percentage: 10,
    percentageBaseRuleCode: 'BASIC',
    formula: '',
    description: '',
    active: true
  });

  const { hasRole } = useAuth();
  const { showToast } = useToast();

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await salaryApi.getRules({
        category: categoryFilter || undefined
      });
      if (res.success) {
        // Sort by sequence ascending
        const sorted = [...res.data].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
        setRules(sorted);
      }
    } catch (err) {
      showToast('Failed to load salary rules', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [categoryFilter]);

  const handleOpenModal = (rule = null) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        name: rule.name,
        code: rule.code,
        category: rule.category,
        sequence: rule.sequence || 10,
        calculationType: rule.calculationType || 'Percentage',
        fixedAmount: rule.fixedAmount || 0,
        percentage: rule.percentage || 0,
        percentageBaseRuleCode: rule.percentageBaseRuleCode || 'BASIC',
        formula: rule.formula || '',
        description: rule.description || '',
        active: rule.active !== undefined ? rule.active : true
      });
    } else {
      setEditingRule(null);
      setFormData({
        name: '',
        code: '',
        category: 'Allowances',
        sequence: (rules.length + 1) * 10,
        calculationType: 'Percentage',
        fixedAmount: 0,
        percentage: 10,
        percentageBaseRuleCode: 'BASIC',
        formula: '',
        description: '',
        active: true
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRule) {
        const res = await salaryApi.updateRule(editingRule._id, formData);
        if (res.success) {
          showToast('Salary rule updated', 'success');
          setShowModal(false);
          fetchRules();
        }
      } else {
        const res = await salaryApi.createRule(formData);
        if (res.success) {
          showToast('Salary rule created', 'success');
          setShowModal(false);
          fetchRules();
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save salary rule', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) return;
    try {
      const res = await salaryApi.deleteRule(id);
      if (res.success) {
        showToast('Rule deleted', 'success');
        fetchRules();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete rule', 'error');
    }
  };

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'Basic':
        return <Badge variant="info">Basic</Badge>;
      case 'Allowances':
        return <Badge variant="success">Allowance</Badge>;
      case 'Gross':
        return <Badge variant="purple">Gross</Badge>;
      case 'Deductions':
        return <Badge variant="danger">Deduction</Badge>;
      case 'Net':
        return <Badge variant="success">Net</Badge>;
      default:
        return <Badge variant="neutral">{cat}</Badge>;
    }
  };

  const canManage = hasRole('Admin', 'HR Payroll Manager');

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Salary Rules & Formula Engine</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure arithmetic computation sequences, statutory tax brackets, percentages, and formulas.
          </p>
        </div>
        {canManage && (
          <Button
            variant="primary"
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            New Rule
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="bg-surface-container-lowest border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {['', 'Basic', 'Allowances', 'Gross', 'Deductions', 'Net'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                categoryFilter === cat
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat || 'All Categories'}
            </button>
          ))}
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-surface-container-lowest border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : rules.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <span className="material-symbols-outlined text-4xl mb-2">functions</span>
            <p className="text-sm font-semibold text-slate-600">No salary rules found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200/80 text-left text-sm">
              <thead className="bg-slate-50/70 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="px-5 py-3.5 text-center">Seq</th>
                  <th className="px-5 py-3.5">Rule Name & Code</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Computation Type</th>
                  <th className="px-5 py-3.5">Value / Formula</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  {canManage && <th className="px-5 py-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {rules.map((rule) => {
                  let valueDisplay = '—';
                  if (rule.calculationType === 'Fixed') {
                    valueDisplay = `$${rule.fixedAmount}`;
                  } else if (rule.calculationType === 'Percentage') {
                    valueDisplay = `${rule.percentage}% of ${rule.percentageBaseRuleCode || 'BASIC'}`;
                  } else if (rule.calculationType === 'Formula') {
                    valueDisplay = rule.formula || 'Custom Formula';
                  }

                  return (
                    <tr key={rule._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4 text-center">
                        <span className="font-mono text-xs font-bold px-2 py-1 bg-slate-100 rounded text-slate-700">
                          {rule.sequence}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-bold text-on-surface text-xs">{rule.name}</div>
                        <div className="font-mono text-[11px] text-primary mt-0.5">{rule.code}</div>
                      </td>

                      <td className="px-5 py-4">{getCategoryBadge(rule.category)}</td>

                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                          {rule.calculationType}
                        </span>
                      </td>

                      <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-700">
                        {valueDisplay}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <Badge variant={rule.active ? 'success' : 'neutral'}>
                          {rule.active ? 'Active' : 'Disabled'}
                        </Badge>
                      </td>

                      {canManage && (
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleOpenModal(rule)}
                              className="text-xs"
                            >
                              Edit
                            </Button>
                            <button
                              onClick={() => handleDelete(rule._id)}
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 text-xs"
                              title="Delete"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Rule Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingRule ? 'Edit Salary Rule' : 'Create Salary Rule'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Rule Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. House Rent Allowance"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Rule Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. HRA"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="Basic">Basic</option>
                <option value="Allowances">Allowances</option>
                <option value="Gross">Gross</option>
                <option value="Deductions">Deductions</option>
                <option value="Net">Net</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Sequence *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.sequence}
                onChange={(e) => setFormData({ ...formData, sequence: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Calculation Type *
              </label>
              <select
                value={formData.calculationType}
                onChange={(e) => setFormData({ ...formData, calculationType: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="Percentage">Percentage</option>
                <option value="Fixed">Fixed Amount</option>
                <option value="Formula">Custom Formula</option>
              </select>
            </div>
          </div>

          {/* Dynamic Configuration based on calculationType */}
          {formData.calculationType === 'Fixed' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Fixed Amount ($) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={formData.fixedAmount}
                onChange={(e) => setFormData({ ...formData, fixedAmount: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}

          {formData.calculationType === 'Percentage' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Percentage (%) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  required
                  value={formData.percentage}
                  onChange={(e) => setFormData({ ...formData, percentage: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Base Rule Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BASIC or GROSS"
                  value={formData.percentageBaseRuleCode}
                  onChange={(e) =>
                    setFormData({ ...formData, percentageBaseRuleCode: e.target.value.toUpperCase() })
                  }
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                />
              </div>
            </div>
          )}

          {formData.calculationType === 'Formula' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Calculation Formula Expression *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. BASIC * 0.12 + HRA * 0.05"
                value={formData.formula}
                onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Use prior rule codes in formula calculation expression.
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description / Statutory Note
            </label>
            <input
              type="text"
              placeholder="e.g. Statutory Provident Fund employee contribution (12% of Basic)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingRule ? 'Save Changes' : 'Create Rule'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
