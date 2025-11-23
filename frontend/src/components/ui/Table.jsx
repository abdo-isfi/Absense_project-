import PropTypes from 'prop-types';
import { cn } from '../../utils/cn';

const Table = ({ 
  columns, 
  data, 
  className,
  hoverable = true,
  striped = false
}) => {
  return (
    <div className="overflow-x-auto">
      <table className={cn('min-w-full divide-y divide-gray-200', className)}>
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className={cn(
                  'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                  column.headerClassName
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={cn(
          'bg-white divide-y divide-gray-200',
          striped && 'divide-y-0'
        )}>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={cn(
                hoverable && 'hover:bg-gray-50 transition-colors',
                striped && rowIndex % 2 === 0 && 'bg-gray-50'
              )}
            >
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className={cn(
                    'px-6 py-4 whitespace-nowrap text-sm text-gray-900',
                    column.cellClassName
                  )}
                >
                  {column.render 
                    ? column.render(row[column.accessor], row, rowIndex)
                    : row[column.accessor]
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No data available
        </div>
      )}
    </div>
  );
};

Table.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.shape({
    header: PropTypes.string.isRequired,
    accessor: PropTypes.string.isRequired,
    render: PropTypes.func,
    headerClassName: PropTypes.string,
    cellClassName: PropTypes.string,
  })).isRequired,
  data: PropTypes.array.isRequired,
  className: PropTypes.string,
  hoverable: PropTypes.bool,
  striped: PropTypes.bool,
};

export default Table;
