import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MagnifyingGlassIcon, UserIcon } from '@heroicons/react/24/outline';
import teacherService from '../../services/teacherService';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Loader from '../ui/Loader';
import Alert from '../ui/Alert';
import { handleApiError } from '../../utils/helpers';

const TeacherSelection = ({ selectedTeacher, onSelectTeacher, onNext }) => {
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const teachersPerPage = 20;

  useEffect(() => {
    fetchTeachers();
  }, []);

  useEffect(() => {
    filterTeachers();
  }, [searchTerm, teachers]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await teacherService.getAll();
      setTeachers(response.data || []);
      setFilteredTeachers(response.data || []);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const filterTeachers = () => {
    if (!searchTerm.trim()) {
      setFilteredTeachers(teachers);
      setCurrentPage(1);
      return;
    }

    const filtered = teachers.filter(teacher => {
      const fullName = `${teacher.firstName} ${teacher.lastName}`.toLowerCase();
      const search = searchTerm.toLowerCase();
      return (
        fullName.includes(search) ||
        teacher.email.toLowerCase().includes(search) ||
        teacher.matricule.toLowerCase().includes(search)
      );
    });

    setFilteredTeachers(filtered);
    setCurrentPage(1);
  };

  // Pagination
  const indexOfLastTeacher = currentPage * teachersPerPage;
  const indexOfFirstTeacher = indexOfLastTeacher - teachersPerPage;
  const currentTeachers = filteredTeachers.slice(indexOfFirstTeacher, indexOfLastTeacher);
  const totalPages = Math.ceil(filteredTeachers.length / teachersPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return <Loader text="Chargement des formateurs..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Sélectionner un formateur</h2>
        <p className="text-gray-600 mt-1">
          Choisissez le formateur pour lequel vous souhaitez créer un emploi du temps
        </p>
      </div>

      {error && (
        <Alert type="error" dismissible onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Search */}
      <div className="relative">
        <Input
          type="text"
          placeholder="Rechercher par nom, email ou matricule..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={MagnifyingGlassIcon}
        />
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-600">
        {filteredTeachers.length} formateur{filteredTeachers.length !== 1 ? 's' : ''} trouvé{filteredTeachers.length !== 1 ? 's' : ''}
      </div>

      {/* Teacher Grid */}
      {currentTeachers.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucun formateur trouvé</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 desktop:grid-cols-2 gap-4">
          {currentTeachers.map((teacher) => (
            <div
              key={teacher._id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectTeacher(teacher);
              }}
            >
              <Card
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedTeacher?._id === teacher._id
                    ? 'ring-2 ring-primary-500 bg-primary-50'
                    : 'hover:border-primary-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-primary-600">
                      {teacher.firstName[0]}{teacher.lastName[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {teacher.firstName} {teacher.lastName}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">{teacher.email}</p>
                    <p className="text-sm text-gray-500">Matricule: {teacher.matricule}</p>
                    {teacher.groups && teacher.groups.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {teacher.groups.slice(0, 3).map((group, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {group.name || group}
                          </span>
                        ))}
                        {teacher.groups.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{teacher.groups.length - 3} autres
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {selectedTeacher?._id === teacher._id && (
                    <div className="flex-shrink-0">
                      <div className="h-6 w-6 bg-primary-600 rounded-full flex items-center justify-center">
                        <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Précédent
          </Button>
          <div className="flex gap-1">
            {[...Array(totalPages)].map((_, idx) => (
              <button
                key={idx + 1}
                onClick={() => handlePageChange(idx + 1)}
                className={`px-3 py-1 rounded ${
                  currentPage === idx + 1
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Suivant
          </Button>
        </div>
      )}

      {/* Next Button */}
      <div className="flex justify-end pt-6 border-t">
        <Button
          variant="primary"
          size="lg"
          onClick={onNext}
          disabled={!selectedTeacher}
        >
          Suivant
        </Button>
      </div>
    </div>
  );
};

TeacherSelection.propTypes = {
  selectedTeacher: PropTypes.object,
  onSelectTeacher: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
};

export default TeacherSelection;
