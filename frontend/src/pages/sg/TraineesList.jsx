import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MagnifyingGlassIcon, 
  XMarkIcon, 
  UserPlusIcon, 
  UsersIcon, 
  EyeIcon,
  TrashIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';
import { createPortal } from 'react-dom';
import traineeService from '../../services/traineeService';
import groupService from '../../services/groupService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';
import Loader from '../../components/ui/Loader';
import { handleApiError } from '../../utils/helpers';

// Reusing the TraineeAbsenceDetailModal from ManageTrainees or importing it if it was a separate component
// Since it's defined inside ManageTrainees in the current codebase, I'll need to either duplicate it or refactor it out.
// For now, I'll create a simplified version here or duplicate the logic to ensure it works as requested.
// Actually, the user asked for "all the function like...", so I should probably implement the details modal here too.

const TraineeDetailsModal = ({ isOpen, onClose, trainee }) => {
  if (!isOpen || !trainee) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Détails du Stagiaire" size="lg">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 p-3 rounded-lg">
            <span className="block text-gray-500 text-xs font-medium mb-1">Nom</span>
            <span className="block text-gray-900 font-semibold text-lg">{trainee.name || '-'}</span>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <span className="block text-gray-500 text-xs font-medium mb-1">Prénom</span>
            <span className="block text-gray-900 font-semibold text-lg">{trainee.firstName || '-'}</span>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <span className="block text-gray-500 text-xs font-medium mb-1">CEF</span>
            <span className="block text-gray-900 font-semibold text-lg">{trainee.cef || '-'}</span>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <span className="block text-gray-500 text-xs font-medium mb-1">Groupe</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {trainee.groupe || 'Non assigné'}
            </span>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg col-span-2">
            <span className="block text-gray-500 text-xs font-medium mb-1">Téléphone</span>
            <span className="block text-gray-900 font-semibold text-lg">{trainee.phone || '-'}</span>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-200 gap-3">
          <Button variant="secondary" onClick={onClose}>Fermer</Button>
        </div>
      </div>
    </Modal>
  );
};

