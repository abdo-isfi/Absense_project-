import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MagnifyingGlassIcon, 
  PencilIcon, 
  TrashIcon,
  KeyIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';
import { USER_ROLES } from '../../utils/constants';
import userService from '../../services/userService';
import GroupManagementModal from '../../components/admin/GroupManagementModal';
import ScheduleUploadModal from '../../components/admin/ScheduleUploadModal';

const ManageUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Fetch users from API
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getAllUsers('all');
      // Normalize data structure
      const normalizedUsers = data.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive !== undefined ? user.isActive : (user.status === 'active'),
        createdAt: user.createdAt,
        groups: user.groups || [] // Ensure groups array exists
      }));
      setUsers(normalizedUsers);
    } catch (err) {
      setError('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <Badge variant="success">
        <CheckCircleIcon className="h-4 w-4 mr-1 inline" />
        Actif
      </Badge>
    ) : (
      <Badge variant="default">
        <XCircleIcon className="h-4 w-4 mr-1 inline" />
        Inactif
      </Badge>
    );
  };

  const filteredUsers = users.filter(user => {
    return user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           user.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const sgUsers = filteredUsers.filter(u => u.role === USER_ROLES.SG);
  const teacherUsers = filteredUsers.filter(u => u.role === USER_ROLES.TEACHER);

  const handleDelete = async () => {
    try {
      await userService.deleteUser(selectedUser.id, selectedUser.role);
      
      setUsers(users.filter(u => u.id !== selectedUser.id));
      setSuccess(`Utilisateur ${selectedUser.email} supprimé avec succès`);
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (err) {
      setError('Erreur lors de la suppression de l\'utilisateur');
    }
  };

  const handleResetPassword = async () => {
    try {
      // TODO: Implement reset password API call
      setSuccess(`Mot de passe réinitialisé pour ${selectedUser.email}`);
      setShowResetPasswordModal(false);
      setSelectedUser(null);
    } catch (err) {
      setError('Erreur lors de la réinitialisation du mot de passe');
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const newStatus = !user.isActive;
      await userService.updateUser(user.id, { isActive: newStatus }, user.role);
      
      setUsers(users.map(u => 
        u.id === user.id ? { ...u, isActive: newStatus } : u
      ));
      setSuccess(`Statut de ${user.email} mis à jour`);
    } catch (err) {
      setError('Erreur lors de la mise à jour du statut');
    }
  };

  // Base columns for both tables
  const baseColumns = [
    {
      header: 'Nom',
      accessor: 'name',
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.email}</div>
        </div>
      ),
    },
    {
      header: 'Statut',
      accessor: 'isActive',
      render: (value) => getStatusBadge(value),
    },
    {
      header: 'Date de création',
      accessor: 'createdAt',
      render: (value) => new Date(value).toLocaleDateString('fr-FR'),
    },
  ];

  // SG Table Columns
  const sgColumns = [
    ...baseColumns,
    {
      header: 'Actions',
      accessor: 'id',
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleToggleStatus(row)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title={row.isActive ? 'Désactiver' : 'Activer'}
          >
            {row.isActive ? <XCircleIcon className="h-5 w-5" /> : <CheckCircleIcon className="h-5 w-5" />}
          </button>
          <button
            onClick={() => { setSelectedUser(row); setShowResetPasswordModal(true); }}
            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
            title="Réinitialiser le mot de passe"
          >
            <KeyIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => navigate(`/admin/edit/${row.id}`)}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Modifier"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => { setSelectedUser(row); setShowDeleteModal(true); }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Supprimer"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      ),
    },
  ];

  // Teacher Table Columns
  const teacherColumns = [
    ...baseColumns,
    {
      header: 'Gestion',
      accessor: 'id',
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => { setSelectedUser(row); setShowGroupModal(true); }}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Gérer les groupes"
          >
            <UserGroupIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => { setSelectedUser(row); setShowScheduleModal(true); }}
            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            title="Emploi du temps"
          >
            <CalendarDaysIcon className="h-5 w-5" />
          </button>
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleToggleStatus(row)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title={row.isActive ? 'Désactiver' : 'Activer'}
          >
            {row.isActive ? <XCircleIcon className="h-5 w-5" /> : <CheckCircleIcon className="h-5 w-5" />}
          </button>
          <button
            onClick={() => { setSelectedUser(row); setShowResetPasswordModal(true); }}
            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
            title="Réinitialiser le mot de passe"
          >
            <KeyIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => navigate(`/admin/edit/${row.id}`)}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Modifier"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => { setSelectedUser(row); setShowDeleteModal(true); }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Supprimer"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gérer les Utilisateurs</h1>
          <p className="text-gray-600 mt-1">
            Gérez les Surveillants Généraux et les Formateurs
          </p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => navigate('/admin/ajouter')}
        >
          Ajouter un utilisateur
        </Button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert type="success" dismissible onDismiss={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert type="error" dismissible onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Search */}
      <Card>
        <div className="relative">
          <Input
            placeholder="Rechercher par nom ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </Card>

      {/* SG Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span className="bg-info-100 text-info-700 p-1 rounded">SG</span>
          Surveillants Généraux
          <Badge variant="info" size="sm">{sgUsers.length}</Badge>
        </h2>
        <Card padding={false}>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : (
            <Table
              columns={sgColumns}
              data={sgUsers}
              hoverable
              emptyMessage="Aucun Surveillant Général trouvé"
            />
          )}
        </Card>
      </div>

      {/* Teachers Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span className="bg-success-100 text-success-700 p-1 rounded">F</span>
          Formateurs
          <Badge variant="success" size="sm">{teacherUsers.length}</Badge>
        </h2>
        <Card padding={false}>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : (
            <Table
              columns={teacherColumns}
              data={teacherUsers}
              hoverable
              emptyMessage="Aucun Formateur trouvé"
            />
          )}
        </Card>
      </div>

      {/* Modals */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmer la suppression"
        size="md"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Annuler</Button>
            <Button variant="danger" onClick={handleDelete}>Supprimer</Button>
          </div>
        }
      >
        <Alert type="warning">
          Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{selectedUser?.email}</strong> ?
          Cette action est irréversible.
        </Alert>
      </Modal>

      <Modal
        isOpen={showResetPasswordModal}
        onClose={() => setShowResetPasswordModal(false)}
        title="Réinitialiser le mot de passe"
        size="md"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowResetPasswordModal(false)}>Annuler</Button>
            <Button variant="primary" onClick={handleResetPassword}>Réinitialiser</Button>
          </div>
        }
      >
        <Alert type="info">
          Un nouveau mot de passe sera généré et envoyé à <strong>{selectedUser?.email}</strong>.
        </Alert>
      </Modal>

      <GroupManagementModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        teacher={selectedUser}
        onSave={() => {
          setSuccess('Groupes mis à jour avec succès');
          fetchUsers(); // Refresh list
        }}
      />

      <ScheduleUploadModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        teacher={selectedUser}
        onSave={() => setSuccess('Emploi du temps mis à jour avec succès')}
      />
    </div>
  );
};

export default ManageUsers;
