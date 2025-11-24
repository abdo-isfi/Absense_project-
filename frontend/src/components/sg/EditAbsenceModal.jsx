import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

const EditAbsenceModal = ({ show, handleClose, editingAbsence, handleSave, getTraineeData, formatDate }) => {
  const [formData, setFormData] = useState({
    date: '',
    start_time: '',
    end_time: '',
    status: 'absent',
    is_justified: false,
    justification_comment: '',
    has_billet_entree: false,
    absence_hours: 0,
  });

  useEffect(() => {
    if (editingAbsence) {
      setFormData({
        date: editingAbsence.date || '',
        start_time: editingAbsence.start_time || '',
        end_time: editingAbsence.end_time || '',
        status: editingAbsence.status || 'absent',
        is_justified: editingAbsence.is_justified || false,
        justification_comment: editingAbsence.justification_comment || '',
        has_billet_entree: editingAbsence.has_billet_entree || false,
        absence_hours: editingAbsence.absence_hours || 0,
      });
    }
  }, [editingAbsence]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const onSave = () => {
    handleSave({
      ...editingAbsence,
      ...formData,
    });
  };

  if (!editingAbsence) return null;

  const trainee = getTraineeData(editingAbsence.cef);

  const statusOptions = [
    { value: 'absent', label: 'Absent' },
    { value: 'late', label: 'Retard' },
    { value: 'present', label: 'Présent' },
  ];

  return (
    <Modal
      isOpen={show}
      onClose={handleClose}
      title="Modifier l'absence"
      size="lg"
    >
      <div className="space-y-4">
        {/* Trainee Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Informations du stagiaire</h3>
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Nom:</span> {trainee.name} {trainee.first_name}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-semibold">CEF:</span> {trainee.cef}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Groupe:</span> {editingAbsence.groupe}
          </p>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
          />
          <Input
            label="Heures d'absence"
            type="number"
            step="0.5"
            value={formData.absence_hours}
            onChange={(e) => handleChange('absence_hours', parseFloat(e.target.value))}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Heure de début"
            type="time"
            value={formData.start_time}
            onChange={(e) => handleChange('start_time', e.target.value)}
          />
          <Input
            label="Heure de fin"
            type="time"
            value={formData.end_time}
            onChange={(e) => handleChange('end_time', e.target.value)}
          />
        </div>

        <Select
          label="Statut"
          options={statusOptions}
          value={statusOptions.find(opt => opt.value === formData.status)}
          onChange={(opt) => handleChange('status', opt ? opt.value : 'absent')}
        />

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_justified"
              checked={formData.is_justified}
              onChange={(e) => handleChange('is_justified', e.target.checked)}
              className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_justified" className="text-sm font-medium text-gray-700">
              Justifié
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="has_billet_entree"
              checked={formData.has_billet_entree}
              onChange={(e) => handleChange('has_billet_entree', e.target.checked)}
              className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="has_billet_entree" className="text-sm font-medium text-gray-700">
              Billet d'entrée
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Commentaire de justification
          </label>
          <textarea
            value={formData.justification_comment}
            onChange={(e) => handleChange('justification_comment', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ajoutez un commentaire..."
          />
        </div>
      </div>

      <div className="flex gap-3 justify-end mt-6">
        <Button variant="secondary" onClick={handleClose}>
          Annuler
        </Button>
        <Button variant="primary" onClick={onSave}>
          Enregistrer
        </Button>
      </div>
    </Modal>
  );
};

EditAbsenceModal.propTypes = {
  show: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  editingAbsence: PropTypes.object,
  handleSave: PropTypes.func.isRequired,
  getTraineeData: PropTypes.func.isRequired,
  formatDate: PropTypes.func.isRequired,
};

export default EditAbsenceModal;
