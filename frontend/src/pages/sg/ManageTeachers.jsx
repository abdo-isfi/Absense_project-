import { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Table from '../../components/ui/Table';
import Loader from '../../components/ui/Loader';
import Badge from '../../components/ui/Badge';
import ScheduleUploadModal from '../../components/admin/ScheduleUploadModal';
import userService from '../../services/userService';
import { USER_ROLES } from '../../utils/constants';

const ManageTeachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Schedule Modal
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const data = await userService.getAllUsers(USER_ROLES.TEACHER);
      setTeachers(data);
    } catch (err) {
      console.error('Error fetching teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase())
  );

  const openScheduleModal = (teacher) => {
    setSelectedTeacher(teacher);
    setShowScheduleModal(true);
  };

  const columns = [
    { header: 'Nom', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { 
      header: 'Groupes', 
      accessor: 'groups',
      render: (teacher) => (
        <div className="flex flex-wrap gap-1">
          {teacher.groups && teacher.groups.length > 0 ? (
            teacher.groups.map((g, i) => (
              <Badge key={i} variant="info" size="sm">{g.name || g}</Badge>
            ))
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )}
        </div>
      )
    },
    { 
      header: 'Actions', 
      accessor: 'actions', 
      render: (teacher) => (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => openScheduleModal(teacher)}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <CalendarDaysIcon className="h-5 w-5" />
          Emploi du temps
        </Button>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Liste des Formateurs</h1>
      </div>

      <Card>
        <div className="mb-6">
          <Input
            placeholder="Rechercher un formateur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={MagnifyingGlassIcon}
            className="max-w-md"
          />
        </div>

        {loading ? (
          <Loader />
        ) : (
          <Table 
            columns={columns} 
            data={filteredTeachers} 
            emptyMessage="Aucun formateur trouvé"
          />
        )}
      </Card>

      {/* Schedule Modal (Read Only mode implied by not showing upload controls if we modify it, 
          but currently it allows upload. For SG, we might want to restrict it. 
          For now, re-using as is, assuming SG can also upload if needed, or we can add a prop to make it read-only) 
      */}
      {selectedTeacher && (
        <ScheduleUploadModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          teacher={selectedTeacher}
          readOnly={true} // We need to add this prop support to ScheduleUploadModal
        />
      )}
    </div>
  );
};

export default ManageTeachers;
