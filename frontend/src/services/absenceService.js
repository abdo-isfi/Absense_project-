import api from './api';

const absenceService = {
  // Mark absences
  markAbsence: async (data) => {
    const response = await api.post('/absences', data);
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
};

export default absenceService;
