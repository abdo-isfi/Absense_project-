import api from './api';

const traineeService = {
  // Get all trainees
  getAll: async (params = {}) => {
    const response = await api.get('/trainees', { params });
    return response.data;
  },

  // Get trainees with statistics
  getAllWithStats: async () => {
    const response = await api.get('/trainees/with-stats');
    return response.data;
  },

  // Get trainee by CEF
  getByCef: async (cef) => {
    const response = await api.get(`/trainees/${cef}`);
    return response.data;
  },

  // Create trainee
  create: async (traineeData) => {
    const response = await api.post('/trainees', traineeData);
    return response.data;
  },

  // Update trainee
  update: async (cef, traineeData) => {
    const response = await api.put(`/trainees/${cef}`, traineeData);
    return response.data;
  },

  // Delete trainee
  delete: async (cef) => {
    const response = await api.delete(`/trainees/${cef}`);
    return response.data;
  },

  // Delete all trainees
  deleteAll: async () => {
    const response = await api.delete('/trainees/delete-all');
    return response.data;
  },

  // Get trainee absences
  getAbsences: async (cef) => {
    const response = await api.get(`/trainees/${cef}/absences`);
    return response.data;
  },

  // Get trainee statistics
  getStatistics: async (cef) => {
    const response = await api.get(`/trainees/${cef}/statistics`);
    return response.data;
  },

  // Bulk import trainees
  bulkImport: async (trainees) => {
    const response = await api.post('/trainees/bulk-import', { trainees });
    return response.data;
  },

  // Import trainees from file
  importFromFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/trainees/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default traineeService;
