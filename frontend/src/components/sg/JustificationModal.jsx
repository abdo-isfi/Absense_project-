import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const JustificationModal = ({ show, handleClose, absenceData, handleSave }) => {
  const [isJustified, setIsJustified] = useState(false);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (absenceData) {
      setIsJustified(absenceData.is_justified || false);
      setComment(absenceData.justification_comment || '');
    }
  }, [absenceData]);

  const onSave = () => {
    handleSave({
      is_justified: isJustified,
      comment: comment,
    });
  };

  const onClose = () => {
    setIsJustified(false);
    setComment('');
    handleClose();
  };

  if (!absenceData) return null;

  return (
    <Modal
      isOpen={show}
      onClose={onClose}
      title="Justification d'absence"
      size="lg"
    >
      <div className="space-y-4">
        {/* Detailed Info Grid */}
        <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex flex-col">
            <span className="text-gray-500 font-medium mb-1">CEF:</span>
            <span className="text-gray-900 font-semibold">{absenceData.cef}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 font-medium mb-1">Étudiant:</span>
            <span className="text-gray-900 font-semibold">
              {absenceData.trainee_name} {absenceData.trainee_first_name}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 font-medium mb-1">Groupe:</span>
            <span className="text-gray-900 font-semibold">{absenceData.groupe}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 font-medium mb-1">Date:</span>
            <span className="text-gray-900 font-semibold">
              {new Date(absenceData.date).toLocaleDateString('fr-FR')}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 font-medium mb-1">Formateur:</span>
            <span className="text-gray-900 font-semibold">
              {absenceData.teacher_name || "Non assigné"}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 font-medium mb-1">Statut actuel:</span>
            <span 
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold text-white w-fit"
              style={{ 
                backgroundColor: 
                  absenceData.status === 'absent' ? '#e74c3c' : 
                  absenceData.status === 'late' ? '#f39c12' : 
                  '#27ae60' 
              }}
            >
              {absenceData.status === 'absent' ? 'Absent' : 
               absenceData.status === 'late' ? 'Retard' : 
               'Présent'}
            </span>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <input
              type="checkbox"
              id="justified"
              checked={isJustified}
              onChange={(e) => setIsJustified(e.target.checked)}
              style={{ colorScheme: 'light' }}
              className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 !bg-white border-gray-300 cursor-pointer"
            />
            <label htmlFor="justified" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
              Marquer comme justifié
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commentaire de justification
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={!isJustified}
              rows={4}
              style={{ colorScheme: 'light' }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors
                ${!isJustified 
                  ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' 
                  : '!bg-white border-gray-300 text-gray-900'
                }`}
              placeholder={!isJustified ? "Cochez la case ci-dessus pour ajouter un commentaire..." : "Ajoutez un commentaire..."}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-end mt-6">
        <Button variant="secondary" onClick={onClose}>
          Annuler
        </Button>
        <Button variant="primary" onClick={onSave}>
          Enregistrer
        </Button>
      </div>
    </Modal>
  );
};

JustificationModal.propTypes = {
  show: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  absenceData: PropTypes.object,
  handleSave: PropTypes.func.isRequired,
};

export default JustificationModal;
