import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { PencilIcon, PlusIcon } from '@heroicons/react/24/outline';
import Card from '../ui/Card';
import Button from '../ui/Button';
import MergeTooltip from './MergeTooltip';
import { canExtend, getNextTimeSlot, getCoveredTimeSlots } from '../../utils/mergeHelpers';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const TIME_SLOTS = ['08:30-11:00', '11:00-13:30', '13:30-16:00', '16:00-18:30'];

const SESSION_TYPE_COLORS = {
  'Cours': 'bg-blue-100 border-blue-300 text-blue-800',
  'TD': 'bg-green-100 border-green-300 text-green-800',
  'TP': 'bg-purple-100 border-purple-300 text-purple-800',
};

const TimetableGrid = ({ sessions, onEditSession, onNext, onBack, activeBlock, onMergeSession, teacherId }) => {
  const [hoveredCell, setHoveredCell] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  const cellRefs = useRef({});

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

  const handleCellClick = (day, timeSlot) => {
    const existingSession = getSession(day, timeSlot);
    // For merged sessions, pass the actual merged session data
    onEditSession(day, existingSession?.isMerged ? existingSession.timeSlot : timeSlot, existingSession);
    setShowTooltip(false); // Hide tooltip on click
  };

  // Handle hover for merge suggestion
  const handleCellHover = (day, timeSlot, event) => {
    // Only show tooltip if:
    // 1. There's an active block
    // 2. The cell is empty
    // 3. The cell is the next consecutive slot
    if (!activeBlock || !onMergeSession) {
      setShowTooltip(false);
      return;
    }

    const existingSession = getSession(day, timeSlot);
    if (existingSession) {
      setShowTooltip(false);
      return;
    }

    // Check if this cell can be merged
    const result = canExtend(activeBlock, day, timeSlot, sessions, teacherId);
    
    if (result.canExtend) {
      const rect = event.currentTarget.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
      setHoveredCell({ day, timeSlot });
      setShowTooltip(true);
    } else {
      setShowTooltip(false);
    }
  };

  const handleCellLeave = () => {
    // Don't auto-hide - let user click buttons
    // Tooltip will only hide when clicking "Oui" or "Non"
  };

  const handleTooltipMouseEnter = () => {
    // Keep tooltip visible
    setShowTooltip(true);
  };

  const handleTooltipMouseLeave = () => {
    // Don't hide when leaving tooltip - only hide on button click
  };

  const handleMergeConfirm = () => {
    if (hoveredCell && onMergeSession) {
      onMergeSession(hoveredCell.day, hoveredCell.timeSlot);
      setShowTooltip(false);
    }
  };

  const handleMergeCancel = () => {
    setShowTooltip(false);
  };

  // Check if a cell should be rendered (not part of a merged session)
  const shouldRenderCell = (day, timeSlot) => {
    // Find if there's a merged session on this day that covers this slot
    for (const session of sessions) {
      if (session.isMerged && session.day === day) {
        const coveredSlots = getCoveredTimeSlots(session);
        // If this slot is covered by a merged session but is NOT the first slot, skip it
        if (coveredSlots.includes(timeSlot)) {
          // Only render the first slot of the merged session
          return coveredSlots[0] === timeSlot;
        }
      }
    }
    return true;
  };

  // Get rowspan for merged sessions
  const getRowSpan = (session) => {
    if (session?.isMerged) {
      const coveredSlots = getCoveredTimeSlots(session);
      return coveredSlots.length;
    }
    return 1;
  };

  const getFilledSessionsCount = () => {
    return sessions.length;
  };

  const getTotalCells = () => {
    return DAYS.length * TIME_SLOTS.length;
  };

  // Calculate total hours including merged sessions
  const getTotalHours = () => {
    return sessions.reduce((total, session) => {
      if (session.isMerged && session.originalSlots) {
        // Each slot is 2.5 hours
        return total + (session.originalSlots.length * 2.5);
      }
      return total + 2.5; // Regular session = 2.5 hours
    }, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Emploi du temps</h2>
        <p className="text-gray-600 mt-1">
          Cliquez sur une cellule pour ajouter ou modifier une séance
        </p>
      </div>

      {/* Progress */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Progression</p>
            <p className="text-2xl font-bold text-gray-900">
              {getFilledSessionsCount()} / {getTotalCells()} séances
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Heures totales</p>
            <p className="text-2xl font-bold text-primary-600">
              {getTotalHours().toFixed(1)}h
            </p>
          </div>
        </div>
      </Card>

      {/* Timetable Grid */}
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
                      const colSpan = session?.isMerged ? getCoveredTimeSlots(session).length : 1;
                      
                      return (
                        <td
                          key={`${day}-${timeSlot}`}
                          className="px-2 py-2"
                          colSpan={colSpan}
                        >
                          <button
                            onClick={() => handleCellClick(day, timeSlot)}
                            onMouseEnter={(e) => handleCellHover(day, timeSlot, e)}
                            onMouseLeave={handleCellLeave}
                            className={`w-full h-24 rounded-lg border-2 transition-all hover:shadow-md ${
                              session
                                ? `${SESSION_TYPE_COLORS[session.type]} hover:opacity-80 ${
                                    session.mode === 'À distance' ? 'border-dashed border-purple-400' : ''
                                  }`
                                : 'border-dashed border-gray-300 hover:border-primary-400 hover:bg-primary-50'
                            }`}
                          >
                            {session ? (
                              <div className="p-2 h-full flex flex-col justify-center items-center text-center">
                                <p className="text-xl font-extrabold text-gray-900 truncate w-full">
                                  {session.group?.name || session.group}
                                </p>
                                <p className="text-sm font-bold text-gray-700 truncate w-full mt-1">
                                  {session.room}
                                </p>
                                {session.subject && (
                                  <p className="text-xs text-gray-500 truncate w-full mt-1">
                                    {session.subject}
                                  </p>
                                )}
                                
                                {/* Type and Mode Badges */}
                                <div className="flex gap-1 mt-2 flex-wrap justify-center">
                                  {/* Type Badge */}
                                  <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    session.type === 'Cours' 
                                      ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                                      : session.type === 'TD'
                                      ? 'bg-orange-100 text-orange-700 border border-orange-300'
                                      : 'bg-pink-100 text-pink-700 border border-pink-300'
                                  }`}>
                                    {session.type === 'Cours' ? '📚 Cours' : session.type === 'TD' ? '✏️ TD' : '🔬 TP'}
                                  </div>
                                  
                                  {/* Mode Badge */}
                                  {session.mode && (
                                    <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                      session.mode === 'À distance' 
                                        ? 'bg-purple-100 text-purple-700 border border-purple-300' 
                                        : 'bg-green-100 text-green-700 border border-green-300'
                                    }`}>
                                      {session.mode === 'À distance' ? '🌐 Distance' : '🏫 Présentiel'}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <PlusIcon className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </button>
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

      {/* Merge Tooltip - Rendered at top level for proper positioning */}
      <div
        onMouseEnter={handleTooltipMouseEnter}
        onMouseLeave={handleTooltipMouseLeave}
      >
        <MergeTooltip
          isVisible={showTooltip}
          position={tooltipPosition}
          onConfirm={handleMergeConfirm}
          onCancel={handleMergeCancel}
          currentSession={activeBlock}
        />
      </div>

      {/* Legend */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Légende</h3>
        <div className="flex flex-wrap gap-4">
          {Object.entries(SESSION_TYPE_COLORS).map(([type, colorClass]) => (
            <div key={type} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded border-2 ${colorClass}`} />
              <span className="text-sm text-gray-700">{type}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button
          variant="outline"
          size="lg"
          onClick={onBack}
        >
          Retour
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={onNext}
        >
          Aperçu et Enregistrer
        </Button>
      </div>
    </div>
  );
};

TimetableGrid.propTypes = {
  sessions: PropTypes.array.isRequired,
  onEditSession: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  activeBlock: PropTypes.object,
  onMergeSession: PropTypes.func,
  teacherId: PropTypes.string,
};

export default TimetableGrid;
