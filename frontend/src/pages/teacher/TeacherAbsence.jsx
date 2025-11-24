import { useState, useEffect } from 'react';
import { useAuthContext } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import Loader from '../../components/ui/Loader';
import Input from '../../components/ui/Input';
import { 
  ClipboardDocumentCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import groupService from '../../services/groupService';
import traineeService from '../../services/traineeService';
import absenceService from '../../services/absenceService';

// Time slot configuration
const timeOptions = {
  "08:30": ["11:00", "13:30"],
  "11:00": ["13:30"],
  "13:30": ["16:00", "18:30"],
  "16:00": ["18:30"]
};

const startTimes = Object.keys(timeOptions);

const TeacherAbsence = () => {
  const { user } = useAuthContext();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [trainees, setTrainees] = useState([]);
  const [absenceDate, setAbsenceDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [absenceData, setAbsenceData] = useState({});
  
  // Conflict detection and edit mode
  const [hasConflict, setHasConflict] = useState(false);
  const [existingAbsences, setExistingAbsences] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [checkingConflict, setCheckingConflict] = useState(false);

  useEffect(() => {
    fetchTeacherGroups();
  }, [user]);

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupTrainees();
    }
  }, [selectedGroup]);

  useEffect(() => {
    if (selectedGroup && absenceDate && trainees.length > 0) {
      checkForExistingAbsences();
    }
  }, [selectedGroup, absenceDate, trainees.length]);

  // Check for existing absences when group or date changes
  const checkForExistingAbsences = async () => {
    if (!selectedGroup || !absenceDate) return;
    
    setCheckingConflict(true);
    try {
      const response = await absenceService.getGroupAbsencesByName(selectedGroup, absenceDate);
      if (response.success && response.data && response.data.length > 0) {
        setHasConflict(true);
        setExistingAbsences(response.data);
        
        // Populate existing statuses
        const mostRecent = response.data[0];
        if (mostRecent.absences && mostRecent.absences.length > 0) {
          const statusMap = {};
          mostRecent.absences.forEach(abs => {
            const tId = abs.traineeId?._id || abs.traineeId;
            if (tId) {
              statusMap[tId] = {
                status: abs.status,
                isJustified: abs.isJustified || false
              };
            }
          });
          
          setAbsenceData(prev => {
            const updated = { ...prev };
            Object.keys(updated).forEach(traineeId => {
              if (statusMap[traineeId]) {
                updated[traineeId] = statusMap[traineeId];
              }
            });
            return updated;
          });
          
          // Also update start/end time if available
          if (mostRecent.startTime) setStartTime(mostRecent.startTime);
          if (mostRecent.endTime) setEndTime(mostRecent.endTime);
        }
      } else {
        setHasConflict(false);
        setExistingAbsences([]);
        setIsEditMode(false);
      }
    } catch (err) {
      console.error('Error checking for existing absences:', err);
      setHasConflict(false);
      setExistingAbsences([]);
    } finally {
      setCheckingConflict(false);
    }
  };

  const fetchTeacherGroups = async () => {
    setLoading(true);
    try {
      const allGroups = await groupService.getAllGroups();
      const teacherGroups = allGroups.filter(g => 
        user?.groups?.includes(g.name)
      );
      setGroups(teacherGroups.map(g => ({ value: g.name, label: g.name })));
    } catch (err) {
      setError('Erreur lors du chargement des groupes');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupTrainees = async () => {
    setLoading(true);
    try {
      const response = await traineeService.getAllTrainees({ limit: 1000 });
      const groupTrainees = response.data.filter(t => t.groupe === selectedGroup);
      setTrainees(groupTrainees);
      
      // Initialize absence data
      const initialData = {};
      groupTrainees.forEach(trainee => {
        initialData[trainee._id] = {
          status: 'present',
          isJustified: false
        };
      });
      setAbsenceData(initialData);
    } catch (err) {
      setError('Erreur lors du chargement des stagiaires');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTimeChange = (value) => {
    setStartTime(value);
    setEndTime(''); // Clear end time when start time changes
    
    // Auto-select if only one option
    if (value && timeOptions[value]?.length === 1) {
      setEndTime(timeOptions[value][0]);
    }
  };

  const handleStatusChange = (traineeId, status) => {
    setAbsenceData(prev => ({
      ...prev,
      [traineeId]: {
        ...prev[traineeId],
        status
      }
    }));
  };

  const handleEditMode = () => {
    if (existingAbsences.length === 0) return;
    
    const mostRecent = existingAbsences[0];
    setIsEditMode(true);
    
    // Load existing times
    setStartTime(mostRecent.startTime);
    setEndTime(mostRecent.endTime);
    
    // Load existing statuses
    if (mostRecent.absences && mostRecent.absences.length > 0) {
      const statusMap = {};
      mostRecent.absences.forEach(abs => {
        if (abs.traineeId && abs.traineeId._id) {
          statusMap[abs.traineeId._id] = {
            status: abs.status,
            isJustified: abs.isJustified || false
          };
        }
      });
      
      // Merge with current absenceData to preserve all trainees
      setAbsenceData(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(traineeId => {
          if (statusMap[traineeId]) {
            updated[traineeId] = statusMap[traineeId];
          }
        });
        return updated;
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setStartTime('');
    setEndTime('');
    
    // Reset statuses to present
    const resetData = {};
    trainees.forEach(trainee => {
      resetData[trainee._id] = {
        status: 'present',
        isJustified: false
      };
    });
    setAbsenceData(resetData);
  };

  const handleSubmit = async () => {
    // Validation
    const errors = {};
    if (!selectedGroup) errors.group = true;
    if (!startTime) errors.start = true;
    if (!endTime) errors.end = true;
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setValidationErrors({});
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Prepare absence records
      const absences = Object.entries(absenceData)
        .filter(([_, data]) => data.status !== 'present')
        .map(([traineeId, data]) => ({
          traineeId,
          status: data.status,
          isJustified: data.isJustified || false
        }));

      if (absences.length === 0) {
        setError('Aucune absence à enregistrer');
        setSaving(false);
        return;
      }

      // Submit to backend
      await absenceService.markAbsences({
        groupe: selectedGroup,
        date: absenceDate,
        startTime: startTime,
        endTime: endTime,
        absences
      });

      setSuccess(`${absences.length} absence(s) enregistrée(s) avec succès`);
      
      // Reload page after short delay to show success message
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError('Erreur lors de l\'enregistrement des absences');
    } finally {
      setSaving(false);
    }
  };
  const filteredTrainees = trainees.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.cef.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusButton = (traineeId, status, label, icon) => {
    const isActive = absenceData[traineeId]?.status === status;

    return (
      <button
        onClick={() => !hasConflict || isEditMode ? handleStatusChange(traineeId, status) : null}
        disabled={hasConflict && !isEditMode}
        className={`
          flex items-center justify-center gap-1 px-3 py-2 rounded-lg border transition-all
          ${hasConflict && !isEditMode ? 'opacity-50 cursor-not-allowed' : ''}
          ${isActive 
            ? status === 'present' ? 'bg-green-500 text-white border-green-600 shadow-sm' 
            : status === 'absent' ? 'bg-red-500 text-white border-red-600 shadow-sm'
            : 'bg-orange-500 text-white border-orange-600 shadow-sm'
            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
        `}
        title={label}
      >
        {icon}
        <span className="text-sm font-medium hidden sm:inline">{label}</span>
      </button>
    );
  };

  const endTimeOptions = startTime ? timeOptions[startTime]?.map(time => ({ value: time, label: time })) || [] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <ClipboardDocumentCheckIcon className="h-8 w-8 text-primary-600" />
          Gérer les Absences
        </h1>
        <p className="text-gray-600 mt-1">
          Marquez les absences pour vos groupes
        </p>
      </div>

      {/* Alerts */}
      {success && <Alert type="success" dismissible onDismiss={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert type="error" dismissible onDismiss={() => setError('')}>{error}</Alert>}
      
      {/* Conflict Warning */}
      {hasConflict && !isEditMode && (
        <Alert type="warning">
          <div className="flex items-center justify-between">
            <div>
              <strong>Attention:</strong> Des absences existent déjà pour ce groupe à cette date.
              {existingAbsences.length > 0 && (
                <span className="ml-2 text-sm">
                  ({existingAbsences.length} enregistrement{existingAbsences.length > 1 ? 's' : ''})
                </span>
              )}
            </div>
            <Button size="sm" variant="primary" onClick={handleEditMode}>
              Modifier
            </Button>
          </div>
        </Alert>
      )}
      
      {/* Edit Mode Indicator */}
      {isEditMode && (
        <Alert type="info">
          <div className="flex items-center justify-between">
            <div>
              <strong>Mode Édition:</strong> Vous modifiez un enregistrement existant.
            </div>
            <Button size="sm" variant="outline" onClick={handleCancelEdit}>
              Annuler
            </Button>
          </div>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select
            label="Groupe"
            placeholder="Sélectionner un groupe"
            options={groups}
            value={selectedGroup}
            onChange={(val) => setSelectedGroup(val)}
            error={validationErrors.group ? 'Groupe requis' : ''}
            required
          />
          <Input
            label="Date"
            type="date"
            value={absenceDate}
            disabled
            className="bg-white cursor-notb-allowed"
          />
          <Select
            label="Heure de début"
            placeholder="Sélectionner"
            options={startTimes.map(t => ({ value: t, label: t }))}
            value={startTime}
            onChange={handleStartTimeChange}
            error={validationErrors.start ? 'Heure de début requise' : ''}
            required
            disabled={hasConflict && !isEditMode}
            className="bg-white"
          />
          <Select
            label="Heure de fin"
            placeholder={!startTime ? "Choisissez d'abord une heure de début" : "Sélectionner"}
            options={endTimeOptions}
            value={endTime}
            onChange={(val) => setEndTime(val)}
            error={validationErrors.end ? 'Heure de fin requise' : ''}
            required
            disabled={hasConflict && !isEditMode}
            className="bg-white"
          />
        </div>
      </Card>

      {/* Trainees List */}
      {loading ? (
        <Loader />
      ) : selectedGroup ? (
        <Card>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Liste des stagiaires ({filteredTrainees.length})
              </h2>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Rechercher un stagiaire..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                  />
                </div>
                
                <Button 
                  variant="primary" 
                  onClick={handleSubmit}
                  loading={saving}
                  disabled={!selectedGroup || !startTime || !endTime || (hasConflict && !isEditMode)}
                >
                  {isEditMode ? 'Mettre à jour' : 'Enregistrer'}
                </Button>
              </div>
            </div>

            {filteredTrainees.length === 0 ? (
              <Alert type="info">Aucun stagiaire trouvé</Alert>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stagiaire
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        CEF
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTrainees.map((trainee) => (
                      <tr key={trainee._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            {trainee.name} {trainee.firstName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {trainee.cef}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2 justify-center">
                            {getStatusButton(
                              trainee._id, 
                              'present', 
                              'Présent',
                              <CheckCircleIcon className="h-5 w-5" />
                            )}
                            {getStatusButton(
                              trainee._id, 
                              'absent', 
                              'Absent',
                              <XCircleIcon className="h-5 w-5" />
                            )}
                            {getStatusButton(
                              trainee._id, 
                              'late', 
                              'Retard',
                              <ClockIcon className="h-5 w-5" />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <Alert type="info">
          Veuillez sélectionner un groupe pour commencer
        </Alert>
      )}
    </div>
  );
};

export default TeacherAbsence;
