// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  SG: 'sg',
  TEACHER: 'teacher',
};

// Absence Status
export const ABSENCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
};

// Disciplinary Status Colors
export const DISCIPLINARY_COLORS = {
  NORMAL: '#9FE855',
  FIRST_WARNING: '#235a8c',
  SECOND_WARNING: '#0e3a5c',
  FIRST_NOTICE: '#9b59b6',
  SECOND_NOTICE: '#8e44ad',
  BLAME: '#8B4513',
  SUSPENSION: '#FF8C00',
  TEMP_EXCLUSION: '#FF4500',
  PERMANENT_EXCLUSION: '#FF0000',
};

// Routes
export const ROUTES = {
  LOGIN: '/login',
  TEACHER: {
    DASHBOARD: '/teacher/menu',
    SCHEDULE: '/teacher/emploi-du-temps',
    ABSENCE: '/teacher/gerer-absence',
  },
  SG: {
    MENU: '/sg/menu',
    DASHBOARD: '/sg/dashboard',
    MANAGE_TRAINEES: '/sg/gerer-stagiaires',
    TRAINEES_LIST: '/sg/trainees-list',
    MANAGE_TEACHERS: '/sg/gerer-formateurs',
    ABSENCE: '/sg/absence',
    EXPORT: '/sg/export',
  },
  ADMIN: {
    DASHBOARD: '/admin/menu',
    ADD_USER: '/admin/ajouter',
    MANAGE_USERS: '/admin/gerer',
    EDIT_USER: '/admin/edit/:id',
    SETTINGS: '/admin/parametres',
  },
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  CURRENT_USER: 'currentUser',
  USER_ROLE: 'userRole',
  IS_AUTHENTICATED: 'isAuthenticated',
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  API: 'YYYY-MM-DD',
  DATETIME: 'DD/MM/YYYY HH:mm',
};
