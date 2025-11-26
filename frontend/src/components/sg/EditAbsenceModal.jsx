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
        {/* Detailed Info Grid */}
        <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex flex-col">
            <span className="text-gray-500 font-medium mb-1">CEF:</span>
            <span className="text-gray-900 font-semibold">{editingAbsence.cef}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 font-medium mb-1">Étudiant:</span>
            <span className="text-gray-900 font-semibold">
              {trainee?.name || trainee?.NOM} {trainee?.first_name || trainee?.firstName || trainee?.PRENOM}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 font-medium mb-1">Groupe:</span>
            <span className="text-gray-900 font-semibold">{editingAbsence.groupe}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 font-medium mb-1">Date:</span>
            <span className="text-gray-900 font-semibold">{formatDate(editingAbsence.date)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 font-medium mb-1">Formateur:</span>
            <span className="text-gray-900 font-semibold">
              {editingAbsence.teacher_name || "Non assigné"}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 font-medium mb-1">Horaire d'absence:</span>
            <span className="text-gray-900 font-semibold">
              {formData.start_time && formData.end_time 
                ? `${formData.start_time.substring(0, 5)} - ${formData.end_time.substring(0, 5)}`
                : '--:-- - --:--'}
            </span>
          </div>
          <div className="flex flex-col col-span-2">
            <span className="text-gray-500 font-medium mb-1">Statut actuel:</span>
            <span 
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold text-white w-fit"
              style={{ 
                backgroundColor: 
                  editingAbsence.status === 'absent' ? '#e74c3c' : 
                  editingAbsence.status === 'late' ? '#f39c12' : 
                  '#27ae60' 
              }}
            >
              {editingAbsence.status === 'absent' ? 'Absent' : 
               editingAbsence.status === 'late' ? 'Retard' : 
               'Présent'}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Statut</label>
          <div className="flex gap-2">
            {[
              { value: 'present', label: 'Présent', color: 'bg-green-100 text-green-800 border-green-200', activeColor: 'bg-green-600 text-white border-green-600' },
              { value: 'absent', label: 'Absent', color: 'bg-red-100 text-red-800 border-red-200', activeColor: 'bg-red-600 text-white border-red-600' },
              { value: 'late', label: 'Retard', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', activeColor: 'bg-yellow-500 text-white border-yellow-500' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleChange('status', option.value)}
                className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-all duration-200 ${
                  formData.status === option.value
                    ? option.activeColor
                    : `${option.color} hover:opacity-80`
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_justified"
              checked={formData.is_justified}
              onChange={(e) => handleChange('is_justified', e.target.checked)}
              style={{ colorScheme: 'light' }}
              className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 !bg-white border-gray-300"
            />
            <label htmlFor="is_justified" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
              Justifié
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="has_billet_entree"
              checked={formData.has_billet_entree}
              onChange={(e) => handleChange('has_billet_entree', e.target.checked)}
              style={{ colorScheme: 'light' }}
              className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 !bg-white border-gray-300"
            />
            <label htmlFor="has_billet_entree" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
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
            style={{ colorScheme: 'light' }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent !bg-white"
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
