import React, { useState, useEffect } from 'react';
import { scheduleApi } from '../api/scheduleApi';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

const DEFAULT_DAYS = DAYS_OF_WEEK.map((day) => ({
  day,
  isWorkingDay: ['Saturday', 'Sunday'].includes(day) ? false : true,
  startTime: '09:00',
  endTime: '18:00',
  breakMinutes: 60
}));

export const SchedulesPage = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    active: true,
    days: DEFAULT_DAYS
  });

  const { hasRole } = useAuth();
  const { showToast } = useToast();

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const res = await scheduleApi.getAll();
      if (res.success) {
        setSchedules(res.data);
      }
    } catch (err) {
      showToast('Failed to load working schedules', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const calculateDayHours = (day) => {
    if (!day || !day.isWorkingDay || !day.startTime || !day.endTime) return 0;
    try {
      const [startH, startM] = (day.startTime || '09:00').split(':').map(Number);
      const [endH, endM] = (day.endTime || '17:00').split(':').map(Number);
      const startMin = (startH || 0) * 60 + (startM || 0);
      const endMin = (endH || 0) * 60 + (endM || 0);
      const workMin = endMin - startMin - (Number(day.breakMinutes) || 0);
      return workMin > 0 ? workMin / 60 : 0;
    } catch (e) {
      return 0;
    }
  };

  const calculateTotalWeeklyHours = (days) => {
    const total = days.reduce((acc, d) => acc + calculateDayHours(d), 0);
    return Math.round((total + Number.EPSILON) * 100) / 100;
  };

  const handleOpenModal = (sched = null) => {
    if (sched) {
      setEditingSchedule(sched);
      const completeDays = DAYS_OF_WEEK.map((dName) => {
        const found = sched.days.find((d) => d.day === dName);
        return (
          found || {
            day: dName,
            isWorkingDay: false,
            startTime: '09:00',
            endTime: '17:00',
            breakMinutes: 60
          }
        );
      });
      setFormData({
        name: sched.name,
        description: sched.description || '',
        active: sched.active !== undefined ? sched.active : true,
        days: completeDays
      });
    } else {
      setEditingSchedule(null);
      setFormData({
        name: 'Standard Full-Time (40h/wk)',
        description: 'Monday to Friday, 9:00 AM - 5:00 PM',
        active: true,
        days: DEFAULT_DAYS
      });
    }
    setShowModal(true);
  };

  const handleDayChange = (index, field, value) => {
    const updatedDays = [...formData.days];
    updatedDays[index] = { ...updatedDays[index], [field]: value };
    setFormData({ ...formData, days: updatedDays });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      weeklyHours: calculateTotalWeeklyHours(formData.days)
    };

    try {
      if (editingSchedule) {
        const res = await scheduleApi.update(editingSchedule._id, payload);
        if (res.success) {
          showToast('Schedule updated', 'success');
          setShowModal(false);
          fetchSchedules();
        }
      } else {
        const res = await scheduleApi.create(payload);
        if (res.success) {
          showToast('Schedule created', 'success');
          setShowModal(false);
          fetchSchedules();
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this working schedule?')) return;
    try {
      const res = await scheduleApi.delete(id);
      if (res.success) {
        showToast('Schedule deleted', 'success');
        fetchSchedules();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed', 'error');
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
              Shift Configuration
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#F5F2EA] tracking-tight font-display">
            Working Schedules ({schedules.length})
          </h1>
          <p className="text-xs text-[#A6A3A0] mt-0.5">
            Shift windows, weekly contractual hours, and automatic attendance overtime thresholds.
          </p>
        </div>

        {canManage && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenModal(null)}
            icon="add"
          >
            New Schedule
          </Button>
        )}
      </div>

      {/* Schedules Grid */}
      {loading ? (
        <LoadingSpinner message="Scanning working schedules..." />
      ) : schedules.length === 0 ? (
        <div className="p-10 text-center text-[#6F6C69] font-mono text-xs">
          No schedules configured.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schedules.map((s) => (
            <div key={s._id} className="midnight-card p-5 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-[#F5F2EA] font-sans">{s.name}</h3>
                    <p className="text-xs text-[#A6A3A0] mt-1">{s.description || 'Standard shift profile'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[#39D98A] bg-[#39D98A]/10 border border-[#39D98A]/20 px-2 py-0.5 rounded">
                      {s.weeklyHours}h / week
                    </span>
                    <Badge variant={s.active ? 'success' : 'default'}>
                      {s.active ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                </div>

                {/* 7-Day Matrix */}
                <div className="mt-4 pt-3 border-t border-white/10 space-y-1 font-mono text-xs">
                  {s.days?.map((d) => (
                    <div key={d.day} className="flex items-center justify-between py-1 border-b border-white/5">
                      <span className="font-sans text-[#F5F2EA] w-24">{d.day}</span>
                      {d.isWorkingDay ? (
                        <span className="text-[#A6A3A0]">
                          {d.startTime} → {d.endTime} ({d.breakMinutes}m break)
                        </span>
                      ) : (
                        <span className="text-[#6F6C69]">Off / Rest</span>
                      )}
                      <span className={`text-[11px] font-bold ${d.isWorkingDay ? 'text-[#FF8A65]' : 'text-[#6F6C69]'}`}>
                        {calculateDayHours(d)}h
                      </span>
                    </div>
                  ))}
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
                    Edit Schedule
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

      {/* Schedule Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingSchedule ? 'Edit Working Schedule' : 'New Working Schedule'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div>
            <label className="staffora-label">Schedule Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="staffora-input"
            />
          </div>

          <div>
            <label className="staffora-label">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="staffora-input"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="staffora-label mb-0">7-Day Shift Matrix</label>
              <span className="text-xs font-bold text-[#39D98A]">
                Total: {calculateTotalWeeklyHours(formData.days)}h / week
              </span>
            </div>

            <div className="border border-white/10 rounded divide-y divide-white/5 bg-[#111114]">
              {formData.days.map((day, idx) => (
                <div key={day.day} className="p-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 w-28">
                    <input
                      type="checkbox"
                      checked={day.isWorkingDay}
                      onChange={(e) => handleDayChange(idx, 'isWorkingDay', e.target.checked)}
                      className="rounded text-[#FF6B3D] focus:ring-0 h-3.5 w-3.5 bg-[#0B0B0D] border-white/20"
                    />
                    <span className="font-sans font-semibold text-xs text-[#F5F2EA]">{day.day}</span>
                  </div>

                  {day.isWorkingDay ? (
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <input
                        type="time"
                        value={day.startTime}
                        onChange={(e) => handleDayChange(idx, 'startTime', e.target.value)}
                        className="staffora-input py-0.5 px-1.5 w-24 text-center"
                      />
                      <span className="text-[#6F6C69]">→</span>
                      <input
                        type="time"
                        value={day.endTime}
                        onChange={(e) => handleDayChange(idx, 'endTime', e.target.value)}
                        className="staffora-input py-0.5 px-1.5 w-24 text-center"
                      />
                      <span className="text-[10px] text-[#A6A3A0] w-12 text-right">
                        {calculateDayHours(day)}h
                      </span>
                    </div>
                  ) : (
                    <span className="text-[#6F6C69] text-xs">Off</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingSchedule ? 'Save Changes' : 'Create Schedule'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
