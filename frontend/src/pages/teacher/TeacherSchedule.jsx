import { useState, useEffect } from 'react';
import { useAuthContext } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import Loader from '../../components/ui/Loader';
import { CalendarIcon } from '@heroicons/react/24/outline';
import teacherService from '../../services/teacherService';
import { API_URL } from '../../utils/constants';

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
        // Fetch fresh teacher data to get the schedule path
        const teacherData = await teacherService.getById(user.id);
        
        if (teacherData.data.schedulePath) {
          const baseUrl = API_URL.replace('/api', '');
          const scheduleUrl = `${baseUrl}/${teacherData.data.schedulePath}`;
          const isPdf = teacherData.data.schedulePath.toLowerCase().endsWith('.pdf');
          
          setSchedule({
            url: scheduleUrl,
            type: isPdf ? 'pdf' : 'image',
            uploadedAt: teacherData.data.updatedAt
          });
        } else {
          setSchedule(null);
        }
      } catch (err) {
        console.error('Error loading schedule:', err);
        setError('Impossible de charger l\'emploi du temps.');
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
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

      {/* Error Message */}
      {error && (
        <Alert type="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

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
