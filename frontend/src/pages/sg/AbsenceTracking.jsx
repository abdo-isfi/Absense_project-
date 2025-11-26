import { useState, useEffect } from 'react';
import { CalendarIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Loader from '../../components/ui/Loader';
import groupService from '../../services/groupService';
import traineeService from '../../services/traineeService';
import absenceService from '../../services/absenceService';
import { handleApiError } from '../../utils/helpers';
import ActionButtons from '../../components/sg/ActionButtons';
import ConfirmationModal from '../../components/sg/ConfirmationModal';
import JustificationModal from '../../components/sg/JustificationModal';
import EditAbsenceModal from '../../components/sg/EditAbsenceModal';
import TraineeAbsenceDetailModal from '../../components/sg/TraineeAbsenceDetailModal';

// Helper Functions
const calculateAbsenceHours = (absences) => {
  if (!Array.isArray(absences)) return 0;

  let totalHours = 0;
  let lateCount = 0;

  for (const absence of absences) {
    if (!absence) continue;
    if (absence.is_validated !== true) continue;

    const status = absence.status || absence.absence_status || absence.type;
    const isJustified = absence.is_justified || absence.justified || false;

    if (status === 'absent' && !isJustified) {
      const hours = Number(absence.absence_hours || absence.hours || absence.duration) || 5;
      totalHours += hours;
    } else if (status === 'late' || status === 'retard') {
      lateCount++;
    }
  }

  totalHours += Math.floor(lateCount / 4);
  return Math.round(totalHours * 10) / 10;
};

const getTraineeStatus = (hours) => {
  const h = Math.round(hours * 10) / 10;
  if (h >= 40) return { text: 'EXCL DEF (CD)', color: '#FF0000' };
  if (h >= 35) return { text: 'EXCL TEMP (CD)', color: '#FEAE00' };
  if (h >= 30) return { text: 'SUSP 2J (CD)', color: '#FFA500' };
  if (h >= 25) return { text: 'BLÂME (CD)', color: '#8B4513' };
  if (h >= 20) return { text: '2ème MISE (CD)', color: '#8784b6' };
  if (h >= 15) return { text: '1er MISE (CD)', color: '#a084c6' };
  if (h >= 10) return { text: '2ème AVERT (SC)', color: '#191E46' };
  if (h >= 5) return { text: '1er AVERT (SC)', color: '#235a8c' };
  return { text: 'NORMAL', color: '#9FE855' };
};

const calculateDisciplinaryNote = (absences) => {
  if (!Array.isArray(absences)) return 20;

  let absenceHours = 0;
  let lateCount = 0;

  for (const absence of absences) {
    if (!absence || absence.is_validated !== true) continue;

    if (absence.status === 'absent' && !absence.is_justified) {
      const hours = Number(absence.absence_hours) || 0;
      absenceHours += hours;
    } else if (absence.status === 'late') {
      lateCount++;
    }
  }

  const absencePoints = Math.floor(absenceHours / 5);
  const latePoints = Math.floor(lateCount / 4);
  const totalPoints = absencePoints + latePoints;

  return Math.max(0, 20 - totalPoints);
};

const prepareAbsenceCalendar = (absences) => {
  const calendarData = {};

  if (!absences || absences.length === 0) {
    return calendarData;
  }

  absences.forEach((absence) => {
    const dateField = absence.date || absence.absence_date || absence.recorded_date || absence.start_date;
    if (!dateField) return;

    const date = new Date(dateField);
    const dateString = date.toISOString().split('T')[0];

    let status = 'present';
    if (absence.status === 'absent') {
      status = absence.is_justified ? 'justified' : 'absent';
    } else if (absence.status === 'late') {
      status = 'late';
    }

    calendarData[dateString] = status;
  });

  return calendarData;
};

const getDayOfWeek = (dateString) => {
  if (!dateString) return '';
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return days[date.getDay()];
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR');
};

const AbsenceTracking = () => {
  // Data State
  const [absenceRecords, setAbsenceRecords] = useState([]);
  const [flattenedAbsences, setFlattenedAbsences] = useState([]);
  const [studentAbsences, setStudentAbsences] = useState({});
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [trainees, setTrainees] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [groupsData, setGroupsData] = useState([]);

  // Loading & Error State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filter State - Temporary (before applying)
  const [tempFilterGroup, setTempFilterGroup] = useState('');
  const [tempFilterDate, setTempFilterDate] = useState('');
  const [tempStatusFilter, setTempStatusFilter] = useState('all');
  const [tempJustifiedFilter, setTempJustifiedFilter] = useState('all');
  const [tempSearchTerm, setTempSearchTerm] = useState('');
  const [tempGroupDates, setTempGroupDates] = useState([]);
  const [tempValidatedDates, setTempValidatedDates] = useState([]);
  const [tempDayOfWeek, setTempDayOfWeek] = useState('');

  // Filter State - Applied (after clicking "Filtrer")
  const [filterGroup, setFilterGroup] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [justifiedFilter, setJustifiedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [groupDates, setGroupDates] = useState([]);
  const [validatedDates, setValidatedDates] = useState([]);
  const [dayOfWeek, setDayOfWeek] = useState('');
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [sessionHoraire, setSessionHoraire] = useState('');

  // Modal State
  const [selectedTrainee, setSelectedTrainee] = useState(null);
  const [traineeAbsences, setTraineeAbsences] = useState([]);
  const [showAbsenceDetailModal, setShowAbsenceDetailModal] = useState(false);
  const [editingAbsence, setEditingAbsence] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAbsenceForJustification, setSelectedAbsenceForJustification] = useState(null);
  const [showJustificationModal, setShowJustificationModal] = useState(false);
  const [showBulkConfirmation, setShowBulkConfirmation] = useState(false);
  const [bulkConfirmationData, setBulkConfirmationData] = useState(null);
  const [bulkValidating, setBulkValidating] = useState(false);

  // Initialize data on mount
  useEffect(() => {
    const initializeData = async () => {
      await loadTraineesData();
      await loadAbsenceData();
      await loadGroups();
    };
    initializeData();
  }, []);

  // Update filtered records when filters change
  useEffect(() => {
    if (filtersApplied) {
      const filtered = filterAbsences();
      setFilteredRecords(filtered);
    }
  }, [filterGroup, filterDate, statusFilter, justifiedFilter, searchTerm, filtersApplied, flattenedAbsences]);

  const loadAbsenceData = async () => {
    try {
      setLoading(true);
      const response = await absenceService.getAll();
      const records = response.data || [];

      setAbsenceRecords(records);

      // Flatten nested trainee_absences structure
      const flattened = [];
      records.forEach((record) => {
        if (record.trainee_absences && Array.isArray(record.trainee_absences)) {
          record.trainee_absences.forEach((traineeAbsence) => {
            if (!traineeAbsence) return;
            
            const processedAbsence = {
              id: traineeAbsence.id,
              trainee_id: traineeAbsence.trainee_id,
              absence_record_id: traineeAbsence.absence_record_id,
              status: traineeAbsence.status || '',
              is_validated: traineeAbsence.is_validated || false,
              is_justified: traineeAbsence.is_justified || false,
              has_billet_entree: traineeAbsence.has_billet_entree || false,
              absence_hours: traineeAbsence.absence_hours || 0,
              justification_comment: traineeAbsence.justification_comment || '',
              date: record.date,
              start_time: record.startTime || record.start_time,
              end_time: record.endTime || record.end_time,
              group_id: record.groupId || record.group_id,
              teacher_id: record.teacherId || record.teacher_id,
              cef: traineeAbsence.trainee?.cef || traineeAbsence.trainee?.CEF,
              trainee_name: traineeAbsence.trainee?.name || traineeAbsence.trainee?.NOM,
              trainee_first_name: traineeAbsence.trainee?.firstName || traineeAbsence.trainee?.first_name || traineeAbsence.trainee?.PRENOM,
              groupe: record.group?.name || record.groupId?.name || record.group?.code || '',
              teacher_name: record.teacher?.firstName && record.teacher?.lastName
                ? `${record.teacher.firstName} ${record.teacher.lastName}`
                : record.teacherId?.firstName && record.teacherId?.lastName
                ? `${record.teacherId.firstName} ${record.teacherId.lastName}`
                : record.teacher?.first_name && record.teacher?.last_name
                ? `${record.teacher.first_name} ${record.teacher.last_name}`
                : record.teacherId?.first_name && record.teacherId?.last_name
                ? `${record.teacherId.first_name} ${record.teacherId.last_name}`
                : record.teacher?.name || record.teacherId?.name || 'Non assigné',
            };
            flattened.push(processedAbsence);
          });
        }
      });

      flattened.sort((a, b) => new Date(b.date) - new Date(a.date));
      setFlattenedAbsences(flattened);

      // Group absences by CEF
      const studentAbsencesMap = {};
      flattened.forEach((absence) => {
        if (absence && absence.cef) {
          if (!studentAbsencesMap[absence.cef]) {
            studentAbsencesMap[absence.cef] = [];
          }
          studentAbsencesMap[absence.cef].push(absence);
        }
      });
      setStudentAbsences(studentAbsencesMap);

      setLoading(false);
    } catch (e) {
      console.error('Error loading absence data:', e);
      setError('Une erreur est survenue lors du chargement des données d\'absence');
      setLoading(false);
    }
  };

  const loadTraineesData = async () => {
    try {
      const response = await traineeService.getAllTrainees({ limit: 1000 });
      const traineesData = response.data || [];
      setTrainees(traineesData);
    } catch (e) {
      console.error('Error loading trainees data:', e);
    }
  };

  const loadGroups = async () => {
    try {
      const data = await groupService.getAllGroups();
      setGroupsData(data);
      const groupNames = data.map((group) => group.name).filter(Boolean);
      setAvailableGroups(groupNames.sort());
    } catch (e) {
      console.error('Error loading groups data:', e);
    }
  };

  const loadGroupAbsences = async (groupName) => {
    try {
      const response = await absenceService.getGroupAbsences(groupName);
      const groupAbsences = response.data || [];

      const dates = [...new Set(
        groupAbsences
          .filter((record) => record.trainee_absences && record.trainee_absences.length > 0)
          .map((record) => record.date)
      )].sort();

      setTempGroupDates(dates);

      const validatedDates = [];
      groupAbsences.forEach((record) => {
        if (record.trainee_absences && record.trainee_absences.length > 0) {
          const allAbsencesValidated = record.trainee_absences.every((ta) => ta.is_validated);
          if (allAbsencesValidated) {
            validatedDates.push(record.date);
          }
        }
      });

      setTempValidatedDates([...new Set(validatedDates)]);
    } catch (error) {
      console.error('Error loading group absences:', error);
      setTempGroupDates([]);
      setTempValidatedDates([]);
    }
  };

  const getTraineeData = (cef) => {
    if (!Array.isArray(trainees)) {
      return { name: 'Chargement...', first_name: '', class: 'Chargement...' };
    }

    return trainees.find((t) => t.cef === cef || t.CEF === cef) || {
      name: 'Inconnu',
      first_name: '',
      class: 'Inconnu',
      cef: cef || 'Inconnu',
    };
  };

  const filterAbsences = () => {
    if (!filterGroup) {
      return [];
    }

    // Get all trainees for the selected group
    const groupTrainees = trainees.filter(t => t.groupe === filterGroup);

    // If no date is selected, we can't show "present" status meaningfully for a specific day
    // So we fall back to showing recent absences or just the list of trainees
    if (!filterDate) {
      // Show all trainees for the selected group with present status if no absence record
      const combinedNoDate = groupTrainees.map(trainee => {
        const cef = trainee.cef || trainee.CEF;
        // Find most recent absence for this trainee in the selected group
        const recentAbsence = flattenedAbsences
          .filter(a => a.groupe === filterGroup && (a.cef === cef))
          .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        if (recentAbsence) {
          return recentAbsence;
        }
        // No absence record, create a present placeholder
        return {
          id: `temp_${cef}_present`,
          trainee_id: trainee._id,
          cef,
          trainee_name: trainee.name || trainee.NOM || '',
          trainee_first_name: trainee.first_name || trainee.PRENOM || '',
          groupe: filterGroup,
          date: '',
          status: 'present',
          is_validated: true,
          is_justified: false,
          absence_hours: 0,
          start_time: '',
          end_time: '',
          teacher_name: ''
        };
      });
      return combinedNoDate;
    }

    // DATE SELECTED: Show ALL trainees for that group on that date
    const recordsForDate = flattenedAbsences.filter(
      (absence) => absence.groupe === filterGroup && absence.date === filterDate
    );

    // Create a map of absences for quick lookup
    const absenceMap = {};
    recordsForDate.forEach(record => {
      if (record.cef) {
        absenceMap[record.cef] = record;
      }
    });

    // Merge trainees with absences
    let combinedRecords = groupTrainees.map(trainee => {
      const absenceRecord = absenceMap[trainee.cef];
      
      if (absenceRecord) {
        return absenceRecord;
      }

      // Create a "Present" record for trainees without absence
        return {
          id: `temp_${trainee._id}_${filterDate}`,
          trainee_id: trainee._id,
          cef: trainee.cef || trainee.CEF,
          trainee_name: trainee.name || trainee.NOM || '',
          trainee_first_name: trainee.firstName || trainee.first_name || trainee.PRENOM || '',
          groupe: filterGroup,
          date: filterDate,
          status: 'present',
          is_validated: true,
          is_justified: false,
          absence_hours: 0,
          start_time: '',
          end_time: '',
          teacher_name: ''
        };
    });

    // Apply secondary filters (Status, Justification, Search)
    if (statusFilter !== 'all') {
      combinedRecords = combinedRecords.filter(r => r.status === statusFilter);
    }

    if (justifiedFilter !== 'all') {
      if (justifiedFilter === 'justified') {
        combinedRecords = combinedRecords.filter(r => r.is_justified === true);
      } else if (justifiedFilter === 'not_justified') {
        combinedRecords = combinedRecords.filter(r => r.is_justified === false && r.status !== 'present');
      }
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      combinedRecords = combinedRecords.filter(r => {
        const name = r.trainee_name || r.name || '';
        const firstName = r.trainee_first_name || r.firstName || '';
        const cef = r.cef || '';
        return (
          name.toLowerCase().includes(term) ||
          firstName.toLowerCase().includes(term) ||
          cef.toString().toLowerCase().includes(term)
        );
      });
    }

    return combinedRecords;
  };

  const getAbsenceStats = () => {
    const filtered = filterAbsences();
    const totalAbsent = filtered.filter((absence) => absence && absence.status === 'absent').length;
    const totalLate = filtered.filter((absence) => absence && absence.status === 'late').length;
    const totalPresent = filtered.filter((absence) => absence && absence.status === 'present').length;

    return { totalAbsent, totalLate, totalPresent };
  };

  const stats = getAbsenceStats();

  const getTeacherForGroup = () => {
    if (!filterGroup || !filterDate) return 'Non assigné';

    const filtered = filterAbsences();
    if (filtered.length > 0) {
      const firstAbsence = filtered[0];
      if (firstAbsence.teacher_name && firstAbsence.teacher_name !== 'Non assigné') {
        return firstAbsence.teacher_name;
      }
    }

    if (groupsData.length > 0) {
      const group = groupsData.find((g) => g.name === filterGroup);
      if (group && group.teacher) {
        if (group.teacher.first_name && group.teacher.last_name) {
          return `${group.teacher.first_name} ${group.teacher.last_name}`;
        }
        return group.teacher.name || 'Non assigné';
      }
    }

    return 'Non assigné';
  };

  const getHorairesFromAbsences = () => {
    const filtered = filterAbsences();

    if (filtered.length === 0 || !filterGroup) {
      return '8:30 - 13:30';
    }

    const timeRanges = {};
    filtered.forEach((absence) => {
      if (!absence) return;
      if (absence.start_time && absence.end_time) {
        const timeKey = `${absence.start_time} - ${absence.end_time}`;
        timeRanges[timeKey] = (timeRanges[timeKey] || 0) + 1;
      }
    });

    let mostCommonRange = '8:30 - 13:30';
    let maxCount = 0;

    Object.entries(timeRanges).forEach(([range, count]) => {
      if (count > maxCount) {
        mostCommonRange = range;
        maxCount = count;
      }
    });

    return mostCommonRange;
  };

  // Event Handlers
  const handleGroupFilter = (e) => {
    const group = e.target.value;
    setTempFilterGroup(group);
    setTempFilterDate('');
    setTempDayOfWeek('');

    if (group) {
      loadGroupAbsences(group);
    } else {
      setTempGroupDates([]);
      setTempValidatedDates([]);
    }
  };

  const handleDateFilter = (e) => {
    const date = e.target.value;
    setTempFilterDate(date);

    if (date) {
      setTempDayOfWeek(getDayOfWeek(date));
    } else {
      setTempDayOfWeek('');
    }
  };

  const applyFilters = () => {
    // Require date selection when group is selected
    if (tempFilterGroup && !tempFilterDate) {
      setError('Veuillez sélectionner une date');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setFilterGroup(tempFilterGroup);
    setFilterDate(tempFilterDate);
    setStatusFilter(tempStatusFilter);
    setJustifiedFilter(tempJustifiedFilter);
    setSearchTerm(tempSearchTerm);
    setGroupDates(tempGroupDates);
    setValidatedDates(tempValidatedDates);
    setDayOfWeek(tempDayOfWeek);

    if (tempFilterDate && tempFilterGroup) {
      const recordsForDateAndGroup = flattenedAbsences.filter(
        (absence) => absence.groupe === tempFilterGroup && absence.date === tempFilterDate
      );
      if (recordsForDateAndGroup.length > 0) {
        const firstRecord = recordsForDateAndGroup[0];
        const formatTime = (time) => (time ? time.substring(0, 5) : '');
        setSessionHoraire(`${formatTime(firstRecord.start_time)} - ${formatTime(firstRecord.end_time)}`);
      } else {
        setSessionHoraire('');
      }
    } else {
      setSessionHoraire('');
    }

    setFiltersApplied(true);
  };

  const handleClearFilters = () => {
    setFilterDate('');
    setFilterGroup('');
    setStatusFilter('all');
    setJustifiedFilter('all');
    setSearchTerm('');
    setGroupDates([]);
    setValidatedDates([]);
    setDayOfWeek('');

    setTempFilterDate('');
    setTempFilterGroup('');
    setTempSearchTerm('');
    setTempStatusFilter('all');
    setTempJustifiedFilter('all');
    setTempGroupDates([]);
    setTempValidatedDates([]);
    setTempDayOfWeek('');
    setFiltersApplied(false);
    setSessionHoraire('');
  };

  const handleColumnUpdate = (absenceId, column, value) => {
    // Optimistic UI update
    const absenceIndex = flattenedAbsences.findIndex((a) => a.id === absenceId);
    if (absenceIndex === -1) return;

    const updatedAbsences = [...flattenedAbsences];
    updatedAbsences[absenceIndex] = {
      ...updatedAbsences[absenceIndex],
      [column]: value,
    };
    setFlattenedAbsences(updatedAbsences);

    const filteredIndex = filteredRecords.findIndex((a) => a.id === absenceId);
    if (filteredIndex !== -1) {
      const updatedFiltered = [...filteredRecords];
      updatedFiltered[filteredIndex] = {
        ...updatedFiltered[filteredIndex],
        [column]: value,
      };
      setFilteredRecords(updatedFiltered);
    }

    // API call
    if (column === 'status') {
      absenceService.updateTraineeAbsence(absenceId, { status: value })
        .catch((error) => {
          console.error('Error updating status:', error);
          loadAbsenceData(); // Reload on error
        });
    } else {
      absenceService.updateTraineeAbsence(absenceId, { [column]: value })
        .catch((error) => {
          console.error('Error updating absence:', error);
          // Revert on error
          const revertedAbsences = [...flattenedAbsences];
          revertedAbsences[absenceIndex] = {
            ...revertedAbsences[absenceIndex],
            [column]: !value,
          };
          setFlattenedAbsences(revertedAbsences);

          if (filteredIndex !== -1) {
            const revertedFiltered = [...filteredRecords];
            revertedFiltered[filteredIndex] = {
              ...revertedFiltered[filteredIndex],
              [column]: !value,
            };
            setFilteredRecords(revertedFiltered);
          }
        });
    }
  };

  const handleViewStudentAbsences = async (traineeOrAbsence) => {
    try {
      const cef = traineeOrAbsence.cef || traineeOrAbsence.CEF;
      if (!cef) return;

      const response = await traineeService.getAbsences(cef);
      let latestAbsences = response.data || [];

      latestAbsences = latestAbsences.map((absence) => ({
        ...absence,
        is_validated: Boolean(absence.is_validated ?? absence.isValidated ?? false),
      }));

      const validatedAbsences = latestAbsences.filter((a) => a.is_validated === true);
      const unvalidatedAbsences = latestAbsences.filter((a) => a.is_validated !== true);

      const totalAbsenceHours = calculateAbsenceHours(validatedAbsences);
      const disciplinaryNote = calculateDisciplinaryNote(validatedAbsences);
      const disciplinaryStatus = getTraineeStatus(totalAbsenceHours);

      const baseTrainee = getTraineeData(cef);
      const absenceCalendar = prepareAbsenceCalendar(latestAbsences);

      const traineeWithStats = {
        ...baseTrainee,
        absenceCounts: {
          absent: validatedAbsences.filter((a) => a.status === 'absent').length,
          late: validatedAbsences.filter((a) => a.status === 'late').length,
        },
        absenceHours: totalAbsenceHours,
        disciplinaryNote,
        disciplinaryStatus,
        absenceCalendar,
        hasUnvalidatedAbsences: unvalidatedAbsences.length > 0,
        unvalidatedCount: unvalidatedAbsences.length,
      };

      setSelectedTrainee(traineeWithStats);
      setTraineeAbsences(latestAbsences);
      setShowAbsenceDetailModal(true);
    } catch (error) {
      console.error('Error loading trainee details:', error);
      setError('Erreur lors du chargement des détails du stagiaire');
    }
  };

  const handleEditAbsence = (absence) => {
    setEditingAbsence(absence);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingAbsence(null);
  };

  const handleSaveEditedAbsence = async (updatedAbsence) => {
    try {
      // Optimistic update
      setFlattenedAbsences((prev) =>
        prev.map((absence) => (absence.id === updatedAbsence.id ? updatedAbsence : absence))
      );
      setFilteredRecords((prev) =>
        prev.map((absence) => (absence.id === updatedAbsence.id ? updatedAbsence : absence))
      );

      await absenceService.updateTraineeAbsence(updatedAbsence.id, updatedAbsence);
      await loadAbsenceData();
      setSuccess('Absence modifiée avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating absence:', error);
      setError('Erreur lors de la modification de l\'absence');
      setTimeout(() => setError(''), 3000);
    }
    handleCloseEditModal();
  };

  const handleJustifyAbsence = (absence) => {
    setSelectedAbsenceForJustification(absence);
    setShowJustificationModal(true);
  };

  const handleCloseJustificationModal = () => {
    setShowJustificationModal(false);
    setSelectedAbsenceForJustification(null);
  };

  const handleSaveJustification = async (justificationData) => {
    try {
      await absenceService.updateTraineeAbsence(selectedAbsenceForJustification.id, {
        is_justified: justificationData.is_justified,
        justification_comment: justificationData.comment,
      });

      await loadAbsenceData();
      setSuccess('Justification enregistrée avec succès');
      setTimeout(() => setSuccess(''), 3000);
      handleCloseJustificationModal();
    } catch (error) {
      console.error('Error saving justification:', error);
      setError('Erreur lors de l\'enregistrement de la justification');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleBulkValidation = async () => {
    if (!filteredRecords || filteredRecords.length === 0) return;
    if (!filterGroup || !filterDate) return;

    setBulkConfirmationData({
      group: filterGroup,
      date: filterDate,
      count: filteredRecords.length,
    });
    setShowBulkConfirmation(true);
  };

  const performBulkValidation = async () => {
    setBulkValidating(true);
    setShowBulkConfirmation(false);

    try {
      // Filter out temporary IDs (for present trainees) - only send real MongoDB IDs
      const absenceIds = filteredRecords
        .map((absence) => absence.id)
        .filter((id) => !id.startsWith('temp_')); // Exclude temporary IDs

      if (absenceIds.length === 0) {
        setError('Aucune absence à valider');
        setTimeout(() => setError(''), 3000);
        setBulkValidating(false);
        setBulkConfirmationData(null);
        return;
      }

      await absenceService.validateDisplayedAbsences({
        group: bulkConfirmationData.group,
        date: bulkConfirmationData.date,
        absenceIds: absenceIds,
      });

      setSuccess('Validation en bloc effectuée avec succès');
      setTimeout(() => setSuccess(''), 3000);
      
      // Reset page
      handleClearFilters();
      await loadAbsenceData();
    } catch (error) {
      console.error('Bulk validation failed:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      console.error('Request URL:', error.config?.url);
      setError('Erreur lors de la validation en bloc');
      setTimeout(() => setError(''), 3000);
    } finally {
      setBulkValidating(false);
      setBulkConfirmationData(null);
    }
  };

  const handleBulkConfirmationCancel = () => {
    setShowBulkConfirmation(false);
    setBulkConfirmationData(null);
  };

  const generateWeeklyReport = () => {
    if (!filterGroup) {
      alert('Veuillez sélectionner un groupe pour générer le rapport');
      return;
    }

    // Get week dates
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    const weekDates = [];
    const dayNames = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
    
    for (let i = 0; i < 6; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDates.push({ date: d, name: dayNames[i] });
    }

    // Get trainees for group
    const groupTraineeCEFs = [...new Set(filteredRecords.map((absence) => absence.cef))];
    const groupTrainees = groupTraineeCEFs
      .map((cef) => {
        const trainee = trainees.find((t) => (t.cef || t.CEF) === cef);
        if (trainee) return trainee;
        const absenceRecord = filteredRecords.find((a) => a.cef === cef);
        return {
          cef: cef,
          name: absenceRecord?.trainee_name || '',
          first_name: absenceRecord?.trainee_first_name || '',
        };
      })
      .sort((a, b) => {
        const aName = (a.name || '').toUpperCase();
        const bName = (b.name || '').toUpperCase();
        return aName.localeCompare(bName);
      });

    // Generate table rows
    const tableRows = groupTrainees.map((trainee, index) => {
      const cef = trainee.cef || trainee.CEF;
      const absences = studentAbsences[cef] || [];
      const absencesByDate = {};

      absences.forEach((abs) => {
        if (!abs.date) return;
        const dateKey = new Date(abs.date).toISOString().split('T')[0];
        if (!absencesByDate[dateKey]) absencesByDate[dateKey] = [];
        absencesByDate[dateKey].push(abs);
      });

      const dayCells = weekDates.map((dObj) => {
        const dateKey = dObj.date.toISOString().split('T')[0];
        const dayAbsences = absencesByDate[dateKey] || [];
        let m1 = '', m2 = '', s1 = '', s2 = '';

        dayAbsences.forEach((absence) => {
          if (absence.status === 'absent' && !absence.is_justified) {
            if (absence.start_time?.startsWith('08')) {
              m1 = m2 = 'X';
            } else if (absence.start_time?.startsWith('13')) {
              s1 = s2 = 'X';
            }
          }
          if (absence.status === 'late') {
            if (absence.start_time?.startsWith('08')) {
              m1 = 'R';
            } else if (absence.start_time?.startsWith('13')) {
              s1 = 'R';
            }
          }
        });

        return `
          <td style="width:30px; height:30px; padding:0; text-align:center; font-weight:bold; color:#d00;">${m1}</td>
          <td style="width:30px; height:30px; padding:0; text-align:center; font-weight:bold; color:#d00;">${m2}</td>
          <td style="width:30px; height:30px; padding:0; text-align:center; font-weight:bold; color:#d00;">${s1}</td>
          <td style="width:30px; height:30px; padding:0; text-align:center; font-weight:bold; color:#d00;">${s2}</td>
        `;
      }).join('');

      const fullName = `${(trainee.name || '').toUpperCase()} ${(trainee.first_name || '').toUpperCase()}`.trim();

      return `
        <tr>
          <td style="width:40px; height:30px; text-align:center;">${index + 1}</td>
          <td style="text-align:left; padding-left:8px; width:150px;">${fullName}</td>
          ${dayCells}
        </tr>
      `;
    }).join('');

    const dayHeaders = weekDates.map(dObj => `
      <th colspan="4">
        <div style="font-weight:bold;">${dObj.name}</div>
      </th>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Rapport Hebdomadaire - ${filterGroup}</title>
        <style>
          @page { size: A4 portrait; margin: 0.5cm; }
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
          .print-button { position: fixed; top: 20px; right: 20px; z-index: 1000; background-color: #007bff; color: white; border: none; padding: 12px 20px; font-size: 16px; border-radius: 6px; cursor: pointer; }
          .print-button:hover { background-color: #0056b3; }
          .report { max-width: 21cm; margin: 0 auto; background: white; padding: 15px; }
          .header { display: flex; align-items: center; margin-bottom: 15px; }
          .title { font-size: 16px; font-weight: bold; text-align: center; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #000; text-align: center; vertical-align: middle; }
          th { background-color: #f0f0f0; font-weight: bold; height: 40px; }
          @media print { .print-button { display: none !important; } }
        </style>
      </head>
      <body>
        <button class="print-button" onclick="window.print()">🖨️ Imprimer</button>
        <div class="report">
          <div class="title">FEUILLE D'ABSENCE HEBDOMADAIRE</div>
          <div style="text-align:center; margin-bottom:15px;">INSTITUT SPECIALISE DE TECHNOLOGIE APPLIQUEE NTIC BENI MELLAL</div>
          <div style="margin-bottom:15px;">
            <strong>Groupe:</strong> ${filterGroup}<br>
            <strong>Semaine du:</strong> ${weekDates[0].date.toLocaleDateString('fr-FR')} au ${weekDates[5].date.toLocaleDateString('fr-FR')}
          </div>
          <table>
            <thead>
              <tr>
                <th rowspan="2" style="width:40px;">N°</th>
                <th rowspan="2" style="text-align:left; width:150px;">Nom & Prénom</th>
                ${dayHeaders}
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <div style="margin-top:20px;"><strong>Surveillant Général:</strong></div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Veuillez autoriser les fenêtres pop-up.');
      return;
    }
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'absent': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-amber-100 text-amber-800';
      case 'present': return 'bg-green-100 text-green-800';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Absences</h1>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={generateWeeklyReport}
            disabled={!filterGroup}
          >
            📥 Rapport Hebdomadaire
          </Button>
          <Button
            variant="primary"
            onClick={handleBulkValidation}
            disabled={!filtersApplied || filteredRecords.length === 0 || bulkValidating}
            loading={bulkValidating}
          >
            {bulkValidating ? 'Validation...' : `✓ Valider toutes (${filteredRecords.length})`}
          </Button>
        </div>
      </div>

      {error && <Alert type="error" dismissible onDismiss={() => setError('')}>{error}</Alert>}
      {success && <Alert type="success" dismissible onDismiss={() => setSuccess('')}>{success}</Alert>}

      {/* Statistics Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <div className="text-center">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Total des Absences</h3>
            <div className="text-4xl font-bold text-red-600">{stats.totalAbsent}</div>
            <div className="text-xs text-gray-500 mt-1">
              {filterGroup ? `Groupe: ${filterGroup}` : 'Aucun groupe sélectionné'}
            </div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Total des Retards</h3>
            <div className="text-4xl font-bold text-amber-600">{stats.totalLate}</div>
            <div className="text-xs text-gray-500 mt-1">
              {filterGroup ? `Groupe: ${filterGroup}` : 'Aucun groupe sélectionné'}
            </div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Présents</h3>
            <div className="text-4xl font-bold text-green-600">{stats.totalPresent}</div>
            <div className="text-xs text-gray-500 mt-1">
              {filterGroup ? `Groupe: ${filterGroup}` : 'Aucun groupe sélectionné'}
            </div>
          </div>
        </Card>
      </div>

      {/* Primary Filters */}
      <Card title="Filtres">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Groupe *</label>
              <select
                value={tempFilterGroup}
                onChange={handleGroupFilter}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">Sélectionnez un groupe</option>
                {availableGroups.map((group, index) => (
                  <option key={index} value={group}>{group}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <select
                value={tempFilterDate}
                onChange={handleDateFilter}
                disabled={!tempFilterGroup || tempGroupDates.length === 0}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100"
              >
                <option value="">Sélectionnez une date</option>
                {tempGroupDates.map((date, index) => {
                  const isValidated = tempValidatedDates.includes(date);
                  const dateObj = new Date(date);
                  const day = String(dateObj.getDate()).padStart(2, '0');
                  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                  const year = dateObj.getFullYear();
                  const formattedDate = `${day}-${month}-${year}`;
                  
                  return (
                    <option 
                      key={index} 
                      value={date}
                      className={isValidated ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}
                    >
                      {formattedDate} {isValidated ? '✓' : '⚠️'}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Jour</label>
              <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                {tempDayOfWeek || '---'}
              </div>
            </div>

            <div className="flex items-end gap-2">
              <Button
                variant="primary"
                onClick={applyFilters}
                disabled={!tempFilterGroup || !tempFilterDate}
                className="flex-1"
              >
                Filtrer
              </Button>
              <Button
                variant="secondary"
                onClick={handleClearFilters}
                className="flex-1"
              >
                Réinitialiser
              </Button>
            </div>
          </div>

          {/* Secondary Filters */}
          {filtersApplied && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                <select
                  value={tempStatusFilter}
                  onChange={(e) => {
                    setTempStatusFilter(e.target.value);
                    setStatusFilter(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="absent">Absent</option>
                  <option value="late">Retard</option>
                  <option value="present">Présent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Justification</label>
                <select
                  value={tempJustifiedFilter}
                  onChange={(e) => {
                    setTempJustifiedFilter(e.target.value);
                    setJustifiedFilter(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="all">Toutes</option>
                  <option value="justified">Justifiées</option>
                  <option value="not_justified">Non justifiées</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
                <input
                  type="text"
                  value={tempSearchTerm}
                  onChange={(e) => {
                    setTempSearchTerm(e.target.value);
                    setSearchTerm(e.target.value);
                  }}
                  placeholder="Nom, prénom ou CEF..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Results Section */}
      {loading ? (
        <Loader />
      ) : !filtersApplied ? (
        <Card>
          <div className="text-center py-12 text-gray-500">
            <CalendarIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-semibold">Sélectionnez un groupe et appliquez les filtres</p>
            <p className="text-sm mt-2">Les résultats s'afficheront ici</p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Résultats ({filteredRecords.length} stagiaires)
              </h3>
              <div className="text-sm text-gray-600">
                <span className="font-semibold">Formateur:</span> {getTeacherForGroup()}
                {sessionHoraire && (
                  <span className="ml-4">
                    <span className="font-semibold">Horaire:</span> {sessionHoraire}
                  </span>
                )}
              </div>
            </div>
          </div>

          {filteredRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CEF</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stagiaire</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Justifié</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Billet</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Heures</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecords.map((absence, index) => {
                    const trainee = getTraineeData(absence.cef);
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{trainee.cef}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {absence.trainee_name || ''} {absence.trainee_first_name || ''}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <select
                            value={absence.status}
                            onChange={(e) => handleColumnUpdate(absence.id, 'status', e.target.value)}
                            className={`px-3 py-1 rounded-lg font-semibold cursor-pointer border-0 ${getStatusStyle(absence.status)}`}
                          >
                            <option value="absent">Absent</option>
                            <option value="late">Retard</option>
                            <option value="present">Présent</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          {absence.status !== 'present' && (
                            <span
                              onClick={() => handleColumnUpdate(absence.id, 'is_justified', !absence.is_justified)}
                              className={`cursor-pointer text-2xl ${absence.is_justified ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {absence.is_justified ? '✓' : '✗'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          {absence.status !== 'present' && (
                            <span
                              onClick={() => handleColumnUpdate(absence.id, 'has_billet_entree', !absence.has_billet_entree)}
                              className={`cursor-pointer text-2xl ${absence.has_billet_entree ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {absence.has_billet_entree ? '✓' : '✗'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-center font-semibold text-gray-900">
                          {absence.status === 'late' ? '0h' : `${absence.absence_hours || 0}h`}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <ActionButtons
                            absence={absence}
                            onView={() => handleViewStudentAbsences(absence)}
                            onEdit={() => handleEditAbsence(absence)}
                            onValidate={() => handleJustifyAbsence(absence)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Aucun résultat trouvé pour les filtres sélectionnés.</p>
            </div>
          )}
        </Card>
      )}

      {/* Modals */}
      <ConfirmationModal
        show={showBulkConfirmation}
        onConfirm={performBulkValidation}
        onCancel={handleBulkConfirmationCancel}
        title="Validation en bloc"
        message={
          bulkConfirmationData
            ? `Êtes-vous sûr de vouloir valider toutes les ${bulkConfirmationData.count} absences affichées pour le groupe "${bulkConfirmationData.group}" à la date du ${formatDate(bulkConfirmationData.date)} ?`
            : ''
        }
        confirmText="Valider toutes"
        cancelText="Annuler"
        type="warning"
      />

      <EditAbsenceModal
        show={showEditModal}
        handleClose={handleCloseEditModal}
        editingAbsence={editingAbsence}
        handleSave={handleSaveEditedAbsence}
        getTraineeData={getTraineeData}
        formatDate={formatDate}
      />

      <JustificationModal
        show={showJustificationModal}
        handleClose={handleCloseJustificationModal}
        absenceData={selectedAbsenceForJustification}
        handleSave={handleSaveJustification}
      />

      <TraineeAbsenceDetailModal
        show={showAbsenceDetailModal}
        selectedTrainee={selectedTrainee}
        traineeAbsences={traineeAbsences}
        handleCloseModal={() => {
          setShowAbsenceDetailModal(false);
          setSelectedTrainee(null);
          setTraineeAbsences([]);
        }}
        formatDate={formatDate}
      />
    </div>
  );
};

export default AbsenceTracking;
