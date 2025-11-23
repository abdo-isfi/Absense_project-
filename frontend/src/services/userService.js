import api from './api';
import { USER_ROLES } from '../utils/constants';

const userService = {
  // Get all users (combines admins/SGs and teachers if needed, or separate)
  // For the ManageUsers page, we might want to fetch both or filter by role
  getAllUsers: async (roleFilter = 'all') => {
    try {
      let users = [];
      
      // Fetch Admins & SGs
      if (roleFilter === 'all' || roleFilter === USER_ROLES.ADMIN || roleFilter === USER_ROLES.SG) {
        const response = await api.get('/users');
        if (response.data.success) {
          users = [...users, ...response.data.data];
        }
      }

      // Fetch Teachers
      if (roleFilter === 'all' || roleFilter === USER_ROLES.TEACHER) {
        const response = await api.get('/teachers');
        if (response.data.success) {
          // Normalize teacher data to match user structure if needed
          const teachers = response.data.data.map(t => ({
            _id: t._id,
            name: `${t.firstName} ${t.lastName}`,
            email: t.email,
            role: USER_ROLES.TEACHER,
            status: t.isActive ? 'active' : 'inactive',
            createdAt: t.createdAt,
            groups: t.groups || []
          }));
          users = [...users, ...teachers];
        }
      }

      return users;
    } catch (error) {
      throw error;
    }
  },

  // Create a new user
  createUser: async (userData) => {
    try {
      const isTeacher = userData.role === USER_ROLES.TEACHER;
      const endpoint = isTeacher ? '/teachers' : '/users';
      
      const payload = isTeacher ? {
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        matricule: userData.matricule,
        password: userData.password
      } : {
        name: `${userData.firstName} ${userData.lastName}`,
        email: userData.email,
        password: userData.password,
        role: userData.role
      };

      const response = await api.post(endpoint, payload);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get a single user by ID and Role
  getUserById: async (id, role) => {
    try {
      const endpoint = role === USER_ROLES.TEACHER ? `/teachers/${id}` : `/users/${id}`;
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update a user
  updateUser: async (id, userData, role) => {
    try {
      const endpoint = role === USER_ROLES.TEACHER ? `/teachers/${id}` : `/users/${id}`;
      const response = await api.put(endpoint, userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete a user
  deleteUser: async (id, role) => {
    try {
      const endpoint = role === USER_ROLES.TEACHER ? `/teachers/${id}` : `/users/${id}`;
      const response = await api.delete(endpoint);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default userService;
