import api from './api';

const groupService = {
  // Get all groups
  getAllGroups: async () => {
    try {
      const response = await api.get('/groups');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get single group
  getGroup: async (id) => {
    try {
      const response = await api.get(`/groups/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default groupService;
