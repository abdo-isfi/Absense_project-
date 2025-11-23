import { getDisciplinaryStatus, calculateDisciplinaryNote, calculateTotalAbsenceHours } from '../src/services/absenceCalculator.js';

describe('Absence Calculator Service', () => {
  describe('getDisciplinaryStatus', () => {
    it('should return NORMAL for 0-4 hours', () => {
      const result = getDisciplinaryStatus(3);
      expect(result.text).toBe('NORMAL');
      expect(result.color).toBe('#9FE855');
    });

    it('should return 1er AVERT for 5-9 hours', () => {
      const result = getDisciplinaryStatus(7);
      expect(result.text).toBe('1er AVERT (SC)');
      expect(result.color).toBe('#235a8c');
    });

    it('should return EXCL DEF for 40+ hours', () => {
      const result = getDisciplinaryStatus(45);
      expect(result.text).toBe('EXCL DEF (CD)');
      expect(result.color).toBe('#FF0000');
    });

    it('should handle boundary values correctly', () => {
      expect(getDisciplinaryStatus(5).text).toBe('1er AVERT (SC)');
      expect(getDisciplinaryStatus(10).text).toBe('2ème AVERT (SC)');
      expect(getDisciplinaryStatus(15).text).toBe('1er MISE (CD)');
      expect(getDisciplinaryStatus(20).text).toBe('2ème MISE (CD)');
      expect(getDisciplinaryStatus(25).text).toBe('BLÂME (CD)');
      expect(getDisciplinaryStatus(30).text).toBe('SUSP 2J (CD)');
      expect(getDisciplinaryStatus(35).text).toBe('EXCL TEMP (CD)');
      expect(getDisciplinaryStatus(40).text).toBe('EXCL DEF (CD)');
    });
  });

  describe('calculateDisciplinaryNote', () => {
    it('should calculate note correctly with no absences', () => {
      const note = calculateDisciplinaryNote(0, 0);
      expect(note).toBe(20);
    });

    it('should deduct 0.5 per 2.5 hours of absence', () => {
      const note = calculateDisciplinaryNote(2.5, 0);
      expect(note).toBe(19.5);
    });

    it('should deduct 1 per 4 late arrivals', () => {
      const note = calculateDisciplinaryNote(0, 4);
      expect(note).toBe(19);
    });

    it('should combine absence and lateness deductions', () => {
      const note = calculateDisciplinaryNote(5, 8); // 1 + 2 = 3 points deducted
      expect(note).toBe(17);
    });

    it('should not go below 0', () => {
      const note = calculateDisciplinaryNote(100, 100);
      expect(note).toBe(0);
    });

    it('should round to 1 decimal place', () => {
      const note = calculateDisciplinaryNote(3.7, 2);
      expect(note).toBeCloseTo(19.5, 1);
    });
  });

  describe('calculateTotalAbsenceHours', () => {
    it('should sum validated unjustified absences', () => {
      const absences = [
        { status: 'absent', isJustified: false, absenceHours: 2, isValidated: true },
        { status: 'absent', isJustified: false, absenceHours: 3, isValidated: true },
      ];

      const total = calculateTotalAbsenceHours(absences);
      expect(total).toBe(5);
    });

    it('should ignore justified absences', () => {
      const absences = [
        { status: 'absent', isJustified: true, absenceHours: 2, isValidated: true },
        { status: 'absent', isJustified: false, absenceHours: 3, isValidated: true },
      ];

      const total = calculateTotalAbsenceHours(absences);
      expect(total).toBe(3);
    });

    it('should ignore unvalidated absences', () => {
      const absences = [
        { status: 'absent', isJustified: false, absenceHours: 2, isValidated: false },
        { status: 'absent', isJustified: false, absenceHours: 3, isValidated: true },
      ];

      const total = calculateTotalAbsenceHours(absences);
      expect(total).toBe(3);
    });

    it('should add 1 hour per 4 late arrivals', () => {
      const absences = [
        { status: 'late', isValidated: true },
        { status: 'late', isValidated: true },
        { status: 'late', isValidated: true },
        { status: 'late', isValidated: true },
      ];

      const total = calculateTotalAbsenceHours(absences);
      expect(total).toBe(1);
    });

    it('should handle mixed absences and lates', () => {
      const absences = [
        { status: 'absent', isJustified: false, absenceHours: 2, isValidated: true },
        { status: 'late', isValidated: true },
        { status: 'late', isValidated: true },
        { status: 'late', isValidated: true },
        { status: 'late', isValidated: true },
      ];

      const total = calculateTotalAbsenceHours(absences);
      expect(total).toBe(3); // 2 hours absent + 1 hour for 4 lates
    });

    it('should return 0 for empty array', () => {
      const total = calculateTotalAbsenceHours([]);
      expect(total).toBe(0);
    });
  });
});
