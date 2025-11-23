// Format date for display
export const formatDate = (date, format = 'DD/MM/YYYY') => {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  if (format === 'DD/MM/YYYY') {
    return `${day}/${month}/${year}`;
  }
  if (format === 'YYYY-MM-DD') {
    return `${year}-${month}-${day}`;
  }
  return date;
};

// Format time
export const formatTime = (time) => {
  if (!time) return '';
  return time.substring(0, 5); // HH:mm
};

// Calculate absence hours
export const calculateAbsenceHours = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;
  
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return (endMinutes - startMinutes) / 60;
};

// Get disciplinary status
export const getDisciplinaryStatus = (hours) => {
  if (hours >= 40) return { text: 'EXCL DEF (CD)', color: '#FF0000' };
  if (hours >= 35) return { text: 'EXCL TEMP (CD)', color: '#FF4500' };
  if (hours >= 30) return { text: 'SUSP 2J (CD)', color: '#FF8C00' };
  if (hours >= 25) return { text: 'BLÂME (CD)', color: '#8B4513' };
  if (hours >= 20) return { text: '2ème MISE (CD)', color: '#8e44ad' };
  if (hours >= 15) return { text: '1er MISE (CD)', color: '#9b59b6' };
  if (hours >= 10) return { text: '2ème AVERT (SC)', color: '#0e3a5c' };
  if (hours >= 5) return { text: '1er AVERT (SC)', color: '#235a8c' };
  return { text: 'NORMAL', color: '#9FE855' };
};

// Calculate disciplinary note
export const calculateDisciplinaryNote = (absenceHours, lateCount) => {
  const absenceDeduction = Math.floor(absenceHours / 2.5) * 0.5;
  const lateDeduction = Math.floor(lateCount / 4) * 1;
  const note = Math.max(0, 20 - absenceDeduction - lateDeduction);
  return note.toFixed(1);
};

// Download file
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Handle API error
export const handleApiError = (error) => {
  if (error.response) {
    return error.response.data?.message || 'An error occurred';
  }
  if (error.request) {
    return 'No response from server';
  }
  return error.message || 'An error occurred';
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Group array by key
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {});
};
