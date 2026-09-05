import React, { useState, useEffect } from 'react';
import { scheduleApi } from '../api/scheduleApi';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const SchedulesPage = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  const defaultDays = [
    { day: 'Monday', isWorkingDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
    { day: 'Tuesday', isWorkingDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
    { day: 'Wednesday', isWorkingDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
    { day: 'Thursday', isWorkingDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
    { day: 'Friday', isWorkingDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
    { day: 'Saturday', isWorkingDay: false, startTime: '09:00', endTime: '13:00', breakMinutes: 0 },
    { day: 'Sunday', isWorkingDay: false, startTime: '09:00', endTime: '13:00', breakMinutes: 0 }
  ];

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    weeklyHours: 40,
    active: true,
    days: defaultDays
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
    if (!day.isWorkingDay || !day.startTime || !day.endTime) return 0;
    const [sh, sm] = day.startTime.split(':').map(Number);
    const [eh, em] = day.endTime.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;
    const diff = endMins - startMins - (day.breakMinutes || 0);
    return diff > 0 ? parseFloat((diff / 60).toFixed(1)) : 0;
  };

  const calculateTotalWeeklyHours = (days) => {
    return days.reduce((acc, d) => acc + calculateDayHours(d), 0);
  };

  const handleOpenModal = (sched = null) => {
    setEditingSchedule(sched);
    if (sched) {
      setFormData({
        name: sched.name,
        description: sched.description || '',
        weeklyHours: sched.weeklyHours || 40,
        active: sched.active !== undefined ? sched.active : true,
        days: sched.days && sched.days.length > 0 ? sched.days : defaultDays
      });
    } else {
      setFormData({
        name: '',
        description: '',
        weeklyHours: 40,
        active: true,
        days: defaultDays
      });
    }
    setShowModal(true);
  };

  const handleDayChange = (idx, field, val) => {
    const updated = [...formData.days];
    updated[idx] = { ...updated[idx], [field]: val };
    const newWeekly = calculateTotalWeeklyHours(updated);
    setFormData({
      ...formData,
      days: updated,
      weeklyHours: newWeekly
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSchedule) {
        const res = await scheduleApi.update(editingSchedule._id, formData);
        if (res.success) {
          showToast('Schedule updated successfully', 'success');
          setShowModal(false);
          fetchSchedules();
        }
      } else {
        const res = await scheduleApi.create(formData);
        if (res.success) {
          showToast('Schedule created successfully', 'success');
          setShowModal(false);
          fetchSchedules();
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save schedule', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this working schedule?')) return;
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
    <div className="p-5 max-w-[1600px] w-full mx-auto flex flex-col gap-5 font-body">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E2D9]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-[#0F5C4A] font-semibold">
              Shift Configuration
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-medium text-[#1C1B19]">
            Working Schedules ({schedules.length})
          </h1>
          <p className="text-xs text-[#6B665C] mt-0.5">
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
        <div className="p-10 text-center text-[#6B665C] text-xs">
          No schedules configured.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schedules.map((s) => (
            <div key={s._id} className="bg-white rounded-xl border border-[#E7E2D9] p-5 flex flex-col justify-between gap-4 shadow-sm">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-[#1C1B19]">{s.name}</h3>
                    <p className="text-xs text-[#6B665C] mt-0.5">{s.description || 'Standard shift profile'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[#0F5C4A] bg-[#E8F4F1] border border-[#0F5C4A]/20 px-2 py-0.5 rounded">
                      {s.weeklyHours}h / week
                    </span>
                    <Badge variant={s.active ? 'success' : 'default'}>
                      {s.active ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                </div>

                {/* 7-Day Matrix */}
                <div className="mt-4 pt-3 border-t border-[#E7E2D9] space-y-1 text-xs">
                  {s.days?.map((d) => (
                    <div key={d.day} className="flex items-center justify-between py-1 border-b border-[#E7E2D9]/60">
                      <span className="text-[#1C1B19] font-medium w-24">{d.day}</span>
                      {d.isWorkingDay ? (
                        <span className="text-[#6B665C] font-mono">
                          {d.startTime} → {d.endTime} ({d.breakMinutes}m break)
                        </span>
                      ) : (
                        <span className="text-[#918C82]">Off / Rest</span>
                      )}
                      <span className={`text-xs font-mono font-semibold ${d.isWorkingDay ? 'text-[#0F5C4A]' : 'text-[#918C82]'}`}>
                        {calculateDayHours(d)}h
                      </span>
                    </div>
                  ))}
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
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
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
              <span className="text-xs font-bold text-[#0F5C4A] font-mono">
                Total: {calculateTotalWeeklyHours(formData.days)}h / week
              </span>
            </div>

            <div className="border border-[#E7E2D9] rounded-lg divide-y divide-[#E7E2D9] bg-white">
              {formData.days.map((day, idx) => (
                <div key={day.day} className="p-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 w-28">
                    <input
                      type="checkbox"
                      checked={day.isWorkingDay}
                      onChange={(e) => handleDayChange(idx, 'isWorkingDay', e.target.checked)}
                      className="rounded text-[#0F5C4A] focus:ring-0 h-4 w-4 bg-white border-[#E7E2D9]"
                    />
                    <span className="font-medium text-xs text-[#1C1B19]">{day.day}</span>
                  </div>

                  {day.isWorkingDay ? (
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <input
                        type="time"
                        value={day.startTime}
                        onChange={(e) => handleDayChange(idx, 'startTime', e.target.value)}
                        className="staffora-input py-0.5 px-1.5 w-24 text-center font-mono"
                      />
                      <span className="text-[#6B665C]">→</span>
                      <input
                        type="time"
                        value={day.endTime}
                        onChange={(e) => handleDayChange(idx, 'endTime', e.target.value)}
                        className="staffora-input py-0.5 px-1.5 w-24 text-center font-mono"
                      />
                      <span className="text-xs font-mono text-[#6B665C] w-12 text-right">
                        {calculateDayHours(day)}h
                      </span>
                    </div>
                  ) : (
                    <span className="text-[#918C82] text-xs">Off</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E7E2D9]">
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
