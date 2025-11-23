// Service for calculating absence-related statistics and scores

/**
 * Calculate disciplinary status based on absence hours
 * @param {Number} hours - Total absence hours
 * @returns {Object} - Status text and color
 */
export const getDisciplinaryStatus = (hours) => {
  if (hours >= 40) return { text: "EXCL DEF (CD)", color: "#FF0000" };
  if (hours >= 35) return { text: "EXCL TEMP (CD)", color: "#FEAE00" };
  if (hours >= 30) return { text: "SUSP 2J (CD)", color: "#FFA500" };
  if (hours >= 25) return { text: "BLÂME (CD)", color: "#8B4513" };
  if (hours >= 20) return { text: "2ème MISE (CD)", color: "#8784b6" };
  if (hours >= 15) return { text: "1er MISE (CD)", color: "#a084c6" };
  if (hours >= 10) return { text: "2ème AVERT (SC)", color: "#191E46" };
  if (hours >= 5) return { text: "1er AVERT (SC)", color: "#235a8c" };
  return { text: "NORMAL", color: "#9FE855" };
};

/**
 * Calculate disciplinary note based on absence hours and late count
 * @param {Number} absenceHours - Total absence hours
 * @param {Number} lateCount - Number of late arrivals
 * @returns {Number} - Disciplinary note (0-20)
 */
export const calculateDisciplinaryNote = (absenceHours, lateCount) => {
  const absenceDeduction = Math.floor(absenceHours / 2.5) * 0.5;
  const latenessDeduction = Math.floor(lateCount / 4) * 1;
  const finalNote = Math.max(0, 20 - absenceDeduction - latenessDeduction);
  return Math.round(finalNote * 10) / 10;
};

/**
 * Calculate total absence hours from absences array
 * @param {Array} absences - Array of absence objects
 * @returns {Number} - Total absence hours
 */
export const calculateTotalAbsenceHours = (absences) => {
  let total = 0;
  let lateCount = 0;

  for (const absence of absences) {
    // Only count validated absences
    if (!(absence.isValidated ?? false)) continue;

    if (absence.status === 'absent' && !absence.isJustified) {
      total += parseFloat(absence.absenceHours || 0);
    } else if (absence.status === 'late') {
      lateCount++;
    }
  }

  // Add hours for late arrivals (4 lates = 1 hour)
  total += Math.floor(lateCount / 4);

  return Math.round(total * 10) / 10;
};
