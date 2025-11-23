import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import userService from '../../services/userService';
import { UserPlusIcon, EyeIcon, EyeSlashIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal'; // Added Modal import
import { USER_ROLES } from '../../utils/constants';
import { ROUTES } from '../../utils/constants'; // Added ROUTES import

const AddUser = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(''); // This state will be removed or repurposed
  const [error, setError] = useState('');

  const [showPasswordModal, setShowPasswordModal] = useState(false); // Added state for modal
  const [createdUser, setCreatedUser] = useState(null); // Added state for created user info
  const [generatedPassword, setGeneratedPassword] = useState(''); // Added state for generated password

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    matricule: '',
    role: USER_ROLES.TEACHER,
    password: '',
    confirmPassword: '',
  });

  const roleOptions = [
    { value: USER_ROLES.SG, label: 'Surveillant Général' },
    { value: USER_ROLES.TEACHER, label: 'Formateur' },
  ];

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ 
      ...prev, 
      password, 
      confirmPassword: password 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(''); // This will no longer be used for success message

    // Validation
    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);

    try {
      await userService.createUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        matricule: formData.matricule,
        password: formData.password,
        role: formData.role
      });

      setCreatedUser({ 
        name: `${formData.firstName} ${formData.lastName}`, 
        email: formData.email, 
        role: formData.role 
      });
      setGeneratedPassword(formData.password);
      setShowPasswordModal(true);
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        matricule: '',
        role: USER_ROLES.TEACHER,
        password: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors de la création de l\'utilisateur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ajouter un Utilisateur</h1>
          <p className="text-gray-600 mt-1">Créer un nouveau compte utilisateur</p>
        </div>
        <Button 
          variant="secondary" 
          onClick={() => navigate('/admin/gerer')}
        >
          Voir tous les utilisateurs
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

      {/* Add User Form */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 desktop:grid-cols-2 gap-6">
            {/* First Name */}
            <Input
              label="Prénom"
              type="text"
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              placeholder="Ex: Mohamed"
              required
            />

            {/* Last Name */}
            <Input
              label="Nom"
              type="text"
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              placeholder="Ex: Alami"
              required
            />

            {/* Matricule (Only for Teachers) */}
            {formData.role === USER_ROLES.TEACHER && (
              <Input
                label="Matricule"
                type="text"
                value={formData.matricule}
                onChange={(e) => handleChange('matricule', e.target.value)}
                placeholder="Ex: 12345"
                required
              />
            )}

            {/* Email */}
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="Ex: user@ofppt.ma"
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

            {/* Generate Password Button */}
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                onClick={generatePassword}
                className="w-full"
              >
                <UserPlusIcon className="h-5 w-5 mr-2" />
                Générer un mot de passe
              </Button>
            </div>

            {/* Password */}
            <Input
              label="Mot de passe"
              type="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Minimum 8 caractères"
              helperText="Le mot de passe doit contenir au moins 8 caractères"
              required
            />

            {/* Confirm Password */}
            <Input
              label="Confirmer le mot de passe"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              placeholder="Confirmer le mot de passe"
              required
            />
          </div>

          {/* Info Alert */}
          <Alert type="info">
            L'utilisateur recevra ses identifiants par email et devra changer son mot de passe lors de sa première connexion.
          </Alert>

          {/* Submit Buttons */}
          <div className="flex gap-4 justify-end pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/admin/menu')}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
            >
              Créer l'utilisateur
            </Button>
          </div>
        </form>
      </Card>

      {/* Success Modal with Password */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          navigate(ROUTES.ADMIN.MANAGE_USERS);
        }}
        title="Utilisateur créé avec succès"
        size="md"
        footer={
          <Button 
            variant="primary" 
            onClick={() => {
              setShowPasswordModal(false);
              navigate(ROUTES.ADMIN.MANAGE_USERS);
            }}
          >
            Terminer
          </Button>
        }
      >
        <div className="space-y-4">
          <Alert type="success">
            Le compte a été créé avec succès. Veuillez copier les identifiants ci-dessous.
          </Alert>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
            <div>
              <label className="text-xs text-gray-500 uppercase font-semibold">Nom</label>
              <p className="text-gray-900 font-medium">{createdUser?.name}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase font-semibold">Email</label>
              <p className="text-gray-900 font-medium">{createdUser?.email}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase font-semibold">Mot de passe</label>
              <div className="flex items-center gap-2">
                <p className="text-primary-600 font-bold text-lg font-mono">{generatedPassword}</p>
                <button 
                  onClick={() => navigator.clipboard.writeText(generatedPassword)}
                  className="text-gray-400 hover:text-primary-600 transition-colors"
                  title="Copier le mot de passe"
                >
                  <ClipboardDocumentIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 italic">
            Note: L'utilisateur devra changer ce mot de passe lors de sa première connexion.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default AddUser;
