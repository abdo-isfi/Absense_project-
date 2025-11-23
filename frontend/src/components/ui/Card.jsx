import PropTypes from 'prop-types';
import { cn } from '../../utils/cn';

const Card = ({ 
  children, 
  className,
  header,
  footer,
  hoverable = false,
  padding = true
}) => {
  return (
    <div className={cn(
      'bg-white rounded-xl border border-gray-200 shadow-sm',
      hoverable && 'transition-shadow duration-200 hover:shadow-lg',
      className
    )}>
      {header && (
        <div className="px-6 py-4 border-b border-gray-200">
          {typeof header === 'string' ? (
            <h3 className="text-lg font-semibold text-gray-900">{header}</h3>
          ) : (
            header
          )}
        </div>
      )}
      
      <div className={cn(padding && 'p-6')}>
        {children}
      </div>

      {footer && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          {footer}
        </div>
      )}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  header: PropTypes.node,
  footer: PropTypes.node,
  hoverable: PropTypes.bool,
  padding: PropTypes.bool,
};

export default Card;
