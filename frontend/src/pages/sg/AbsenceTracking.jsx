import { useState, useEffect } from 'react';
import { 
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import Loader from '../../components/ui/Loader';
import groupService from '../../services/groupService';
import traineeService from '../../services/traineeService';
import absenceService from '../../services/absenceService';
import { handleApiError } from '../../utils/helpers';

const AbsenceTracking = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [selectedGroup, setSelectedGroup] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:30');
  const [endTime, setEndTime] = useState('11:00');
  const [subject, setSubject] = useState('');
  
  // Trainees State
  const [trainees, setTrainees] = useState([]);
  const [absences, setAbsences] = useState({}); // { traineeId: 'present' | 'absent' | 'late' }

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchTrainees();
    } else {
      setTrainees([]);
      setAbsences({});
    }
  }, [selectedGroup]);

  const fetchGroups = async () => {
    try {
      const data = await groupService.getAllGroups();
      setGroups(data.map(g => ({ value: g.code, label: g.name })));
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainees = async () => {
    setLoading(true);
    try {
      // Fetch all trainees for the group (no pagination for this view)
      const data = await traineeService.getAllTrainees({
        group: selectedGroup,
        limit: 100, // Reasonable limit for a class
      });
      setTrainees(data.data);
      
      // Initialize absences as 'present'
      const initialAbsences = {};
      data.data.forEach(t => {
        initialAbsences[t._id] = 'present';
      });
      setAbsences(initialAbsences);
    } catch (err) {
      setError('Impossible de charger les stagiaires');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (traineeId, status) => {
    setAbsences(prev => ({
      ...prev,
      [traineeId]: status
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGroup) {
      setError('Veuillez sélectionner un groupe');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Convert absences map to array
      const absencesArray = Object.entries(absences).map(([traineeId, status]) => ({
        traineeId,
        status
      }));

      await absenceService.markAbsence({
        groupId: groups.find(g => g.value === selectedGroup)?.label, // Using name as ID for now if backend expects string
        date,
        startTime,
        endTime,
        subject,
        absences: absencesArray
      });

      setSuccess('Absences enregistrées avec succès');
      // Reset form or keep it? Maybe keep for next slot?
      // For now, just clear success after 3s
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status, current) => {
    if (status === current) {
      switch (status) {
        case 'present': return 'bg-green-100 text-green-700 border-green-300 ring-2 ring-green-500';
        case 'absent': return 'bg-red-100 text-red-700 border-red-300 ring-2 ring-red-500';
        case 'late': return 'bg-yellow-100 text-yellow-700 border-yellow-300 ring-2 ring-yellow-500';
        default: return '';
      }
    }
    return 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Suivi des Absences</h1>
      </div>

      {error && <Alert type="error" dismissible onDismiss={() => setError('')}>{error}</Alert>}
      {success && <Alert type="success" dismissible onDismiss={() => setSuccess('')}>{success}</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1">
          <Card title="Configuration de la séance">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select
                label="Groupe"
                options={groups}
                value={groups.find(g => g.value === selectedGroup)}
                onChange={(opt) => setSelectedGroup(opt ? opt.value : '')}
                required
              />
              
              <Input
                label="Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Heure début"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
                <Input
                  label="Heure fin"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>

              <Input
                label="Module / Matière"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: Développement Web"
              />

              <div className="pt-4">
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="w-full"
                  loading={submitting}
                  disabled={!selectedGroup || trainees.length === 0}
                >
                  Enregistrer les absences
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Trainees List */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Liste des stagiaires {trainees.length > 0 && `(${trainees.length})`}
              </h3>
              <div className="flex gap-2 text-sm text-gray-500">
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-full"></div> Présent</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-full"></div> Absent</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-500 rounded-full"></div> Retard</span>
              </div>
            </div>

            {loading ? (
              <Loader />
            ) : !selectedGroup ? (
              <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
                Sélectionnez un groupe pour afficher la liste
              </div>
            ) : trainees.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Aucun stagiaire dans ce groupe
              </div>
            ) : (
              <div className="space-y-3">
                {trainees.map((trainee) => (
                  <div 
                    key={trainee._id} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{trainee.name} {trainee.firstName}</p>
                      <p className="text-sm text-gray-500">CEF: {trainee.cef}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(trainee._id, 'present')}
                        className={`p-2 rounded-lg border transition-all ${getStatusColor('present', absences[trainee._id])}`}
                        title="Présent"
                      >
                        <CheckCircleIcon className="h-6 w-6" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(trainee._id, 'absent')}
                        className={`p-2 rounded-lg border transition-all ${getStatusColor('absent', absences[trainee._id])}`}
                        title="Absent"
                      >
                        <XCircleIcon className="h-6 w-6" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(trainee._id, 'late')}
                        className={`p-2 rounded-lg border transition-all ${getStatusColor('late', absences[trainee._id])}`}
                        title="Retard"
                      >
                        <ExclamationCircleIcon className="h-6 w-6" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AbsenceTracking;
