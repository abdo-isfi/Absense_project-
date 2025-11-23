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
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [absenceData, setAbsenceData] = useState({});

  useEffect(() => {
    fetchTeacherGroups();
  }, [user]);

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupTrainees();
    }
  }, [selectedGroup]);

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
        startTime: startTime + ':00',
        endTime: endTime + ':00',
        absences
      });

      setSuccess(`${absences.length} absence(s) enregistrée(s) avec succès`);
      
      // Reset form
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError('Erreur lors de l\'enregistrement des absences');
    } finally {
      setSaving(false);
    }
  };

  const getStatusButton = (traineeId, status, label, icon) => {
    const isActive = absenceData[traineeId]?.status === status;

    return (
      <button
        onClick={() => handleStatusChange(traineeId, status)}
        className={`
          flex items-center justify-center gap-1 px-3 py-2 rounded-lg border transition-all
          ${isActive 
            ? status === 'present' ? 'bg-green-500 text-white border-green-600 shadow-sm' 
            : status === 'absent' ? 'bg-red-500 text-white border-red-600 shadow-sm'
            : 'bg-primary-500 text-white border-primary-600 shadow-sm'
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
            onChange={(e) => setAbsenceDate(e.target.value)}
            required
          />
          <Select
            label="Heure de début"
            placeholder="Sélectionner"
            options={startTimes.map(t => ({ value: t, label: t }))}
            value={startTime}
            onChange={handleStartTimeChange}
            error={validationErrors.start ? 'Heure de début requise' : ''}
            required
          />
          <Select
            label="Heure de fin"
            placeholder={!startTime ? "Choisissez d'abord une heure de début" : "Sélectionner"}
            options={endTimeOptions}
            value={endTime}
            onChange={(val) => setEndTime(val)}
            error={validationErrors.end ? 'Heure de fin requise' : ''}
            required
          />
        </div>
      </Card>

      {/* Trainees List */}
      {loading ? (
        <Loader />
      ) : selectedGroup ? (
        <Card>
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Liste des stagiaires ({trainees.length})
              </h2>
              <Button 
                variant="primary" 
                onClick={handleSubmit}
                loading={saving}
                disabled={!selectedGroup || !startTime || !endTime}
              >
                Enregistrer les absences
              </Button>
            </div>

            {trainees.length === 0 ? (
              <Alert type="info">Aucun stagiaire trouvé dans ce groupe</Alert>
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
                    {trainees.map((trainee) => (
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
