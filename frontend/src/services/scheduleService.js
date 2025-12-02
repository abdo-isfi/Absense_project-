import api from './api';

const scheduleService = {
  /**
   * Create a new schedule
   */
  createSchedule: async (scheduleData) => {
    const response = await api.post('/schedules', scheduleData);
    return response.data;
  },

  /**
   * Get all schedules with optional filters
   */
  getAllSchedules: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.teacher) params.append('teacher', filters.teacher);
    if (filters.academicYear) params.append('academicYear', filters.academicYear);
    if (filters.weekNumber) params.append('weekNumber', filters.weekNumber);
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive);

    const response = await api.get(`/schedules?${params.toString()}`);
    return response.data;
  },

  /**
   * Get schedule by teacher ID
   */
  getScheduleByTeacher: async (teacherId, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.academicYear) params.append('academicYear', filters.academicYear);
    if (filters.weekNumber) params.append('weekNumber', filters.weekNumber);

    const response = await api.get(`/schedules/teacher/${teacherId}?${params.toString()}`);
    return response.data;
  },

  /**
   * Get schedule by ID
   */
  getScheduleById: async (id) => {
    const response = await api.get(`/schedules/${id}`);
    return response.data;
  },

  /**
   * Update schedule
   */
  updateSchedule: async (id, scheduleData) => {
    const response = await api.put(`/schedules/${id}`, scheduleData);
    return response.data;
  },

  /**
   * Delete schedule
   */
  deleteSchedule: async (id) => {
    const response = await api.delete(`/schedules/${id}`);
    return response.data;
  },

  /**
   * Check for scheduling conflicts
   */
  checkConflicts: async (sessionData) => {
    const response = await api.post('/schedules/check-conflicts', sessionData);
    return response.data;
  },

  /**
   * Get schedule statistics
   */
  getScheduleStats: async (academicYear) => {
    const params = academicYear ? `?academicYear=${academicYear}` : '';
    const response = await api.get(`/schedules/stats${params}`);
    return response.data;
  },
};

export default scheduleService;
