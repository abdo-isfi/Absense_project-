import api from './api';

const traineeService = {
  // Get all trainees with pagination and filters
  getAllTrainees: async (params) => {
    const response = await api.get('/trainees', { params });
    return response.data;
  },

  // Get trainee by ID
  getTraineeById: async (id) => {
    const response = await api.get(`/trainees/${id}`);
    return response.data;
  },

  // Create trainee
  createTrainee: async (data) => {
    const response = await api.post('/trainees', data);
    return response.data;
  },

  // Update trainee
  updateTrainee: async (id, data) => {
    const response = await api.put(`/trainees/${id}`, data);
    return response.data;
  },

  // Delete trainee
  deleteTrainee: async (id) => {
    const response = await api.delete(`/trainees/${id}`);
    return response.data;
  },

  // Import trainees
  importTrainees: async (trainees) => {
    const response = await api.post('/trainees/import', { trainees });
    return response.data;
  },

  // Get trainees with stats
  getTraineesWithStats: async () => {
    const response = await api.get('/trainees/with-stats');
    return response.data.data; // Return the data array directly
  },

  // Delete all trainees
  deleteAllTrainees: async () => {
    const response = await api.delete('/trainees/delete-all');
    return response.data;
  },
};

export default traineeService;
