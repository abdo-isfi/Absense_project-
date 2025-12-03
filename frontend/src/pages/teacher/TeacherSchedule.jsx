import { useState, useEffect } from 'react';
import { useAuthContext } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import Loader from '../../components/ui/Loader';
import { CalendarIcon } from '@heroicons/react/24/outline';
import scheduleService from '../../services/scheduleService';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const TIME_SLOTS = ['08:30-11:00', '11:00-13:30', '13:30-16:00', '16:00-18:30'];

const SESSION_TYPE_COLORS = {
  'Cours': 'bg-blue-100 border-blue-300 text-blue-800',
  'TD': 'bg-green-100 border-green-300 text-green-800',
  'TP': 'bg-purple-100 border-purple-300 text-purple-800',
};

const TeacherSchedule = () => {
  const { user } = useAuthContext();
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        // Fetch schedule from database
        const response = await scheduleService.getScheduleByTeacher(user.id);
        
        // Backend returns { success: true, data: schedule } where schedule is a single object
        if (response.success && response.data) {
          setSchedule(response.data);
        } else {
          setSchedule(null);
        }
      } catch (err) {
        console.error('Error loading schedule:', err);
        // If 404, it means no schedule exists yet
        if (err.response?.status === 404) {
          setSchedule(null);
        } else {
          setError('Impossible de charger l\'emploi du temps.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [user]);

  const getSession = (day, timeSlot) => {
    if (!schedule?.sessions) return null;
    
    // First check for exact match
    const exactMatch = schedule.sessions.find(s => s.day === day && s.timeSlot === timeSlot);
    if (exactMatch) return exactMatch;
    
    // Check if this slot is part of a merged session
    const mergedSession = schedule.sessions.find(s => {
      if (s.isMerged && s.day === day && s.originalSlots) {
        return s.originalSlots[0] === timeSlot;
      }
      return false;
    });
    
    return mergedSession || null;
  };

  const shouldRenderCell = (day, timeSlot) => {
    if (!schedule?.sessions) return true;
    
    for (const session of schedule.sessions) {
      if (session.isMerged && session.day === day && session.originalSlots) {
        if (session.originalSlots.includes(timeSlot)) {
          return session.originalSlots[0] === timeSlot;
        }
      }
    }
    return true;
  };

  const getCoveredTimeSlots = (session) => {
    if (session?.originalSlots) {
      return session.originalSlots;
    }
    return [session.timeSlot];
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <CalendarIcon className="h-8 w-8 text-primary-600" />
          Mon Emploi du Temps
        </h1>
        <p className="text-gray-600 mt-1">
          Consultez votre emploi du temps hebdomadaire
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <Alert type="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Schedule Display */}
      {!schedule ? (
        <Alert type="info" title="Aucun emploi du temps">
          Votre emploi du temps n'a pas encore été créé par l'administrateur.
          Veuillez contacter l'administration.
        </Alert>
      ) : (
        <>
          {/* Academic Year Info */}
          <Card>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Année académique</p>
                <p className="text-lg font-bold text-gray-900">{schedule.academicYear}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Dernière mise à jour</p>
                <p className="text-lg font-bold text-gray-900">
                  {new Date(schedule.updatedAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          </Card>

          {/* Timetable Grid */}
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
                              return null;
                            }

                            const session = getSession(day, timeSlot);
                            const colSpan = session?.isMerged ? getCoveredTimeSlots(session).length : 1;
                            
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
                                        
                                        {/* Subject Badge */}
                                        {session.subject && (
                                          <div className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">
                                            📖 {session.subject}
                                          </div>
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
        </>
      )}
    </div>
  );
};

export default TeacherSchedule;
