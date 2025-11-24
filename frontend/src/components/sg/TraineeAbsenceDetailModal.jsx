import React from 'react';
import PropTypes from 'prop-types';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const TraineeAbsenceDetailModal = ({ show, selectedTrainee, traineeAbsences, handleCloseModal, formatDate }) => {
  if (!selectedTrainee) return null;

  const getStatusBadge = (status) => {
    const styles = {
      absent: 'bg-red-100 text-red-800',
      late: 'bg-amber-100 text-amber-800',
      present: 'bg-green-100 text-green-800',
    };
    const labels = {
      absent: 'Absent',
      late: 'Retard',
      present: 'Présent',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getDisciplinaryStatusColor = (color) => {
    return color || '#9FE855';
  };

  return (
    <Modal
      isOpen={show}
      onClose={handleCloseModal}
      title="Détails des absences du stagiaire"
      size="xl"
    >
      <div className="space-y-6">
        {/* Trainee Info */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            {selectedTrainee.name} {selectedTrainee.first_name}
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold text-gray-700">CEF:</span>{' '}
              <span className="text-gray-900">{selectedTrainee.cef}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Groupe:</span>{' '}
              <span className="text-gray-900">{selectedTrainee.class || selectedTrainee.groupe || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border-2 border-red-200 rounded-lg p-4">
            <div className="text-sm font-semibold text-gray-600 mb-1">Total Absences</div>
            <div className="text-3xl font-bold text-red-600">
              {selectedTrainee.absenceCounts?.absent || 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">Validées uniquement</div>
          </div>

          <div className="bg-white border-2 border-amber-200 rounded-lg p-4">
            <div className="text-sm font-semibold text-gray-600 mb-1">Total Retards</div>
            <div className="text-3xl font-bold text-amber-600">
              {selectedTrainee.absenceCounts?.late || 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">Validées uniquement</div>
          </div>

          <div className="bg-white border-2 border-blue-200 rounded-lg p-4">
            <div className="text-sm font-semibold text-gray-600 mb-1">Heures d'absence</div>
            <div className="text-3xl font-bold text-blue-600">
              {selectedTrainee.absenceHours || 0}h
            </div>
            <div className="text-xs text-gray-500 mt-1">Calculées</div>
          </div>
        </div>

        {/* Disciplinary Status */}
        <div className="bg-white border-2 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-600 mb-1">Statut Disciplinaire</div>
              <div 
                className="text-2xl font-bold"
                style={{ color: getDisciplinaryStatusColor(selectedTrainee.disciplinaryStatus?.color) }}
              >
                {selectedTrainee.disciplinaryStatus?.text || 'NORMAL'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-600 mb-1">Note Disciplinaire</div>
              <div className="text-2xl font-bold text-gray-900">
                {selectedTrainee.disciplinaryNote || 20}/20
              </div>
            </div>
          </div>
        </div>

        {/* Unvalidated Warning */}
        {selectedTrainee.hasUnvalidatedAbsences && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-amber-700">
                  <span className="font-semibold">{selectedTrainee.unvalidatedCount}</span> absence(s) non validée(s)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Absences Table */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Historique complet des absences</h4>
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Horaire
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Justifié
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Validé
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Heures
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {traineeAbsences && traineeAbsences.length > 0 ? (
                    traineeAbsences.map((absence, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatDate(absence.date || absence.absence_date)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {absence.start_time && absence.end_time
                            ? `${absence.start_time.substring(0, 5)} - ${absence.end_time.substring(0, 5)}`
                            : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {getStatusBadge(absence.status)}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          {absence.is_justified ? (
                            <span className="text-green-600 font-bold">✓</span>
                          ) : (
                            <span className="text-red-600 font-bold">✗</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          {absence.is_validated ? (
                            <span className="text-green-600 font-bold">✓</span>
                          ) : (
                            <span className="text-amber-600 font-bold">⚠</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-semibold">
                          {absence.absence_hours || 0}h
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                        Aucune absence enregistrée
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <Button variant="secondary" onClick={handleCloseModal}>
          Fermer
        </Button>
      </div>
    </Modal>
  );
};

TraineeAbsenceDetailModal.propTypes = {
  show: PropTypes.bool.isRequired,
  selectedTrainee: PropTypes.object,
  traineeAbsences: PropTypes.array,
  handleCloseModal: PropTypes.func.isRequired,
  formatDate: PropTypes.func.isRequired,
};

export default TraineeAbsenceDetailModal;
