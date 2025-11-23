import { useState, useEffect } from 'react';
import { useAuthContext } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import Loader from '../../components/ui/Loader';
import { CalendarIcon } from '@heroicons/react/24/outline';

const TeacherSchedule = () => {
  const { user } = useAuthContext();
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to load schedule from localStorage first (uploaded by admin)
    const loadSchedule = () => {
      try {
        const savedSchedule = localStorage.getItem(`teacher_schedule_${user?.id}`);
        if (savedSchedule) {
          setSchedule(JSON.parse(savedSchedule));
        }
      } catch (error) {
        console.error('Error loading schedule:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadSchedule();
    }
  }, [user]);

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

      {/* Schedule Display */}
      {!schedule ? (
        <Alert type="info" title="Aucun emploi du temps">
          Votre emploi du temps n'a pas encore été téléchargé par l'administrateur.
          Veuillez contacter l'administration.
        </Alert>
      ) : (
        <Card>
          <div className="space-y-4">
            {schedule.type === 'image' && (
              <div className="flex justify-center">
                <img 
                  src={schedule.url} 
                  alt="Emploi du temps" 
                  className="max-w-full h-auto rounded-lg shadow-lg border border-gray-200"
                />
              </div>
            )}
            
            {schedule.type === 'pdf' && (
              <div className="w-full h-[800px]">
                <iframe
                  src={schedule.url}
                  className="w-full h-full rounded-lg border border-gray-200"
                  title="Emploi du temps PDF"
                />
              </div>
            )}

            <div className="text-sm text-gray-500 text-center pt-4 border-t">
              Dernière mise à jour: {schedule.uploadedAt ? new Date(schedule.uploadedAt).toLocaleDateString('fr-FR') : 'Non disponible'}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default TeacherSchedule;
