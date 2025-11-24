import React from 'react';
import { EyeIcon, PencilIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';

const ActionButtons = ({ absence, onView, onEdit, onValidate }) => {
  return (
    <div className="flex gap-2 justify-center">
      <button
        onClick={onView}
        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        title="Voir l'historique"
      >
        <EyeIcon className="h-5 w-5" />
      </button>
      <button
        onClick={onEdit}
        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
        title="Modifier"
      >
        <PencilIcon className="h-5 w-5" />
      </button>
      <button
        onClick={onValidate}
        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
        title="Justifier"
      >
        <CheckCircleIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

ActionButtons.propTypes = {
  absence: PropTypes.object.isRequired,
  onView: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onValidate: PropTypes.func.isRequired,
};

export default ActionButtons;
