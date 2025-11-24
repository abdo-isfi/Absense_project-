import React from 'react';
import PropTypes from 'prop-types';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const ConfirmationModal = ({ 
  show, 
  onConfirm, 
  onCancel, 
  title, 
  message, 
  confirmText = 'Confirmer', 
  cancelText = 'Annuler',
  type = 'warning' // 'warning', 'danger', 'info'
}) => {
  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <XCircleIcon className="h-12 w-12 text-red-600" />;
      case 'info':
        return <InformationCircleIcon className="h-12 w-12 text-blue-600" />;
      case 'warning':
      default:
        return <ExclamationTriangleIcon className="h-12 w-12 text-amber-600" />;
    }
  };

  const getConfirmButtonVariant = () => {
    switch (type) {
      case 'danger':
        return 'danger';
      case 'info':
        return 'primary';
      case 'warning':
      default:
        return 'danger'; // Changed from 'warning' to 'danger'
    }
  };

  return (
    <Modal
      isOpen={show}
      onClose={onCancel}
      title={title}
      size="md"
    >
      <div className="text-center">
        <div className="flex justify-center mb-4">
          {getIcon()}
        </div>
        <p className="text-gray-700 mb-6">{message}</p>
      </div>

      <div className="flex gap-3 justify-end">
        <Button
          variant="secondary"
          onClick={onCancel}
        >
          {cancelText}
        </Button>
        <Button
          variant={getConfirmButtonVariant()}
          onClick={onConfirm}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
};

ConfirmationModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  type: PropTypes.oneOf(['warning', 'danger', 'info']),
};

export default ConfirmationModal;