const TraineesList = () => {
  const [trainees, setTrainees] = useState([]);
  const [filteredTrainees, setFilteredTrainees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [availableGroups, setAvailableGroups] = useState([]);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Data
  const [currentTrainee, setCurrentTrainee] = useState(null);
  const [traineeToDelete, setTraineeToDelete] = useState(null);
  const [formData, setFormData] = useState({ cef: '', name: '', firstName: '', groupe: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterTrainees();
  }, [trainees, search, selectedGroup]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [traineesData, groupsData] = await Promise.all([
        traineeService.getAllTrainees({ limit: 1000 }),
        groupService.getAllGroups()
      ]);
      
      const traineesList = Array.isArray(traineesData.data) ? traineesData.data : [];
      setTrainees(traineesList);
      setAvailableGroups(groupsData.map(g => g.name).sort());
    } catch (err) {
      console.error(err);
      setError('Impossible de charger les données.');
    } finally {
      setLoading(false);
    }
  };

  const filterTrainees = useCallback(() => {
    let result = [...trainees];

    if (selectedGroup) {
      result = result.filter(t => t.groupe === selectedGroup);
    }

    if (search) {
      const term = search.toLowerCase();
      result = result.filter(t => 
        (t.cef || '').toLowerCase().includes(term) ||
        (t.name || '').toLowerCase().includes(term) ||
        (t.firstName || '').toLowerCase().includes(term) ||
        (t.groupe || '').toLowerCase().includes(term)
      );
    }

    // Sort by group then name
    result.sort((a, b) => {
      if (a.groupe !== b.groupe) return (a.groupe || '').localeCompare(b.groupe || '');
      if (a.name !== b.name) return (a.name || '').localeCompare(b.name || '');
      return (a.firstName || '').localeCompare(b.firstName || '');
    });

    setFilteredTrainees(result);
  }, [trainees, selectedGroup, search]);

  const handleAddTrainee = () => {
    setCurrentTrainee(null);
    setFormData({
      cef: '',
      name: '',
      firstName: '',
      groupe: availableGroups.length > 0 ? availableGroups[0] : '',
      phone: ''
    });
    setShowModal(true);
  };

  const handleEditTrainee = (trainee) => {
    setCurrentTrainee(trainee);
    setFormData({
      cef: trainee.cef || '',
      name: trainee.name || '',
      firstName: trainee.firstName || '',
      groupe: trainee.groupe || '',
      phone: trainee.phone || ''
    });
    setShowModal(true);
  };

  const handleDeleteClick = (trainee) => {
    setTraineeToDelete(trainee);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!traineeToDelete) return;
    try {
      await traineeService.deleteTrainee(traineeToDelete._id);
      setTrainees(prev => prev.filter(t => t._id !== traineeToDelete._id));
      setShowDeleteModal(false);
      setTraineeToDelete(null);
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (currentTrainee) {
        const updated = await traineeService.updateTrainee(currentTrainee._id, formData);
        setTrainees(prev => prev.map(t => t._id === currentTrainee._id ? updated.data : t));
      } else {
        const created = await traineeService.createTrainee(formData);
        setTrainees(prev => [...prev, created.data]);
      }
      setShowModal(false);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Liste des Stagiaires</h1>
          <p className="text-gray-500 text-sm">Gestion complète des stagiaires</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500">Total Stagiaires</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{filteredTrainees.length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500">Groupes</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{availableGroups.length}</div>
        </div>
        {selectedGroup && (
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-sm font-medium text-gray-500">Dans {selectedGroup}</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {filteredTrainees.filter(t => t.groupe === selectedGroup).length}
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Filtrer par groupe</label>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="w-full rounded-lg border-gray-300 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Tous les groupes</option>
            {availableGroups.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </div>
        <div className="flex-[2]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Rechercher</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, prénom, CEF..."
              className="block w-full pl-10 rounded-lg border-gray-300 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="font-semibold text-gray-900">Détails des Stagiaires</h3>
          <Button variant="primary" onClick={handleAddTrainee} className="flex items-center gap-2">
            <UserPlusIcon className="h-4 w-4" />
            Ajouter
          </Button>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader />
          </div>
        ) : error ? (
          <div className="p-4">
            <Alert type="error">{error}</Alert>
          </div>
        ) : filteredTrainees.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            Aucun stagiaire trouvé.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CEF</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Groupe</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTrainees.map((t) => (
                  <tr key={t._id || t.cef} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs mr-3">
                          {t.firstName?.charAt(0)}{t.name?.charAt(0)}
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {t.name} {t.firstName}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {t.cef}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {t.groupe}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {t.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => { setCurrentTrainee(t); setShowDetailsModal(true); }}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="Détails"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditTrainee(t)}
                          className="text-amber-600 hover:text-amber-900 p-1 rounded hover:bg-amber-50 transition-colors"
                          title="Modifier"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(t)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Supprimer"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        title={currentTrainee ? "Modifier un Stagiaire" : "Ajouter un Stagiaire"}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input 
            label="CEF" 
            name="cef" 
            value={formData.cef} 
            onChange={handleInputChange} 
            required 
            disabled={!!currentTrainee}
            placeholder="Ex: CEF123456"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Nom" 
              name="name" 
              value={formData.name} 
              onChange={handleInputChange} 
              required 
              placeholder="Nom de famille"
            />
            <Input 
              label="Prénom" 
              name="firstName" 
              value={formData.firstName} 
              onChange={handleInputChange} 
              required 
              placeholder="Prénom"
            />
          </div>
          <Select
            label="Groupe"
            name="groupe"
            value={formData.groupe}
            onChange={(val) => setFormData(prev => ({ ...prev, groupe: val }))}
            options={availableGroups.map(g => ({ value: g, label: g }))}
            required
          />
          <Input 
            label="Téléphone" 
            name="phone" 
            value={formData.phone} 
            onChange={handleInputChange} 
            placeholder="06 00 00 00 00"
          />
          
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setShowModal(false)} type="button">Annuler</Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              {currentTrainee ? "Mettre à jour" : "Ajouter"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        title="Confirmer la suppression"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Êtes-vous sûr de vouloir supprimer le stagiaire <strong>{traineeToDelete?.name} {traineeToDelete?.firstName}</strong> ?
            <br />
            Cette action est irréversible.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Annuler</Button>
            <Button variant="danger" onClick={confirmDelete}>Supprimer</Button>
          </div>
        </div>
      </Modal>

      {/* Details Modal */}
      <TraineeDetailsModal 
        isOpen={showDetailsModal} 
        onClose={() => setShowDetailsModal(false)} 
        trainee={currentTrainee} 
      />
    </div>
  );
};

export default TraineesList;
