import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Table from '../../components/ui/Table';
import Loader from '../../components/ui/Loader';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import ScheduleUploadModal from '../../components/admin/ScheduleUploadModal';
import userService from '../../services/userService';
import { USER_ROLES } from '../../utils/constants';

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const ManageTeachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  
  // Debounced search value
  const debouncedSearch = useDebounce(search, 300);
  
  // Schedule Modal
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await userService.getAllUsers(USER_ROLES.TEACHER);
      setTeachers(data || []);
    } catch (err) {
      console.error('Error fetching teachers:', err);
      setError('Erreur lors du chargement des formateurs');
    } finally {
      setLoading(false);
    }
  };

  // Memoized filtered teachers using debounced search
  const filteredTeachers = useMemo(() => {
    if (!debouncedSearch.trim()) return teachers;
    
    const searchLower = debouncedSearch.toLowerCase();
    return teachers.filter(t => 
      t.name?.toLowerCase().includes(searchLower) ||
      t.email?.toLowerCase().includes(searchLower)
    );
  }, [teachers, debouncedSearch]);

  const openScheduleModal = useCallback((teacher) => {
    setSelectedTeacher(teacher);
    setShowScheduleModal(true);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearch('');
  }, []);

  const columns = useMemo(() => [
    { header: 'Nom', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { 
      header: 'Groupes', 
      accessor: 'groups',
      render: (groups) => (
        <div className="flex flex-wrap gap-1">
          {groups && groups.length > 0 ? (
            groups.map((g, i) => (
              <Badge key={g._id || i} variant="info" size="sm">
                {g.name || g}
              </Badge>
            ))
          ) : (
            <span className="text-gray-400 text-sm">Aucun groupe</span>
          )}
        </div>
      )
    },
    { 
      header: 'Actions', 
      accessor: 'actions', 
      render: (_, teacher) => (
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
  ], [openScheduleModal]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Liste des Formateurs</h1>
      </div>

      {error && (
        <Alert type="error" dismissible onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card>
        <div className="mb-6">
          <div className="relative max-w-md">
            <Input
              placeholder="Rechercher un formateur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={MagnifyingGlassIcon}
            />
            {search && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Effacer la recherche"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <Loader />
        ) : (
          <>
            <Table 
              columns={columns} 
              data={filteredTeachers} 
              emptyMessage={
                search 
                  ? `Aucun formateur trouvé pour "${search}"`
                  : "Aucun formateur trouvé"
              }
            />
            {filteredTeachers.length > 0 && (
              <div className="mt-4 text-sm text-gray-500 text-center">
                {filteredTeachers.length} formateur{filteredTeachers.length > 1 ? 's' : ''} affiché{filteredTeachers.length > 1 ? 's' : ''}
                {search && ` sur ${teachers.length} au total`}
              </div>
            )}
          </>
        )}
      </Card>

      {/* Schedule Modal (Read Only for SG) */}
      {selectedTeacher && (
        <ScheduleUploadModal
          isOpen={showScheduleModal}
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedTeacher(null);
          }}
          teacher={selectedTeacher}
          readOnly={true}
        />
      )}
    </div>
  );
};

export default ManageTeachers;
