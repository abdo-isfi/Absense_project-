import PropTypes from 'prop-types';
import { DocumentArrowDownIcon, PencilIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { exportToPDF } from '../../utils/pdfExport';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const TIME_SLOTS = ['08:30-11:00', '11:00-13:30', '13:30-16:00', '16:00-18:30'];

const SESSION_TYPE_COLORS = {
  'Cours': 'bg-blue-100 border-blue-300 text-blue-800',
  'TD': 'bg-green-100 border-green-300 text-green-800',
  'TP': 'bg-purple-100 border-purple-300 text-purple-800',
};

const ScheduleSummary = ({
  teacher,
  sessions,
  onSave,
  onEdit,
  onStartOver,
  saving,
}) => {
  const getSession = (day, timeSlot) => {
    // First check for exact match
    const exactMatch = sessions.find(s => s.day === day && s.timeSlot === timeSlot);
    if (exactMatch) return exactMatch;
    
    // Check if this slot is part of a merged session
    const mergedSession = sessions.find(s => {
      if (s.isMerged && s.day === day && s.originalSlots) {
        return s.originalSlots[0] === timeSlot; // Return session if this is the first slot
      }
      return false;
    });
    
    return mergedSession || null;
  };

  const getTotalHours = () => {
    return sessions.reduce((total, session) => {
      if (session.isMerged && session.originalSlots) {
        // Each slot is 2.5 hours
        return total + (session.originalSlots.length * 2.5);
      }
      return total + 2.5; // Regular session = 2.5 hours
    }, 0).toFixed(1);
  };

  const getSessionsByType = () => {
    const counts = { Cours: 0, TD: 0, TP: 0 };
    sessions.forEach(s => {
      counts[s.type] = (counts[s.type] || 0) + 1;
    });
    return counts;
  };

  const getSessionsByMode = () => {
    const counts = { 'Présentiel': 0, 'À distance': 0 };
    sessions.forEach(s => {
      if (s.mode) {
        counts[s.mode] = (counts[s.mode] || 0) + 1;
      }
    });
    return counts;
  };

  const handleExportPDF = () => {
    exportToPDF(teacher, sessions);
  };

  const sessionsByType = getSessionsByType();
  const sessionsByMode = getSessionsByMode();

  // Check if a cell should be rendered (not part of a merged session)
  const shouldRenderCell = (day, timeSlot) => {
    for (const session of sessions) {
      if (session.isMerged && session.day === day && session.originalSlots) {
        // Only render the first slot of the merged session
        if (session.originalSlots.includes(timeSlot)) {
          return session.originalSlots[0] === timeSlot;
        }
      }
    }
    return true;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Aperçu de l'emploi du temps</h2>
        <p className="text-gray-600 mt-1">
          Vérifiez les informations avant de sauvegarder
        </p>
      </div>

      {/* Teacher Info */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations du formateur</h3>
        <div className="grid grid-cols-1 desktop:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Nom complet</p>
            <p className="font-medium text-gray-900">
              {teacher.firstName} {teacher.lastName}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-medium text-gray-900">{teacher.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Matricule</p>
            <p className="font-medium text-gray-900">{teacher.matricule}</p>
          </div>
        </div>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 desktop:grid-cols-5 gap-4">
        <Card>
          <p className="text-sm text-gray-600">Total séances</p>
          <p className="text-3xl font-bold text-primary-600">{sessions.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Heures totales</p>
          <p className="text-3xl font-bold text-primary-600">{getTotalHours()}h</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Cours</p>
          <p className="text-3xl font-bold text-blue-600">{sessionsByType.Cours}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">TD / TP</p>
          <p className="text-3xl font-bold text-orange-600">
            {sessionsByType.TD + sessionsByType.TP}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">🏫 Présentiel</p>
          <p className="text-3xl font-bold text-green-600">{sessionsByMode['Présentiel']}</p>
          <p className="text-xs text-gray-500 mt-1">🌐 Distance: {sessionsByMode['À distance']}</p>
        </Card>
      </div>

      {/* Timetable Preview */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Emploi du temps complet</h3>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Jour
                    </th>
                    {TIME_SLOTS.map((slot) => (
                      <th
                        key={slot}
                        className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-48 min-w-[12rem]"
                      >
                        {slot}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {DAYS.map((day) => (
                    <tr key={day}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">
                        {day}
                      </td>
                      {TIME_SLOTS.map((timeSlot) => {
                        if (!shouldRenderCell(day, timeSlot)) {
                          return null; // Skip cells that are part of merged sessions
                        }

                        const session = getSession(day, timeSlot);
                        const colSpan = session?.isMerged && session.originalSlots 
                          ? session.originalSlots.length 
                          : 1;
                        
                        return (
                          <td
                            key={`${day}-${timeSlot}`}
                            className="px-2 py-2"
                            colSpan={colSpan}
                          >
                            {session ? (
                              <div className={`p-3 rounded-lg border-2 ${SESSION_TYPE_COLORS[session.type]} h-24`}>
                                <div className="text-center h-full flex flex-col justify-center items-center">
                                  <div className="w-full">
                                    <p className="text-xl font-extrabold text-gray-900 truncate w-full">
                                      {session.group?.name || session.group}
                                    </p>
                                    <p className="text-sm font-bold text-gray-700 truncate w-full mt-1">
                                      {session.room}
                                    </p>
                                  </div>
                                  <div className="flex gap-1 flex-wrap mt-2">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                      session.type === 'Cours' 
                                        ? 'bg-blue-200 text-blue-800' 
                                        : session.type === 'TD'
                                        ? 'bg-orange-200 text-orange-800'
                                        : 'bg-pink-200 text-pink-800'
                                    }`}>
                                      {session.type === 'Cours' ? '📚 Cours' : session.type === 'TD' ? '✏️ TD' : '🔬 TP'}
                                    </span>
                                    {session.mode && (
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                        session.mode === 'À distance' 
                                          ? 'bg-purple-200 text-purple-800' 
                                          : 'bg-green-200 text-green-800'
                                      }`}>
                                        {session.mode === 'À distance' ? '🌐 Distance' : '🏫 Présentiel'}
                                      </span>
                                    )}
                                    {session.subject && (
                                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-800">
                                        📖 {session.subject}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="h-24 border-2 border-dashed border-gray-200 rounded-lg" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 justify-between pt-6 border-t">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onStartOver}
            icon={ArrowPathIcon}
            disabled={saving}
          >
            Recommencer
          </Button>
          <Button
            variant="outline"
            onClick={onEdit}
            icon={PencilIcon}
            disabled={saving}
          >
            Modifier
          </Button>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={handleExportPDF}
            icon={DocumentArrowDownIcon}
            disabled={saving}
          >
            Exporter en PDF
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={onSave}
            loading={saving}
          >
            Enregistrer l'emploi du temps
          </Button>
        </div>
      </div>
    </div>
  );
};

ScheduleSummary.propTypes = {
  teacher: PropTypes.object.isRequired,
  sessions: PropTypes.array.isRequired,
  onSave: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onStartOver: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};

export default ScheduleSummary;
