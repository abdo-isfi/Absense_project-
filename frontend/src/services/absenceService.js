import api from './api';

const absenceService = {
  // Mark absences
  markAbsence: async (data) => {
    const response = await api.post('/absences', data);
    return response.data;
  },

  // Mark absences (alias for compatibility)
  markAbsences: async (data) => {
    const response = await api.post('/absences', data);
    return response.data;
  },

  // Get absences by group name and date
  getGroupAbsencesByName: async (groupName, date) => {
    const response = await api.get(`/groups/${groupName}/absences`, {
      params: { date }
    });
    return response.data;
  },

  // Get absence stats
  getStats: async () => {
    const response = await api.get('/absences/stats');
    return response.data;
  },

  // Get group absences
  getGroupAbsences: async (groupId, date) => {
    const response = await api.get(`/absences/group/${groupId}`, {
      params: { date },
    });
    return response.data;
  },

  // Get all absences
  getAll: async () => {
    const response = await api.get('/absences');
    return response.data;
  },

  // Update trainee absence
  updateTraineeAbsence: async (id, data) => {
    const response = await api.patch(`/trainee-absences/${id}`, data);
    return response.data;
  },

  // Validate displayed absences in bulk
  validateDisplayedAbsences: async (data) => {
    const response = await api.post('/absences/validate-bulk', data);
    return response.data;
  },
};

export default absenceService;
