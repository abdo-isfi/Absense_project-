import PropTypes from 'prop-types';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  XCircleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';
import { cn } from '../../utils/cn';

const Alert = ({ 
  type = 'info', 
  title, 
  children, 
  dismissible = false, 
  onDismiss,
  className 
}) => {
  const types = {
    success: {
      container: 'bg-green-50 border-green-200',
      icon: CheckCircleIcon,
      iconColor: 'text-green-600',
      title: 'text-green-800',
      text: 'text-green-700',
    },
    error: {
      container: 'bg-red-50 border-red-200',
      icon: XCircleIcon,
      iconColor: 'text-red-600',
      title: 'text-red-800',
      text: 'text-red-700',
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200',
      icon: ExclamationTriangleIcon,
      iconColor: 'text-yellow-600',
      title: 'text-yellow-800',
      text: 'text-yellow-700',
    },
    info: {
      container: 'bg-blue-50 border-blue-200',
      icon: InformationCircleIcon,
      iconColor: 'text-blue-600',
      title: 'text-blue-800',
      text: 'text-blue-700',
    },
  };

  const config = types[type];
  const Icon = config.icon;

  return (
    <div className={cn(
      'rounded-lg border p-4',
      config.container,
      className
    )}>
      <div className="flex items-start gap-3">
        <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', config.iconColor)} />
        <div className="flex-1">
          {title && (
            <h3 className={cn('font-semibold mb-1', config.title)}>
              {title}
            </h3>
          )}
          <div className={cn('text-sm', config.text)}>
            {children}
          </div>
        </div>
        {dismissible && (
          <button
            onClick={onDismiss}
            className={cn('flex-shrink-0 rounded-lg p-1 hover:bg-black/5 transition-colors', config.iconColor)}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

Alert.propTypes = {
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  dismissible: PropTypes.bool,
  onDismiss: PropTypes.func,
  className: PropTypes.string,
};

export default Alert;
