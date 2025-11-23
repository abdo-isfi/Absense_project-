import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarIcon, 
  ClipboardDocumentCheckIcon,
  UserGroupIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { ROUTES } from '../../utils/constants';
import { useAuthContext } from '../../context/AuthContext';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [stats, setStats] = useState({
    classesToday: 3,
    absencesMarked: 12,
    totalStudents: 45,
    pendingActions: 2,
  });

  const quickActions = [
    {
      title: 'Voir Emploi du Temps',
      description: 'Consultez votre emploi du temps de la semaine',
      icon: CalendarIcon,
      color: 'primary',
      action: () => navigate(ROUTES.TEACHER.SCHEDULE),
    },
    {
      title: 'Gérer les Absences',
      description: 'Marquer les absences pour vos classes',
      icon: ClipboardDocumentCheckIcon,
      color: 'success',
      action: () => navigate(ROUTES.TEACHER.ABSENCE),
    },
  ];

  const recentActivities = [
    { id: 1, text: 'Absences marquées pour Groupe A - 22/11/2025', time: 'Il y a 2 heures' },
    { id: 2, text: 'Absences marquées pour Groupe B - 21/11/2025', time: 'Hier' },
    { id: 3, text: 'Emploi du temps mis à jour', time: 'Il y a 3 jours' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenue, {user?.name || 'Formateur'}
        </h1>
        <p className="text-gray-600 mt-1">
          Voici un aperçu de votre activité aujourd'hui
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 desktop:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-primary-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Classes Aujourd'hui</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.classesToday}</p>
            </div>
            <CalendarIcon className="h-12 w-12 text-primary-500" />
          </div>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Absences Marquées</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.absencesMarked}</p>
            </div>
            <ClipboardDocumentCheckIcon className="h-12 w-12 text-green-500" />
          </div>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Stagiaires</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalStudents}</p>
            </div>
            <UserGroupIcon className="h-12 w-12 text-blue-500" />
          </div>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Actions en Attente</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pendingActions}</p>
            </div>
            <ChartBarIcon className="h-12 w-12 text-yellow-500" />
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card header="Actions Rapides">
        <div className="grid grid-cols-1 desktop:grid-cols-2 gap-4">
          {quickActions.map((action, index) => (
            <div
              key={index}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all cursor-pointer"
              onClick={action.action}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary-100 rounded-lg">
                  <action.icon className="h-6 w-6 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Activity */}
      <Card header="Activité Récente">
        <div className="space-y-4">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
              <div className="h-2 w-2 bg-primary-500 rounded-full mt-2" />
              <div className="flex-1">
                <p className="text-sm text-gray-900">{activity.text}</p>
                <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default TeacherDashboard;
