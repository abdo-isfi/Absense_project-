import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

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
      size="md"
    >
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Stagiaire:</span>{' '}
            {absenceData.trainee_name} {absenceData.trainee_first_name}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-semibold">CEF:</span> {absenceData.cef}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Date:</span> {absenceData.date}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Statut:</span>{' '}
            <span className={`font-semibold ${
              absenceData.status === 'absent' ? 'text-red-600' :
              absenceData.status === 'late' ? 'text-amber-600' : 'text-green-600'
            }`}>
              {absenceData.status === 'absent' ? 'Absent' :
               absenceData.status === 'late' ? 'Retard' : 'Présent'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="justified"
            checked={isJustified}
            onChange={(e) => setIsJustified(e.target.checked)}
            className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
          />
          <label htmlFor="justified" className="text-sm font-medium text-gray-700">
            Marquer comme justifié
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Commentaire
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ajoutez un commentaire de justification..."
          />
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
