import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from '../ui/Button';

const MergeTooltip = ({ 
  isVisible, 
  position, 
  onConfirm, 
  onCancel,
  currentSession 
}) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Small delay for smooth fade-in
      const timer = setTimeout(() => setShow(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed z-[9999] transition-all duration-200 ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y - 140}px`, // Position above the cell
        transform: 'translateX(-50%)', // Center horizontally
        pointerEvents: 'auto',
      }}
    >
      <div className="bg-white rounded-lg shadow-2xl border-2 border-primary-200 p-4 min-w-[300px]">
        {/* Arrow pointing down */}
        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
          <div className="w-6 h-6 bg-white border-r-2 border-b-2 border-primary-200 transform rotate-45"></div>
        </div>

        {/* Content */}
        <div className="space-y-3 relative z-10">
          <p className="text-sm font-medium text-gray-900">
            Continuer cette séance jusqu&apos;au prochain créneau ?
          </p>
          
          {currentSession && (
            <div className="text-xs text-gray-600 bg-primary-50 p-2 rounded border border-primary-100">
              <p className="font-semibold text-gray-900">{currentSession.group?.name || currentSession.group}</p>
              <p className="text-gray-700">{currentSession.subject} • {currentSession.room}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={onConfirm}
              icon={CheckIcon}
              className="flex-1"
            >
              Oui, continuer
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              icon={XMarkIcon}
              className="flex-1"
            >
              Non
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

MergeTooltip.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  position: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
  }).isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  currentSession: PropTypes.object,
};

export default MergeTooltip;
