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
import teacherService from '../../services/teacherService';
import absenceService from '../../services/absenceService';
import groupService from '../../services/groupService';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    myGroupsCount: 0,
    absencesMarked: 0,
    totalStudents: 0,
    pendingActions: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        
        // 1. Fetch Teacher Details to get assigned groups
        const teacherData = await teacherService.getById(user.id);
        const teacherGroups = teacherData.data.groups || []; // Array of group names or objects depending on populate
        
        // 2. Fetch All Groups to get student counts
        // We need to match teacherGroups (names) with actual group objects to get counts if needed
        // Assuming teacherGroups are just names from the controller we saw earlier: groups: teacher.groups.map(g => g.name)
        const allGroups = await groupService.getAllGroups();
        const myGroups = allGroups.filter(g => teacherGroups.includes(g.name));
        
        const totalStudents = myGroups.reduce((acc, curr) => acc + (curr.trainees?.length || 0), 0);

        // 3. Fetch Absences to count marked absences and get recent activity
        // We'll fetch all and filter by teacherId on frontend for now
        const allAbsences = await absenceService.getAll();
        const myAbsences = allAbsences.data.filter(record => 
          record.teacher?._id === user.id || record.teacher === user.id
        );

        // Calculate Stats
        setStats({
          myGroupsCount: teacherGroups.length,
          absencesMarked: myAbsences.length,
          totalStudents: totalStudents,
          pendingActions: 0, // Placeholder
        });

        // Generate Recent Activity
        // Sort by date desc
        const sortedAbsences = myAbsences.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
        
        const activities = sortedAbsences.map(record => {
          const date = new Date(record.date).toLocaleDateString('fr-FR');
          const timeDiff = getTimeDifference(new Date(record.createdAt));
          
          return {
            id: record._id,
            text: `Absences marquées pour ${record.group?.name || 'Groupe'} - ${date}`,
            time: timeDiff
          };
        });
        
        setRecentActivities(activities);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const getTimeDifference = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'À l\'instant';
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
    return `Il y a ${Math.floor(diffInSeconds / 86400)} j`;
  };

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-primary-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Mes Groupes</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.myGroupsCount}</p>
            </div>
            <UserGroupIcon className="h-12 w-12 text-primary-500" />
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
          {recentActivities.length > 0 ? (
            recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <div className="h-2 w-2 bg-primary-500 rounded-full mt-2" />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.text}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">Aucune activité récente</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default TeacherDashboard;
