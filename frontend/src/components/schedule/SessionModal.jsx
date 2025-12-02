import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ExclamationTriangleIcon, TrashIcon } from '@heroicons/react/24/outline';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import Loader from '../ui/Loader';
import teacherService from '../../services/teacherService';
import scheduleService from '../../services/scheduleService';
import { handleApiError } from '../../utils/helpers';

const SESSION_TYPES = ['Cours', 'TD', 'TP'];

const SessionModal = ({
  isOpen,
  onClose,
  day,
  timeSlot,
  session,
  teacherId,
  scheduleId,
  onSave,
  onDelete,
}) => {
  const [formData, setFormData] = useState({
    subject: '',
    group: '',
    room: '',
    type: 'Cours',
    mode: 'Présentiel', // New field: Présentiel or À distance
    notes: '',
  });

  const [groups, setGroups] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchGroups();
      if (session) {
        setFormData({
          subject: session.subject || '',
          group: session.group?._id || session.group || '',
          room: session.room || '',
          type: session.type || 'Cours',
          mode: session.mode || 'Présentiel',
          notes: session.notes || '',
        });
      } else {
        setFormData({
          subject: '',
          group: '',
          room: '',
          type: 'Cours',
          mode: 'Présentiel',
          notes: '',
        });
      }
      setConflicts([]);
      setError('');
    }
  }, [isOpen, session]);

  const fetchGroups = async () => {
    if (!teacherId) return;
    
    try {
      const response = await teacherService.getById(teacherId);
      // Backend now returns full group objects in response.data.groups
      setGroups(response.data.groups || []);
    } catch (err) {
      console.error('Error fetching groups:', err);
    }
  };

  const checkConflicts = async () => {
    if (!formData.subject || !formData.group || !formData.room) {
      return;
    }

    try {
      setCheckingConflicts(true);
      const response = await scheduleService.checkConflicts({
        teacher: teacherId,
        day,
        timeSlot,
        room: formData.room,
        group: formData.group,
        scheduleId,
      });

      if (response.data.hasConflicts) {
        setConflicts(response.data.conflicts);
      } else {
        setConflicts([]);
      }
    } catch (err) {
      console.error('Error checking conflicts:', err);
    } finally {
      setCheckingConflicts(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (formData.subject && formData.group && formData.room) {
        checkConflicts();
      }
    }, 500);

    return () => clearTimeout(debounce);
  }, [formData.subject, formData.group, formData.room]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.group) {
      setError('Le groupe est requis');
      return;
    }
    if (!formData.room.trim()) {
      setError('La salle est requise');
      return;
    }

    if (conflicts.length > 0) {
      setError('Veuillez résoudre les conflits avant de sauvegarder');
      return;
    }

    setLoading(true);
    try {
      const selectedGroupObj = groups.find(g => g._id === formData.group);
      
      const sessionData = {
        day,
        timeSlot,
        subject: formData.subject.trim(),
        group: selectedGroupObj ? { _id: selectedGroupObj._id, name: selectedGroupObj.name } : formData.group,
        room: formData.room.trim(),
        type: formData.type,
        mode: formData.mode,
        notes: formData.notes.trim(),
      };

      await onSave(sessionData);
      onClose();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette séance ?')) {
      return;
    }

    setLoading(true);
    try {
      await onDelete(day, timeSlot);
      onClose();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${session ? 'Modifier' : 'Ajouter'} une séance`}
      size="lg"
      footer={
        <div className="flex justify-between w-full">
          <div>
            {session && (
              <Button
                variant="danger"
                onClick={handleDelete}
                loading={loading}
                icon={TrashIcon}
              >
                Supprimer
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={loading}
              disabled={conflicts.length > 0 || checkingConflicts}
            >
              {session ? 'Mettre à jour' : 'Ajouter'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Session Info */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">{day}</span> • {timeSlot}
          </p>
        </div>

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Conflicts Warning */}
        {checkingConflicts && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader size="sm" />
            <span>Vérification des conflits...</span>
          </div>
        )}

        {conflicts.length > 0 && (
          <Alert type="warning">
            <div className="flex items-start gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold mb-2">Conflits détectés:</p>
                <ul className="space-y-1 text-sm">
                  {conflicts.map((conflict, idx) => (
                    <li key={idx}>• {conflict.message}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Alert>
        )}

        {/* Form Fields */}
        <Input
          label="Sujet / Module"
          type="text"
          value={formData.subject}
          onChange={(e) => handleChange('subject', e.target.value)}
          placeholder="Ex: Programmation Web"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Groupe <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.group}
            onChange={(e) => handleChange('group', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            required
          >
            <option value="">Sélectionner un groupe</option>
            {groups.map((group) => (
              <option key={group._id} value={group._id}>
                {group.name} {group.filiere && `- ${group.filiere}`}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Salle"
          type="text"
          value={formData.room}
          onChange={(e) => handleChange('room', e.target.value)}
          placeholder="Ex: Salle 101"
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type de séance <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4">
            {SESSION_TYPES.map((type) => (
              <label key={type} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value={type}
                  checked={formData.type === type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 !bg-white"
                />
                <span className="ml-2 text-sm text-gray-700">{type}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mode <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.mode}
            onChange={(e) => handleChange('mode', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            required
          >
            <option value="Présentiel">Présentiel</option>
            <option value="À distance">À distance</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (optionnel)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Remarques ou informations supplémentaires..."
            rows={3}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>
    </Modal>
  );
};

SessionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  day: PropTypes.string,
  timeSlot: PropTypes.string,
  session: PropTypes.object,
  teacherId: PropTypes.string,
  scheduleId: PropTypes.string,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default SessionModal;
