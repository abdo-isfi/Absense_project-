import { useNavigate } from 'react-router-dom';
import { 
  UsersIcon, 
  UserPlusIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useState, useEffect } from 'react';
import { ROUTES, USER_ROLES } from '../../utils/constants';
import { useAuthContext } from '../../context/AuthContext';
import userService from '../../services/userService';
import groupService from '../../services/groupService';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const [stats, setStats] = useState([
    { label: 'Formateurs', value: 0, icon: UsersIcon, color: 'success' },
    { label: 'Surveillants Généraux', value: 0, icon: UsersIcon, color: 'info' },
    { label: 'Groupes', value: 0, icon: UsersIcon, color: 'primary' },
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [users, groups] = await Promise.all([
          userService.getAllUsers('all'),
          groupService.getAllGroups()
        ]);

        const teachersCount = users.filter(u => u.role === USER_ROLES.TEACHER).length;
        const sgCount = users.filter(u => u.role === USER_ROLES.SG).length;
        const groupsCount = groups.data ? groups.data.length : (Array.isArray(groups) ? groups.length : 0);

        setStats([
          { label: 'Formateurs', value: teachersCount, icon: UsersIcon, color: 'success' },
          { label: 'Surveillants Généraux', value: sgCount, icon: UsersIcon, color: 'info' },
          { label: 'Groupes', value: groupsCount, icon: UsersIcon, color: 'primary' },
        ]);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  const quickActions = [
    {
      title: 'Ajouter un Utilisateur',
      description: 'Créer un nouveau compte utilisateur',
      icon: UserPlusIcon,
      color: 'primary',
      action: () => navigate(ROUTES.ADMIN.ADD_USER),
    },
    {
      title: 'Gérer les Utilisateurs',
      description: 'Voir et modifier les utilisateurs existants',
      icon: UsersIcon,
      color: 'success',
      action: () => navigate(ROUTES.ADMIN.MANAGE_USERS),
    },
    {
      title: 'Statistiques',
      description: 'Voir les statistiques du système',
      icon: ChartBarIcon,
      color: 'info',
      action: () => {},
    },
    {
      title: 'Paramètres',
      description: 'Configurer le système',
      icon: Cog6ToothIcon,
      color: 'default',
      action: () => {},
    },
  ];

  const recentActivities = [
    { id: 1, text: 'Nouvel utilisateur créé: teacher@ofppt.ma', time: 'Il y a 2 heures' },
    { id: 2, text: 'Mot de passe réinitialisé pour sg@ofppt.ma', time: 'Hier' },
    { id: 3, text: 'Utilisateur supprimé: old.user@ofppt.ma', time: 'Il y a 3 jours' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenue, {user?.name || 'Administrateur'}
        </h1>
        <p className="text-gray-600 mt-1">
          Tableau de bord d'administration
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 desktop:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className={`border-l-4 border-l-${stat.color}-500`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <stat.icon className={`h-12 w-12 text-${stat.color}-500`} />
            </div>
          </Card>
        ))}
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

export default AdminDashboard;
