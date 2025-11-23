import api from './api';

const teacherService = {
  // Get all teachers
  getAll: async () => {
    const response = await api.get('/teachers');
    return response.data;
  },

  // Get teacher by ID
  getById: async (id) => {
    const response = await api.get(`/teachers/${id}`);
    return response.data;
  },

  // Create teacher
  create: async (teacherData) => {
    const response = await api.post('/teachers', teacherData);
    return response.data;
  },

  // Update teacher
  update: async (id, teacherData) => {
    const response = await api.put(`/teachers/${id}`, teacherData);
    return response.data;
  },

  // Delete teacher
  delete: async (id) => {
    const response = await api.delete(`/teachers/${id}`);
    return response.data;
  },

  // Upload teacher schedule
  uploadSchedule: async (id, file) => {
    const formData = new FormData();
    formData.append('schedule', file);
    const response = await api.post(`/teachers/${id}/schedule`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default teacherService;
