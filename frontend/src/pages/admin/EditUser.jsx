import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Loader from '../../components/ui/Loader';
import { USER_ROLES, ROUTES } from '../../utils/constants';
import userService from '../../services/userService';

const EditUser = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    status: 'active'
  });

  const roleOptions = [
    { value: USER_ROLES.ADMIN, label: 'Administrateur' },
    { value: USER_ROLES.SG, label: 'Surveillant Général' },
    { value: USER_ROLES.TEACHER, label: 'Formateur' },
  ];

  const statusOptions = [
    { value: 'active', label: 'Actif' },
    { value: 'inactive', label: 'Inactif' },
  ];

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        // We need to know the role to fetch from the correct endpoint
        // For now, we'll try to get it from the URL or make a generic call
        // This is a limitation of having separate endpoints
        const response = await userService.getUserById(id, 'admin'); // TODO: Determine role
        const userData = response.data;
        
        setUser(userData);
        setFormData({
          name: userData.name,
          email: userData.email,
          role: userData.role,
          status: userData.status || 'active'
        });
      } catch (err) {
        setError('Erreur lors du chargement de l\'utilisateur');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await userService.updateUser(id, formData, user.role);
      navigate(ROUTES.ADMIN.MANAGE_USERS);
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader fullScreen text="Chargement..." />;
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <Alert type="error">Utilisateur introuvable</Alert>
        <Button onClick={() => navigate(ROUTES.ADMIN.MANAGE_USERS)}>
          Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate(ROUTES.ADMIN.MANAGE_USERS)}
          className="p-2"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Modifier l'utilisateur</h1>
          <p className="text-gray-600 mt-1">Mettre à jour les informations de {user.name}</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Alert type="error" dismissible onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Edit Form */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 desktop:grid-cols-2 gap-6">
            {/* Name */}
            <Input
              label="Nom complet"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />

            {/* Email */}
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
            />

            {/* Role */}
            <Select
              label="Rôle"
              value={formData.role}
              onChange={(value) => handleChange('role', value)}
              options={roleOptions}
              required
            />

            {/* Status */}
            <Select
              label="Statut"
              value={formData.status}
              onChange={(value) => handleChange('status', value)}
              options={statusOptions}
              required
            />
          </div>

          {/* Info Alert */}
          <Alert type="info">
            Les modifications seront appliquées immédiatement. L'utilisateur sera notifié par email.
          </Alert>

          {/* Submit Buttons */}
          <div className="flex gap-4 justify-end pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(ROUTES.ADMIN.MANAGE_USERS)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={saving}
            >
              Enregistrer les modifications
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default EditUser;
