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
      showToast(err.response?.data?.message || 'Action failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this salary rule formula?')) return;
    try {
      const res = await salaryApi.deleteRule(id);
      if (res.success) {
        showToast('Rule deleted', 'success');
        fetchRules();
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
              Calculation Engine
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#F5F2EA] tracking-tight font-display">
            Salary Rules &amp; Formula Engine
          </h1>
          <p className="text-xs text-[#A6A3A0] mt-0.5">
            Sequential salary computation rules, statutory tax formulas, and deduction tiers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="staffora-input py-1 px-2.5 text-xs w-auto font-mono"
          >
            <option value="">All Categories</option>
            <option value="Basic">Basic Salary</option>
            <option value="Allowances">Allowances</option>
            <option value="Gross">Gross Earnings</option>
            <option value="Deduction">Deductions &amp; Tax</option>
            <option value="Net">Net Disbursal</option>
          </select>

          {canManage && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenModal(null)}
              icon="add"
            >
              Add Rule
            </Button>
          )}
        </div>
      </div>

      {/* Rules Table */}
      <div className="staffora-table-container">
        {loading ? (
          <LoadingSpinner message="Querying rule ASTs and formulas..." />
        ) : rules.length === 0 ? (
          <div className="p-10 text-center text-[#6F6C69] font-mono text-xs">
            No salary rules defined.
          </div>
        ) : (
          <table className="staffora-table font-mono">
            <thead>
              <tr>
                <th className="w-16 text-center">Seq</th>
                <th>Code</th>
                <th>Rule Name</th>
                <th>Category</th>
                <th>Computation Type</th>
                <th>Value / Formula</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => {
                const isDeduction = rule.category === 'Deduction';
                return (
                  <tr key={rule._id}>
                    <td className="text-center font-bold text-[#FF8A65]">
                      {rule.sequence}
                    </td>

                    <td>
                      <span className="font-bold text-[#F5F2EA] bg-[#17171B] border border-white/10 px-1.5 py-0.5 rounded text-xs">
                        {rule.code}
                      </span>
                    </td>

                    <td className="font-sans font-semibold text-xs text-[#F5F2EA]">
                      {rule.name}
                    </td>

                    <td>
                      <span className="text-xs text-[#A6A3A0]">
                        {rule.category}
                      </span>
                    </td>

                    <td className="text-xs text-[#A6A3A0]">
                      {rule.calculationType}
                    </td>

                    <td className="text-xs">
                      {rule.calculationType === 'Fixed' ? (
                        <span className="text-[#39D98A] font-bold">₹{Number(rule.fixedAmount || 0).toLocaleString('en-IN')}</span>
                      ) : rule.calculationType === 'Percentage' ? (
                        <span className="text-[#58B7FF] font-bold">{rule.percentage}% of {rule.percentageBaseRuleCode || 'BASIC'}</span>
                      ) : (
                        <span className="text-[#FF8A65] font-bold">{rule.formula}</span>
                      )}
                    </td>

                    <td>
                      <Badge variant={rule.active ? 'success' : 'default'}>
                        {rule.active ? 'Active' : 'Disabled'}
                      </Badge>
                    </td>

                    <td className="text-right font-sans">
                      {canManage && (
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleOpenModal(rule)}
                            className="p-1 hover:bg-[#17171B] rounded text-[#A6A3A0] hover:text-[#F5F2EA]"
                            title="Edit Rule"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(rule._id)}
                            className="p-1 hover:bg-[#FF5C5C]/10 rounded text-[#FF5C5C]"
                            title="Delete Rule"
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

      {/* Add / Edit Salary Rule Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingRule ? 'Edit Calculation Rule' : 'New Salary Rule Formula'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-3 font-mono text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="staffora-label">Rule Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="staffora-input"
                placeholder="e.g. Provident Fund"
              />
            </div>
            <div>
              <label className="staffora-label">Rule Code *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="staffora-input"
                placeholder="e.g. PF_DED"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="staffora-label">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="staffora-input"
              >
                <option value="Basic">Basic Salary</option>
                <option value="Allowances">Allowances</option>
                <option value="Gross">Gross Earnings</option>
                <option value="Deduction">Deduction / Tax</option>
                <option value="Net">Net Disbursal</option>
              </select>
            </div>
            <div>
              <label className="staffora-label">Execution Sequence *</label>
              <input
                type="number"
                required
                value={formData.sequence}
                onChange={(e) => setFormData({ ...formData, sequence: Number(e.target.value) })}
                className="staffora-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="staffora-label">Calculation Type *</label>
              <select
                value={formData.calculationType}
                onChange={(e) => setFormData({ ...formData, calculationType: e.target.value })}
                className="staffora-input"
              >
                <option value="Percentage">Percentage Base</option>
                <option value="Fixed">Fixed Amount</option>
                <option value="Formula">Custom Formula Expression</option>
              </select>
            </div>
            {formData.calculationType === 'Fixed' && (
              <div>
                <label className="staffora-label">Fixed Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={formData.fixedAmount}
                  onChange={(e) => setFormData({ ...formData, fixedAmount: Number(e.target.value) })}
                  className="staffora-input"
                />
              </div>
            )}
            {formData.calculationType === 'Percentage' && (
              <div>
                <label className="staffora-label">Percentage (%) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.percentage}
                  onChange={(e) => setFormData({ ...formData, percentage: Number(e.target.value) })}
                  className="staffora-input"
                />
              </div>
            )}
          </div>

          {formData.calculationType === 'Percentage' && (
            <div>
              <label className="staffora-label">Percentage Base Code (e.g. BASIC, GROSS)</label>
              <input
                type="text"
                value={formData.percentageBaseRuleCode}
                onChange={(e) => setFormData({ ...formData, percentageBaseRuleCode: e.target.value.toUpperCase() })}
                className="staffora-input"
              />
            </div>
          )}

          {formData.calculationType === 'Formula' && (
            <div>
              <label className="staffora-label">Formula Expression * (e.g. BASIC * 0.4 + HRA)</label>
              <input
                type="text"
                required
                value={formData.formula}
                onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
                className="staffora-input font-mono"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingRule ? 'Save Rule' : 'Create Rule'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
