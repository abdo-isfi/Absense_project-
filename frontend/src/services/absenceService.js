import api from './api';

const absenceService = {
  // Get all absences
  getAll: async (params = {}) => {
    const response = await api.get('/absences', { params });
    return response.data;
  },

  // Get absence by ID
  getById: async (id) => {
    const response = await api.get(`/absences/${id}`);
    return response.data;
  },

  // Create absence record
  create: async (absenceData) => {
    const response = await api.post('/absences', absenceData);
    return response.data;
  },

  // Update absence record
  update: async (id, absenceData) => {
    const response = await api.put(`/absences/${id}`, absenceData);
    return response.data;
  },

  // Delete absence record
  delete: async (id) => {
    const response = await api.delete(`/absences/${id}`);
    return response.data;
  },

  // Validate absences
  validate: async (traineeAbsenceIds, isValidated) => {
    const response = await api.post('/absences/validate', {
      trainee_absence_ids: traineeAbsenceIds,
      is_validated: isValidated,
    });
    return response.data;
  },

  // Validate displayed absences
  validateDisplayed: async (absenceRecordId, isValidated) => {
    const response = await api.post('/absences/validate-displayed', {
      absence_record_id: absenceRecordId,
      is_validated: isValidated,
    });
    return response.data;
  },

  // Justify absences
  justify: async (traineeAbsenceIds, isJustified, comment = '') => {
    const response = await api.post('/absences/justify', {
      trainee_absence_ids: traineeAbsenceIds,
      is_justified: isJustified,
      justification_comment: comment,
    });
    return response.data;
  },

  // Mark billet d'entrée
  markBilletEntree: async (id, hasBilletEntree) => {
    const response = await api.patch(`/absences/${id}/billet-entree`, {
      has_billet_entree: hasBilletEntree,
    });
    return response.data;
  },

  // Update trainee absence
  updateTraineeAbsence: async (id, data) => {
    const response = await api.patch(`/trainee-absences/${id}`, data);
    return response.data;
  },

  // Update specific column
  updateColumn: async (id, column, value) => {
    const response = await api.patch(`/trainee-absences/${id}/update-column`, {
      column,
      value,
    });
    return response.data;
  },

  // Get trainee absences with trainee info
  getWithTraineeInfo: async (params = {}) => {
    const response = await api.get('/trainee-absences-with-trainee', { params });
    return response.data;
  },
};

export default absenceService;
