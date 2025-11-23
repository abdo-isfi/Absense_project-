import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserGroupIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  PlusIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import Alert from '../../components/ui/Alert';
import absenceService from '../../services/absenceService';
import { ROUTES } from '../../utils/constants';
import { useAuthContext } from '../../context/AuthContext';

const SGDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalTrainees: 0,
    todayAbsences: 0,
    todayLate: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await absenceService.getStats();
      setStats(data.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Impossible de charger les statistiques');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Marquer l\'absence',
      description: 'Enregistrer les absences pour un groupe',
      icon: ClipboardDocumentCheckIcon,
      action: () => navigate(ROUTES.SG.ABSENCE),
      color: 'bg-primary-100 text-primary-600',
    },
    {
      title: 'Ajouter un stagiaire',
      description: 'Inscrire un nouveau stagiaire',
      icon: PlusIcon,
      action: () => navigate(ROUTES.SG.MANAGE_TRAINEES),
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Gérer les stagiaires',
      description: 'Voir la liste complète des stagiaires',
      icon: UserGroupIcon,
      action: () => navigate(ROUTES.SG.MANAGE_TRAINEES),
      color: 'bg-blue-100 text-blue-600',
    },
  ];

  if (loading) return <Loader fullScreen />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Bonjour, {user?.first_name || 'Surveillant'}
        </h1>
        <p className="text-gray-600 mt-1">
          Voici un aperçu de l'activité aujourd'hui
        </p>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Stagiaires</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.totalTrainees}
              </p>
            </div>
            <UserGroupIcon className="h-12 w-12 text-blue-500" />
          </div>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Absences Aujourd'hui</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.todayAbsences}
              </p>
            </div>
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
          </div>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Retards Aujourd'hui</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.todayLate}
              </p>
            </div>
            <ClockIcon className="h-12 w-12 text-yellow-500" />
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <h2 className="text-xl font-semibold text-gray-900 mt-8">Actions Rapides</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={action.action}
            className="flex items-start p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all text-left group"
          >
            <div className={`p-3 rounded-lg ${action.color} group-hover:scale-110 transition-transform`}>
              <action.icon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="font-semibold text-gray-900">{action.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{action.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SGDashboard;
