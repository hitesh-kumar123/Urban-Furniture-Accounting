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
  endTime: '17:00',
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
    if (!day.isWorkingDay) return 0;
    const [startH, startM] = day.startTime.split(':').map(Number);
    const [endH, endM] = day.endTime.split(':').map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;
    const workMin = endMin - startMin - (Number(day.breakMinutes) || 0);
    return workMin > 0 ? workMin / 60 : 0;
  };

  const calculateTotalWeeklyHours = (days) => {
    const total = days.reduce((acc, d) => acc + calculateDayHours(d), 0);
    return Math.round((total + Number.EPSILON) * 100) / 100;
  };

  const handleOpenModal = (sched = null) => {
    if (sched) {
      setEditingSchedule(sched);
      // Ensure all 7 days exist
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
        name: '',
        description: '',
        active: true,
        days: DEFAULT_DAYS
      });
    }
    setShowModal(true);
  };

  const handleDayChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedDays = [...prev.days];
      updatedDays[index] = {
        ...updatedDays[index],
        [field]: value
      };
      return { ...prev, days: updatedDays };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Schedule name is required', 'warning');
      return;
    }

    try {
      if (editingSchedule) {
        const res = await scheduleApi.update(editingSchedule._id, formData);
        if (res.success) {
          showToast('Working schedule updated successfully', 'success');
          setShowModal(false);
          fetchSchedules();
        }
      } else {
        const res = await scheduleApi.create(formData);
        if (res.success) {
          showToast('Working schedule created successfully', 'success');
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
        showToast('Schedule deleted successfully', 'success');
        fetchSchedules();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete schedule', 'error');
    }
  };

  const canManage = hasRole('Admin', 'HR Manager', 'HR Payroll Manager');

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Working Schedules & Shifts</h1>
          <p className="text-sm text-slate-500 mt-1">
            Define standard working hours, shift models, and weekly capacities for payroll time calculation.
          </p>
        </div>
        {canManage && (
          <Button
            variant="primary"
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Schedule
          </Button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Schedules</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">calendar_month</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-on-surface mt-3">{schedules.length}</div>
          <div className="text-xs text-slate-500 mt-1">Standard shift configurations</div>
        </div>

        <div className="bg-surface-container-lowest border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Standard 40h</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <span className="material-symbols-outlined text-[20px]">schedule</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-on-surface mt-3">
            {schedules.filter((s) => s.totalWeeklyHours === 40 && s.active).length}
          </div>
          <div className="text-xs text-emerald-600 mt-1 font-medium">Standard full-time tier</div>
        </div>

        <div className="bg-surface-container-lowest border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Weekly Hours</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <span className="material-symbols-outlined text-[20px]">timer</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-on-surface mt-3">
            {schedules.length > 0
              ? (
                  schedules.reduce((acc, s) => acc + (s.totalWeeklyHours || 0), 0) /
                  schedules.length
                ).toFixed(1)
              : 0}{' '}
            <span className="text-sm font-normal text-slate-500">hrs/wk</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Across all defined shifts</div>
        </div>
      </div>

      {/* Schedules List / Grid */}
      {loading ? (
        <div className="flex justify-center p-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : schedules.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">event_busy</span>
          <h3 className="text-base font-semibold text-slate-700">No Working Schedules Configured</h3>
          <p className="text-sm text-slate-500 mt-1">Create standard working shifts to attach to employee contracts.</p>
          {canManage && (
            <Button variant="primary" onClick={() => handleOpenModal()} className="mt-4">
              Add Working Schedule
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {schedules.map((sched) => {
            const workingDaysCount = sched.days?.filter((d) => d.isWorkingDay).length || 0;
            return (
              <div
                key={sched._id}
                className="bg-surface-container-lowest border border-slate-200/80 hover:border-primary/40 transition-all rounded-2xl p-6 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-on-surface">{sched.name}</h3>
                        <Badge variant={sched.active ? 'success' : 'neutral'}>
                          {sched.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      {sched.description && (
                        <p className="text-xs text-slate-500 mt-1">{sched.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 bg-indigo-50/70 border border-indigo-100 px-3 py-1.5 rounded-xl">
                      <span className="material-symbols-outlined text-primary text-[18px]">timelapse</span>
                      <span className="text-sm font-bold text-primary">
                        {sched.totalWeeklyHours}h <span className="text-xs font-medium text-slate-500">/ week</span>
                      </span>
                    </div>
                  </div>

                  {/* Day-by-Day Shift Breakdown */}
                  <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Weekly Shift Pattern ({workingDaysCount} working days)
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center">
                      {DAYS_OF_WEEK.map((dName) => {
                        const dayData = sched.days?.find((d) => d.day === dName);
                        const isWork = dayData?.isWorkingDay;
                        const hours = dayData ? calculateDayHours(dayData) : 0;
                        return (
                          <div
                            key={dName}
                            className={`p-2 rounded-xl border text-xs flex flex-col items-center justify-center transition-all ${
                              isWork
                                ? 'bg-indigo-50/50 border-indigo-200/60 text-indigo-950 font-medium'
                                : 'bg-slate-50 border-slate-100 text-slate-400'
                            }`}
                          >
                            <span className="text-[10px] font-bold uppercase tracking-tight">
                              {dName.slice(0, 3)}
                            </span>
                            <span className="text-xs font-semibold mt-1">
                              {isWork ? `${hours}h` : 'OFF'}
                            </span>
                            {isWork && (
                              <span className="text-[9px] text-slate-500 mt-0.5 whitespace-nowrap scale-90">
                                {dayData.startTime.slice(0, 5)}-{dayData.endTime.slice(0, 5)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Standard Shift Definition</span>
                  {canManage && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenModal(sched)}
                        className="flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">edit</span>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(sched._id)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Schedule Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingSchedule ? 'Edit Working Schedule' : 'Create Working Schedule'}
        size="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Schedule Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Standard Full-Time 40h (Mon-Fri)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                <span className="ml-3 text-sm font-medium text-slate-700">Schedule Active</span>
              </label>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Description
              </label>
              <input
                type="text"
                placeholder="Optional shift guidelines or contract applicability"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* Weekly Days Configuration Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Shift Days & Hours Configuration
              </span>
              <div className="text-xs font-bold text-primary bg-indigo-50 px-2.5 py-1 rounded-lg">
                Total: {calculateTotalWeeklyHours(formData.days)} hrs/week
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2.5 text-left font-semibold text-slate-600">Day</th>
                    <th className="px-3 py-2.5 text-center font-semibold text-slate-600">Working?</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-slate-600">Start</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-slate-600">End</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-slate-600">Break (mins)</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-slate-600">Day Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {formData.days.map((dayItem, idx) => {
                    const dayHours = calculateDayHours(dayItem);
                    return (
                      <tr
                        key={dayItem.day}
                        className={dayItem.isWorkingDay ? 'hover:bg-slate-50/50' : 'bg-slate-50/40 text-slate-400'}
                      >
                        <td className="px-3 py-2 font-medium text-on-surface">{dayItem.day}</td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={dayItem.isWorkingDay}
                            onChange={(e) => handleDayChange(idx, 'isWorkingDay', e.target.checked)}
                            className="rounded border-slate-300 text-primary focus:ring-primary/20 h-4 w-4"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="time"
                            disabled={!dayItem.isWorkingDay}
                            value={dayItem.startTime}
                            onChange={(e) => handleDayChange(idx, 'startTime', e.target.value)}
                            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs disabled:opacity-40 disabled:bg-slate-100"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="time"
                            disabled={!dayItem.isWorkingDay}
                            value={dayItem.endTime}
                            onChange={(e) => handleDayChange(idx, 'endTime', e.target.value)}
                            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs disabled:opacity-40 disabled:bg-slate-100"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="5"
                            disabled={!dayItem.isWorkingDay}
                            value={dayItem.breakMinutes}
                            onChange={(e) => handleDayChange(idx, 'breakMinutes', Number(e.target.value))}
                            className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs disabled:opacity-40 disabled:bg-slate-100"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-on-surface">
                          {dayItem.isWorkingDay ? `${dayHours}h` : '0h'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
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
